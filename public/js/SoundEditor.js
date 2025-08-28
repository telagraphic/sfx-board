/**
 * SoundEditor - Class for managing the sound upload and editing interface
 * 
 * This class handles:
 * - File upload with drag & drop support
 * - YouTube URL processing
 * - Tab switching between upload methods
 * - File validation and processing
 * - Status messaging and user feedback
 */
export class SoundEditor {
    constructor() {
        this.init();
    }

    /**
     * Initialize the editor interface
     */
    init() {
        this.initElements();
        this.initEventListeners();
    }

    /**
     * Initialize DOM element references
     */
    initElements() {
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
    }

    /**
     * Initialize event listeners for all interactive elements
     */
    initEventListeners() {
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
}
