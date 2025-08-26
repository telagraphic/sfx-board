/**
 * SoundBoard - Main class for managing the interactive sound effects board
 * 
 * This class handles:
 * - Loading sound clip metadata from JSON
 * - Creating interactive sound buttons
 * - Managing audio playback with lazy loading
 * - Handling user interactions (click, double-click)
 * - Managing visual states (playing, finished, loading)
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
                <i class="fas fa-waveform"></i>
                <span class="clip-name">${clip.name}</span>
                <span class="loop-indicator">
                    <i class="fas fa-repeat"></i>
                </span>
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