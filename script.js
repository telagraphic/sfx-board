class SoundBoard {
    constructor() {
        this.sounds = {};
        this.currentSound = null;
        this.soundBoard = document.getElementById('soundBoard');
        
        this.soundBoard.style.display = 'grid';
        this.soundBoard.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        this.soundBoard.style.gap = '24px';
        this.soundBoard.style.maxWidth = '1200px';
        this.soundBoard.style.margin = '0 auto';
        this.soundBoard.style.padding = '40px 20px';
        
        this.soundClips = [];
        this.init();
    }

    async init() {
        await this.loadSoundClips();
        this.loadSounds();
        this.createSoundButtons();
    }

    async loadSoundClips() {
        try {
            const response = await fetch('soundclips.json');
            const data = await response.json();
            this.soundClips = data.clips;
        } catch (error) {
            console.error('Error loading sound clips:', error);
        }
    }

    loadSounds() {
        this.soundClips.forEach(clip => {
            this.sounds[clip.name] = new Howl({
                src: [clip.file],
                loop: false
            });
        });
    }

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

    handleClick(e, soundName) {
        const sound = this.sounds[soundName];
        const element = e.currentTarget;

        // Stop current sound if playing
        if (this.currentSound && this.currentSound !== sound) {
            this.currentSound.stop();
            this.removePlayingState();
        }

        if (!sound.playing()) {
            sound.play();
            element.classList.add('playing');
            this.currentSound = sound;
        } else {
            sound.stop();
            element.classList.remove('playing');
            this.currentSound = null;
        }
    }

    handleDoubleClick(e, soundName) {
        const sound = this.sounds[soundName];
        const element = e.currentTarget;
        const loopIndicator = element.querySelector('.loop-indicator');

        sound.loop(!sound.loop());
        loopIndicator.style.display = sound.loop() ? 'block' : 'none';
    }

    removePlayingState() {
        const playingClips = document.querySelectorAll('.sound-clip.playing');
        playingClips.forEach(clip => clip.classList.remove('playing'));
    }
}

// Initialize the sound board when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SoundBoard();
}); 