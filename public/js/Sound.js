/**
 * Sound - Class that wraps HTML5 Audio API for consistent interface
 * 
 * This class provides a clean wrapper around the native Audio API,
 * exposing methods that are compatible with the existing soundboard
 * functionality while adding better error handling and state management.
 */
export class Sound {
    /**
     * Create a new Sound instance
     * 
     * @param {string} url - The URL of the audio file
     * @param {string} name - The name/identifier for this sound
     */
    constructor(url, name) {
        this.url = url;
        this.name = name;
        this.audio = new Audio(url);
        this.isLoaded = false;
        this.isPlaying = false;
        this.isLooping = false;
        this.onEndCallback = null;
        
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the audio element
     */
    setupEventListeners() {
        // Audio loaded and ready to play
        this.audio.addEventListener('canplaythrough', () => {
            this.isLoaded = true;
        });

        // Audio started playing
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
        });

        // Audio paused or stopped
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
        });

        // Audio ended naturally
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        });

        // Audio error
        this.audio.addEventListener('error', (error) => {
            console.error(`Error with sound "${this.name}":`, error);
            this.isLoaded = false;
        });
    }

    /**
     * Check if the sound is currently playing
     * 
     * @returns {boolean} True if the sound is playing
     */
    playing() {
        return this.isPlaying && !this.audio.ended;
    }

    /**
     * Start playing the sound
     * 
     * @returns {Promise} Promise that resolves when playback starts
     */
    play() {
        if (!this.isLoaded) {
            return Promise.reject(new Error('Sound not loaded yet'));
        }

        // Reset to beginning if not looping
        if (!this.isLooping) {
            this.audio.currentTime = 0;
        }

        return this.audio.play();
    }

    /**
     * Stop the sound and reset to beginning
     */
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
    }

    /**
     * Get or set the loop state
     * 
     * @param {boolean} [value] - If provided, sets the loop state
     * @returns {boolean} Current loop state
     */
    loop(value) {
        if (value !== undefined) {
            this.isLooping = value;
            this.audio.loop = value;
        }
        return this.isLooping;
    }

    /**
     * Set a callback for when the sound ends
     * 
     * @param {string} event - The event type (only 'end' is supported)
     * @param {Function} callback - The callback function to execute
     */
    on(event, callback) {
        if (event === 'end') {
            this.onEndCallback = callback;
        }
    }

    /**
     * Check if the sound is fully loaded
     * 
     * @returns {boolean} True if the sound is ready to play
     */
    isReady() {
        return this.isLoaded;
    }

    /**
     * 
     * Get the duration of the audio in seconds
     * 
     * @returns {number} Duration in seconds, or NaN if not loaded
     */
    getDuration() {
        return this.audio.duration;
    }

    /**
     * Get the current playback position in seconds
     * 
     * @returns {number} Current position in seconds
     */
    getCurrentTime() {
        return this.audio.currentTime;
    }

    /**
     * Set the playback position
     * 
     * @param {number} time - Time in seconds
     */
    setCurrentTime(time) {
        this.audio.currentTime = time;
    }

    /**
     * 
     * Get or set the volume
     * 
     * @param {number} [value] - Volume level (0.0 to 1.0)
     * @returns {number} Current volume level
     */
    volume(value) {
        if (value !== undefined) {
            this.audio.volume = Math.max(0, Math.min(1, value));
        }
        return this.audio.volume;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.audio.remove();
        this.onEndCallback = null;
    }
}
