/**
 * SoundBoard - Main class for managing the interactive sound effects board
 * 
 * This class handles:
 * - Loading sound clip metadata from JSON
 * - Creating interactive sound buttons
 * - Managing audio playback with lazy loading
 * - Handling user interactions (click, double-click)
 * - Managing visual states (playing, finished, loading)
 * - Upload modal for new sounds (file upload and YouTube URLs)
 * 
 * The class uses native HTML5 Audio API for reliable audio playback
 * and implements lazy loading to only download audio files when needed.
 */
class SoundBoard {
    /**
     * Initialize the SoundBoard with default settings and DOM elements
     * 
     * Sets up the grid layout for sound buttons and initializes
     * internal state variables for audio management.
     */
    constructor() {
        this.sounds = {};                    // Cache of loaded audio objects
        this.currentSound = null;            // Currently playing sound
        this.soundBoard = document.getElementById('soundBoard');
        
        // Configure grid layout for responsive sound button display
        this.soundBoard.style.display = 'grid';
        this.soundBoard.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        this.soundBoard.style.gap = '24px';
        this.soundBoard.style.maxWidth = '1200px';
        this.soundBoard.style.margin = '0 auto';
        this.soundBoard.style.padding = '40px 20px';
        
        this.soundClips = [];                // Array of clip metadata from JSON
        this.init();
        this.initModal();
    }

    /**
     * Initialize the soundboard by loading metadata and creating UI
     * 
     * This is the main initialization sequence:
     * 1. Load sound clip metadata from soundclips.json
     * 2. Create interactive sound buttons for each clip
     * 
     * Note: Audio files are NOT loaded here - they're loaded on-demand
     * when users click play buttons (lazy loading).
     */
    async init() {
        await this.loadSoundClips();
        this.createSoundButtons();
    }

    /**
     * Initialize the upload modal functionality
     * 
     * Sets up event listeners for:
     * - Modal open/close
     * - Tab switching
     * - File upload handling
     * - Drag and drop
     * - YouTube URL processing
     */
    initModal() {
        // Modal elements
        this.modal = document.getElementById('uploadModal');
        this.addSoundBtn = document.getElementById('addSoundButton');
        this.closeModalBtn = document.getElementById('closeModal');
        
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.uploadTab = document.getElementById('uploadTab');
        this.youtubeTab = document.getElementById('youtubeTab');
        
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.browseBtn = this.uploadArea.querySelector('.browse-btn');
        
        // YouTube elements
        this.youtubeUrlInput = document.getElementById('youtubeUrl');
        this.downloadYoutubeBtn = document.getElementById('downloadYoutube');
        this.youtubeStatus = document.getElementById('youtubeStatus');
        
        // Event listeners
        this.addSoundBtn.addEventListener('click', () => this.openModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // File upload
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // YouTube download
        this.downloadYoutubeBtn.addEventListener('click', () => this.handleYouTubeDownload());
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    /**
     * Open the upload modal
     */
    openModal() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    /**
     * Close the upload modal
     */
    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        this.resetModal();
    }

    /**
     * Reset modal state and clear inputs
     */
    resetModal() {
        this.youtubeUrlInput.value = '';
        this.youtubeStatus.innerHTML = '';
        this.youtubeStatus.className = 'youtube-status';
        this.fileList.innerHTML = '';
        this.fileInput.value = '';
        this.switchTab('upload'); // Reset to upload tab
    }

    /**
     * Switch between upload and YouTube tabs
     * 
     * @param {string} tabName - The tab to switch to ('upload' or 'youtube')
     */
    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        this.uploadTab.classList.toggle('active', tabName === 'upload');
        this.youtubeTab.classList.toggle('active', tabName === 'youtube');
    }

    /**
     * Handle file selection from file input
     * 
     * @param {Event} e - The change event from file input
     */
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    /**
     * Handle drag over event for drag and drop
     * 
     * @param {Event} e - The dragover event
     */
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    /**
     * Handle drag leave event for drag and drop
     * 
     * @param {Event} e - The dragleave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    /**
     * Handle drop event for drag and drop
     * 
     * @param {Event} e - The drop event
     */
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    /**
     * Process selected files and display them in the file list
     * 
     * @param {File[]} files - Array of File objects to process
     */
    processFiles(files) {
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));
        
        if (audioFiles.length === 0) {
            this.showYouTubeStatus('Please select audio files only.', 'error');
            return;
        }
        
        audioFiles.forEach(file => {
            this.addFileToList(file);
        });
    }

    /**
     * Add a file to the file list display
     * 
     * @param {File} file - The File object to add
     */
    addFileToList(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileSize = this.formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <i class="fas fa-music"></i>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
            <div class="file-actions">
                <button class="upload-btn">Upload</button>
                <button class="remove-btn">Remove</button>
            </div>
        `;
        
        // Add event listeners
        const uploadBtn = fileItem.querySelector('.upload-btn');
        const removeBtn = fileItem.querySelector('.remove-btn');
        
        uploadBtn.addEventListener('click', () => this.uploadFile(file));
        removeBtn.addEventListener('click', () => fileItem.remove());
        
        this.fileList.appendChild(fileItem);
    }

    /**
     * Format file size in human-readable format
     * 
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Handle file upload (placeholder for server-side implementation)
     * 
     * @param {File} file - The file to upload
     */
    uploadFile(file) {
        // TODO: Implement actual file upload to server
        console.log('Uploading file:', file.name);
        
        // For now, just show success message
        this.showYouTubeStatus(`File "${file.name}" uploaded successfully!`, 'success');
        
        // Remove file from list
        const fileItem = this.fileList.querySelector(`[data-filename="${file.name}"]`);
        if (fileItem) fileItem.remove();
    }

    /**
     * Handle YouTube download button click
     */
    handleYouTubeDownload() {
        const url = this.youtubeUrlInput.value.trim();
        
        if (!url) {
            this.showYouTubeStatus('Please enter a YouTube URL.', 'error');
            return;
        }
        
        if (!this.isValidYouTubeUrl(url)) {
            this.showYouTubeStatus('Please enter a valid YouTube URL.', 'error');
            return;
        }
        
        this.downloadYoutubeBtn.disabled = true;
        this.downloadYoutubeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        
        // TODO: Implement actual YouTube download on server
        // For now, simulate the process
        setTimeout(() => {
            this.showYouTubeStatus('YouTube audio downloaded successfully!', 'success');
            this.downloadYoutubeBtn.disabled = false;
            this.downloadYoutubeBtn.innerHTML = '<i class="fas fa-download"></i> Download Audio';
        }, 2000);
    }

    /**
     * Validate YouTube URL format
     * 
     * @param {string} url - The URL to validate
     * @returns {boolean} True if valid YouTube URL
     */
    isValidYouTubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(url);
    }

    /**
     * Show status message in YouTube tab
     * 
     * @param {string} message - The message to display
     * @param {string} type - The message type ('success', 'error', 'info')
     */
    showYouTubeStatus(message, type) {
        this.youtubeStatus.textContent = message;
        this.youtubeStatus.className = `youtube-status ${type}`;
    }

    /**
     * Load sound clip metadata from the JSON configuration file
     * 
     * Fetches soundclips.json which contains an array of clip objects
     * with name and file URL properties. This metadata is used to
     * create the UI buttons and determine what audio files to load.
     * 
     * @throws {Error} If the JSON file cannot be fetched or parsed
     */
    async loadSoundClips() {
        try {
            const response = await fetch('soundclips.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.soundClips = data.clips;
        } catch (error) {
            console.error('Error loading sound clips:', error);
        }
    }

    /**
     * Load a single sound on-demand using native HTML5 Audio API
     * 
     * This method implements lazy loading - audio files are only downloaded
     * when users actually want to play them. It creates a native Audio object
     * and wraps it in an interface that mimics Howler.js for compatibility.
     * 
     * The method:
     * 1. Checks if sound is already loaded (returns cached version)
     * 2. Validates the audio URL is accessible
     * 3. Creates a native Audio instance
     * 4. Wraps it in a compatible interface
     * 5. Caches the result for future use
     * 
     * @param {string} clipName - The name of the sound clip to load
     * @returns {Promise<Object>} Promise that resolves to a sound wrapper object
     * @throws {Error} If the audio file cannot be loaded or times out
     */
    async loadSound(clipName) {
        // If already loaded, return existing sound
        if (this.sounds[clipName]) {
            return this.sounds[clipName];
        }

        // Find the clip data
        const clip = this.soundClips.find(c => c.name === clipName);
        if (!clip) {
            console.error('Clip not found:', clipName);
            return null;
        }

        // Test if the URL is accessible
        try {
            const testResponse = await fetch(clip.file, { method: 'HEAD' });
            if (!testResponse.ok) {
                throw new Error(`URL not accessible: ${testResponse.status}`);
            }
            
            // Create native HTML5 Audio instance
            return new Promise((resolve, reject) => {
                const audio = new Audio(clip.file);
                
                // Set up event listeners
                audio.addEventListener('canplaythrough', () => {
                    // Create a wrapper object that mimics Howler's interface
                    const soundWrapper = {
                        audio: audio,
                        playing: () => audio.ended ? false : !audio.paused,
                        play: () => {
                            audio.currentTime = 0; // Reset to start
                            return audio.play();
                        },
                        stop: () => {
                            audio.pause();
                            audio.currentTime = 0;
                        },
                        loop: (value) => {
                            if (value !== undefined) {
                                audio.loop = value;
                            }
                            return audio.loop;
                        },
                        // Add ended event listener
                        on: (event, callback) => {
                            if (event === 'end') {
                                audio.addEventListener('ended', callback);
                            }
                        }
                    };
                    
                    // Add ended event for state management
                    audio.addEventListener('ended', () => {
                        if (!audio.loop) {
                            this.removePlayingStateForSound(soundWrapper);
                            this.currentSound = null;
                            this.addFinishedState(soundWrapper);
                            setTimeout(() => {
                                this.removeFinishedStateForSound(soundWrapper);
                            }, 1000);
                        }
                    });
                    
                    this.sounds[clipName] = soundWrapper;
                    resolve(soundWrapper);
                });
                
                audio.addEventListener('error', (error) => {
                    console.error('Error loading sound:', clipName, error);
                    reject(error);
                });
                
                // Timeout for loading
                setTimeout(() => {
                    if (!this.sounds[clipName]) {
                        audio.remove(); // Clean up
                        reject(new Error('Loading timeout'));
                    }
                }, 10000);
            });
            
        } catch (error) {
            console.error('Error in loadSound:', error);
            throw error;
        }
    }

    /**
     * Create interactive sound buttons for each clip in the metadata
     * 
     * Dynamically generates HTML elements for each sound clip and
     * attaches event listeners for click (play/stop) and double-click (loop).
     * Each button displays the clip name and has visual indicators for
     * playing and loop states.
     * 
     * This method is called once during initialization and creates
     * the entire UI based on the loaded soundclips.json data.
     */
    createSoundButtons() {
        this.soundClips.forEach(clip => {
            const soundClip = document.createElement('article');
            soundClip.className = 'sound-clip';
            
            soundClip.innerHTML = `
                <span class="clip-name">${clip.name}</span>
            `;

            soundClip.addEventListener('click', (e) => this.handleClick(e, clip.name));
            soundClip.addEventListener('dblclick', (e) => this.handleDoubleClick(e, clip.name));
            
            this.soundBoard.appendChild(soundClip);
        });
    }

    /**
     * Handle click events on sound buttons (play/stop functionality)
     * 
     * This is the main interaction handler that:
     * 1. Loads the sound on-demand if not already loaded
     * 2. Manages play/stop states
     * 3. Handles stopping other currently playing sounds
     * 4. Updates visual states and CSS classes
     * 
     * The method implements lazy loading - sounds are only downloaded
     * when users first click them, improving initial page load performance.
     * 
     * @param {Event} e - The click event object
     * @param {string} soundName - The name of the sound to play/stop
     */
    async handleClick(e, soundName) {
        const element = e.currentTarget;

        // Check if sound is already loaded and playing
        let sound = this.sounds[soundName];
        
        if (!sound) {
            // Sound not loaded yet - show loading state
            element.classList.add('loading');
            
            try {
                // Load the sound on-demand
                sound = await this.loadSound(soundName);
                if (!sound) {
                    element.classList.remove('loading');
                    return;
                }
            } catch (error) {
                console.error('Error loading sound:', error);
                element.classList.remove('loading');
                return;
            }
        }

        // Remove loading state
        element.classList.remove('loading');

        // Stop any currently playing sound
        if (this.currentSound && this.currentSound !== sound) {
            this.currentSound.stop();
            this.removePlayingState();
        }

        element.classList.remove('finished');

        if (!sound.playing()) {
            sound.play();
            this.removePlayingState();
            this.removeFinishedState();
            element.classList.add('playing');
            this.currentSound = sound;
        } else {
            sound.stop();
            element.classList.remove('playing');
            this.currentSound = null;
        }
    }

    /**
     * Handle double-click events on sound buttons (loop functionality)
     * 
     * Toggles the loop state of a sound clip. If the sound isn't loaded,
     * it will be loaded first. The loop indicator icon visibility is
     * updated to show the current loop state.
     * 
     * @param {Event} e - The double-click event object
     * @param {string} soundName - The name of the sound to toggle loop for
     */
    async handleDoubleClick(e, soundName) {
        let sound = this.sounds[soundName];
        
        // If sound isn't loaded, load it first
        if (!sound) {
            try {
                sound = await this.loadSound(soundName);
                if (!sound) return;
            } catch (error) {
                console.error('Error loading sound for loop:', error);
                return;
            }
        }
        
        const element = e.currentTarget;
        const loopIndicator = element.querySelector('.loop-indicator');

        sound.loop(!sound.loop());
        loopIndicator.style.display = sound.loop() ? 'block' : 'none';
    }

    /**
     * Remove the 'playing' CSS class from all sound clips
     * 
     * This method is called when switching between sounds to ensure
     * only one sound appears as "playing" at a time. It's part of
     * the visual state management system.
     */
    removePlayingState() {
        const playingClips = document.querySelectorAll('.sound-clip.playing');
        playingClips.forEach(clip => clip.classList.remove('playing'));
    }

    /**
     * Remove the 'playing' CSS class from a specific sound's button
     * 
     * Used when a specific sound finishes playing to update its
     * visual state. This method finds the button by matching the
     * sound object reference.
     * 
     * @param {Object} sound - The sound object that finished playing
     */
    removePlayingStateForSound(sound) {
        const clips = document.querySelectorAll('.sound-clip');
        clips.forEach(clip => {
            const clipName = clip.querySelector('.clip-name').textContent;
            if (this.sounds[clipName] === sound) {
                clip.classList.remove('playing');
            }
        });
    }

    /**
     * Add the 'finished' CSS class to a sound's button
     * 
     * Called when a sound finishes playing to show a brief
     * visual indication. The 'finished' state is automatically
     * removed after 1 second to prepare for the next play.
     * 
     * @param {Object} sound - The sound object that finished playing
     */
    addFinishedState(sound) {
        const clips = document.querySelectorAll('.sound-clip');
        clips.forEach(clip => {
            const clipName = clip.querySelector('.clip-name').textContent;
            if (this.sounds[clipName] === sound) {
                clip.classList.add('finished');
            }
        });
    }

    /**
     * Remove the 'finished' CSS class from all sound clips
     * 
     * Called when starting a new sound to clear any lingering
     * 'finished' states from previous plays.
     */
    removeFinishedState() {
        const finishedClips = document.querySelectorAll('.sound-clip.finished');
        finishedClips.forEach(clip => clip.classList.remove('finished'));
    }

    /**
     * Remove the 'finished' CSS class from a specific sound's button
     * 
     * Used in the automatic cleanup of the 'finished' state
     * after the 1-second display period.
     * 
     * @param {Object} sound - The sound object to remove finished state from
     */
    removeFinishedStateForSound(sound) {
        const clips = document.querySelectorAll('.sound-clip');
        clips.forEach(clip => {
            const clipName = clip.querySelector('.clip-name').textContent;
            if (this.sounds[clipName] === sound) {
                clip.classList.remove('finished');
            }
        });
    }
}

// Initialize the sound board when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SoundBoard();
}); 