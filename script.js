class SoundBoard {
  constructor() {
    this.sounds = {};
    this.currentSound = null;
    this.soundBoard = document.getElementById("soundBoard");
    this.soundClipsPath = "https://sfx-board.b-cdn.net/";

    // Increase Howler's HTML5 audio pool size to handle more concurrent sounds
    Howler.html5PoolSize = 32;

    this.soundBoard.style.display = "grid";
    this.soundBoard.style.gridTemplateColumns =
      "repeat(auto-fit, minmax(280px, 1fr))";
    this.soundBoard.style.gap = "24px";
    this.soundBoard.style.maxWidth = "1200px";
    this.soundBoard.style.margin = "0 auto";
    this.soundBoard.style.padding = "";

    this.soundClips = [];
    this.audioContextUnlocked = false;
    this.loaded = false;
  }

  async init() {
    await this.loadSoundClips();
    await this.loadSounds();
    this.createSoundButtons();
  }

  async loadSoundClips() {
    try {
      const response = await fetch("soundclips.json");
      const data = await response.json();
      this.soundClips = data.clips;
    } catch (error) {
      console.error("Error loading sound clips:", error);
    }
  }

  async loadSounds() {
    // Create Howl instances without preloading to avoid exhausting the audio pool
    // Sounds will be loaded lazily when first played
    this.soundClips.forEach((clip) => {
      const sound = new Howl({
        src: [this.soundClipsPath + clip.file],
        loop: false,
        html5: true,
        preload: false, // Lazy load - only load when first played
        onend: () => {
          if (!sound.loop()) {
            this.removePlayingStateForSound(sound);
            this.currentSound = null;
            this.addFinishedState(sound);
            setTimeout(() => {
              this.removeFinishedStateForSound(sound);
            }, 1000);
          }
        },
      });
      this.sounds[clip.name] = sound;
    });

    this.loaded = true;
    console.log("Sound instances created (will load on demand)");
  }

  createSoundButtons() {
    this.soundClips.forEach((clip) => {
      const soundClip = document.createElement("article");
      soundClip.className = "sound-clip";

      soundClip.innerHTML = `
                <span class="clip-name">${clip.name}</span>
            `;

      soundClip.addEventListener("click", (e) =>
        this.handleClick(e, clip.name)
      );
      soundClip.addEventListener("dblclick", (e) =>
        this.handleDoubleClick(e, clip.name)
      );

      this.soundBoard.appendChild(soundClip);
    });
  }

  handleClick(e, soundName) {
    if (!this.audioContextUnlocked && Howler.ctx.state === "suspended") {
      Howler.ctx.resume();
      this.audioContextUnlocked = true;
    }

    const sound = this.sounds[soundName];
    const element = e.currentTarget;

    if (this.currentSound && this.currentSound !== sound) {
      this.currentSound.stop();
      this.removePlayingState();
    }

    element.classList.remove("finished");

    if (!sound.playing()) {
      sound.play();
      this.removePlayingState();
      this.removeFinishedState();
      element.classList.add("playing");
      this.currentSound = sound;
    } else {
      sound.stop();
      element.classList.remove("playing");
      this.currentSound = null;
    }
  }

  handleDoubleClick(e, soundName) {
    const sound = this.sounds[soundName];
    const element = e.currentTarget;
    const loopIndicator = element.querySelector(".loop-indicator");

    sound.loop(!sound.loop());
    loopIndicator.style.display = sound.loop() ? "block" : "none";
  }

  removePlayingState() {
    const playingClips = document.querySelectorAll(".sound-clip.playing");
    playingClips.forEach((clip) => clip.classList.remove("playing"));
  }

  removePlayingStateForSound(sound) {
    const clips = document.querySelectorAll(".sound-clip");
    clips.forEach((clip) => {
      const clipName = clip.querySelector(".clip-name").textContent;
      if (this.sounds[clipName] === sound) {
        clip.classList.remove("playing");
      }
    });
  }

  addFinishedState(sound) {
    const clips = document.querySelectorAll(".sound-clip");
    clips.forEach((clip) => {
      const clipName = clip.querySelector(".clip-name").textContent;
      if (this.sounds[clipName] === sound) {
        clip.classList.add("finished");
      }
    });
  }

  removeFinishedState() {
    const finishedClips = document.querySelectorAll(".sound-clip.finished");
    finishedClips.forEach((clip) => clip.classList.remove("finished"));
  }

  removeFinishedStateForSound(sound) {
    const clips = document.querySelectorAll(".sound-clip");
    clips.forEach((clip) => {
      const clipName = clip.querySelector(".clip-name").textContent;
      if (this.sounds[clipName] === sound) {
        clip.classList.remove("finished");
      }
    });
  }
}

// Initialize the sound board when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const soundBoard = new SoundBoard();
  soundBoard.init();
});
