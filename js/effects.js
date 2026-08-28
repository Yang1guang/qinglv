/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/effects.js
 * 作用: 动效中枢、多曲目播放列表引擎、自动连播与黑胶唱针联动
 */

class EffectsEngine {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.bgmAudio = null;
    this.isPlaying = false;
    this.playlist = [];
    this.currentIndex = 0;
    this.playMode = "list-loop"; // "list-loop" | "single-loop" | "random"

    this.fireworksCanvas = document.getElementById("fireworks-canvas");
    this.fwCtx = this.fireworksCanvas ? this.fireworksCanvas.getContext("2d") : null;
    this.fireworks = [];
    this.confettiParticles = [];

    this.init();
  }

  loadPlaylistFromConfig() {
    const audioCfg = this.config.audio || {};
    this.playMode = audioCfg.playMode || "list-loop";

    if (Array.isArray(audioCfg.playlist) && audioCfg.playlist.length > 0) {
      this.playlist = audioCfg.playlist.filter(item => item && (item.url || item.title)).map(item => ({
        title: item.title || "浪漫背景音乐",
        artist: item.artist || "精选旋律",
        url: item.url || `/api/love/music-stream?title=${encodeURIComponent(item.title)}&artist=${encodeURIComponent(item.artist)}`,
        cover: item.cover || audioCfg.vinylCover || ""
      }));
    } else {
      const defaultTitle = audioCfg.bgmTitle || "告白气球 (浪漫钢琴版)";
      const defaultArtist = audioCfg.bgmArtist || "周杰伦";
      let defaultUrl = audioCfg.bgmUrl || "";

      if (!defaultUrl) {
        defaultUrl = `/api/love/music-stream?hash=E3A199727B40A5B73C4CE15CEE5FA41E&album_id=0&title=${encodeURIComponent(defaultTitle)}&artist=${encodeURIComponent(defaultArtist)}`;
      }

      this.playlist = [{
        title: defaultTitle,
        artist: defaultArtist,
        url: defaultUrl,
        cover: audioCfg.vinylCover || ""
      }];
    }

    if (this.currentIndex >= this.playlist.length) {
      this.currentIndex = 0;
    }
  }

  getCurrentTrack() {
    if (this.playlist.length === 0) {
      return { title: "浪漫背景音乐", artist: "精选旋律", url: "", cover: "" };
    }
    return this.playlist[this.currentIndex] || this.playlist[0];
  }

  init() {
    this.loadPlaylistFromConfig();
    this.initAudioPlayer();
    this.initCanvasSize();
    this.initEventListeners();
    this.updateTrackInfoDisplay();

    // 交互唤醒手势，解除所有浏览器的静音拦截
    const unlockAudio = () => {
      if (this.config.audio && this.config.audio.bgmAutoPlay !== false && !this.isPlaying) {
        this.playBgm();
      }
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });

    window.addEventListener("resize", () => this.initCanvasSize());
    this.startAnimationLoop();
  }

  updateConfig(newConfig) {
    this.config = newConfig || {};
    this.loadPlaylistFromConfig();
    const currentTrack = this.getCurrentTrack();

    if (this.bgmAudio && currentTrack.url && this.bgmAudio.src !== currentTrack.url) {
      this.bgmAudio.src = currentTrack.url;
      this.bgmAudio.load();
    }
    this.updateTrackInfoDisplay();
  }

  initCanvasSize() {
    if (this.fireworksCanvas) {
      this.fireworksCanvas.width = window.innerWidth;
      this.fireworksCanvas.height = window.innerHeight;
    }
  }

  initAudioPlayer() {
    if (!this.bgmAudio) {
      const currentTrack = this.getCurrentTrack();
      this.bgmAudio = new Audio(currentTrack.url);
      this.bgmAudio.preload = "auto";
      this.bgmAudio.loop = false; // 采用事件驱动连播

      this.bgmAudio.addEventListener("play", () => {
        this.isPlaying = true;
        this.setVinylVisualPlaying(true);
      });

      this.bgmAudio.addEventListener("pause", () => {
        this.isPlaying = false;
        this.setVinylVisualPlaying(false);
      });

      // 歌曲播放完毕，触发自动连播管线
      this.bgmAudio.addEventListener("ended", () => {
        this.handleTrackEnded();
      });

      // 精准拦截音频加载失败，平稳隔离，并尝试轮换下一首
      this.bgmAudio.addEventListener("error", () => {
        this.isPlaying = false;
        this.setVinylVisualPlaying(false);
        console.warn(`[音频系统] 当前曲目《${this.getCurrentTrack().title}》加载受阻，正在检查后续曲目...`);
        
        if (this.playlist.length > 1) {
          setTimeout(() => {
            this.playNext(true);
          }, 1500);
        }
      });
    }
  }

  handleTrackEnded() {
    if (this.playMode === "single-loop") {
      this.bgmAudio.currentTime = 0;
      this.playBgm();
    } else if (this.playMode === "random") {
      if (this.playlist.length > 1) {
        let nextIdx = Math.floor(Math.random() * this.playlist.length);
        if (nextIdx === this.currentIndex) {
          nextIdx = (nextIdx + 1) % this.playlist.length;
        }
        this.playIndex(nextIdx);
      } else {
        this.bgmAudio.currentTime = 0;
        this.playBgm();
      }
    } else {
      // 默认列表循环 list-loop
      this.playNext(true);
    }
  }

  playIndex(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIndex = index;
    const track = this.getCurrentTrack();

    if (!this.bgmAudio) {
      this.initAudioPlayer();
    }

    this.bgmAudio.src = track.url;
    this.bgmAudio.load();
    this.updateTrackInfoDisplay();
    this.playBgm();
    this.showMiniToast(`🎵 正在播放: ${track.title} - ${track.artist}`);
  }

  playNext(autoPlay = true) {
    if (this.playlist.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    const track = this.getCurrentTrack();

    if (this.bgmAudio) {
      this.bgmAudio.src = track.url;
      this.bgmAudio.load();
    }
    this.updateTrackInfoDisplay();
    if (autoPlay) {
      this.playBgm();
    }
    this.showMiniToast(`⏭️ 下一首: ${track.title}`);
  }

  playPrev(autoPlay = true) {
    if (this.playlist.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    const track = this.getCurrentTrack();

    if (this.bgmAudio) {
      this.bgmAudio.src = track.url;
      this.bgmAudio.load();
    }
    this.updateTrackInfoDisplay();
    if (autoPlay) {
      this.playBgm();
    }
    this.showMiniToast(`⏮️ 上一首: ${track.title}`);
  }

  playBgm() {
    if (!this.bgmAudio || !this.bgmAudio.src) return;

    if (this.bgmAudio.error) {
      this.isPlaying = false;
      this.setVinylVisualPlaying(false);
      return;
    }

    this.bgmAudio.play().then(() => {
      this.isPlaying = true;
      this.setVinylVisualPlaying(true);
    }).catch((err) => {
      this.isPlaying = false;
      this.setVinylVisualPlaying(false);
      if (err.name !== "NotAllowedError") {
        console.warn("播放受阻 (已平稳隔离):", err.message);
      }
    });
  }

  pauseBgm() {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
    this.isPlaying = false;
    this.setVinylVisualPlaying(false);
  }

  toggleBgm() {
    if (this.isPlaying) {
      this.pauseBgm();
    } else {
      this.playBgm();
    }
  }

  setVinylVisualPlaying(playing) {
    const disc = document.getElementById("vinyl-disc");
    const toggleBtn = document.getElementById("audio-toggle-btn");

    if (disc) {
      if (playing) {
        disc.classList.add("vinyl-disc--playing");
      } else {
        disc.classList.remove("vinyl-disc--playing");
      }
    }
    if (toggleBtn) {
      toggleBtn.textContent = playing ? "⏸️" : "🎵";
    }
    this.setNeedleState(playing);
  }

  setNeedleState(onDisc) {
    const needle = document.getElementById("vinyl-needle");
    if (needle) {
      if (onDisc) {
        needle.classList.add("vinyl-needle--play");
      } else {
        needle.classList.remove("vinyl-needle--play");
      }
    }
  }

  updateTrackInfoDisplay() {
    const track = this.getCurrentTrack();
    const coverImg = document.getElementById("vinyl-cover");
    const defaultHeart = document.querySelector(".vinyl-player__default-heart");

    if (coverImg) {
      if (track.cover) {
        coverImg.src = track.cover;
        coverImg.style.display = "block";
        if (defaultHeart) defaultHeart.style.display = "none";
      } else {
        coverImg.style.display = "none";
        if (defaultHeart) defaultHeart.style.display = "block";
      }
    }

    const titleEl = document.getElementById("vinyl-title-display") || document.querySelector(".vinyl-song-title");
    const artistEl = document.getElementById("vinyl-artist-display") || document.querySelector(".vinyl-song-artist");
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
  }

  showMiniToast(text) {
    const toast = document.getElementById("toast") || document.createElement("div");
    toast.className = "admin-toast show";
    toast.textContent = text;
    if (!document.body.contains(toast)) document.body.appendChild(toast);
    setTimeout(() => toast.classList.remove("show"), 2800);
  }

  initEventListeners() {
    const disc = document.getElementById("vinyl-disc");
    const toggleBtn = document.getElementById("audio-toggle-btn");
    const nextBtn = document.getElementById("audio-next-btn");
    const prevBtn = document.getElementById("audio-prev-btn");

    if (disc) disc.onclick = () => this.toggleBgm();
    if (toggleBtn) toggleBtn.onclick = () => this.toggleBgm();
    if (nextBtn) nextBtn.onclick = () => this.playNext(true);
    if (prevBtn) prevBtn.onclick = () => this.playPrev(true);
  }

  playAudio(soundName) {
    const soundMap = {
      gatekeeperPass: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
      gatekeeperError: "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3",
      stamp: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      scratch: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
      flip: "https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3"
    };

    const url = soundMap[soundName];
    if (url) {
      try {
        const snd = new Audio(url);
        snd.volume = 0.6;
        snd.play().catch(() => {});
      } catch (_) {}
    }
  }

  fireFireworks() {
    if (!this.fwCtx) return;
    const colors = ["#f43f5e", "#f59e0b", "#38bdf8", "#a855f7", "#ec4899", "#ffffff"];
    for (let f = 0; f < 5; f++) {
      setTimeout(() => {
        const x = window.innerWidth * (0.2 + Math.random() * 0.6);
        const y = window.innerHeight * (0.2 + Math.random() * 0.4);
        for (let i = 0; i < 45; i++) {
          const angle = (Math.PI * 2 * i) / 45;
          const speed = Math.random() * 5 + 2;
          this.fireworks.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            radius: Math.random() * 2.5 + 1.2
          });
        }
      }, f * 180);
    }
  }

  fireConfetti() {
    if (!this.fwCtx) return;
    const colors = ["#fb7185", "#fde68a", "#a7f3d0", "#bae6fd", "#fbcfe8"];
    for (let i = 0; i < 70; i++) {
      this.confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }
  }

  startAnimationLoop() {
    const loop = () => {
      if (this.fwCtx) {
        this.fwCtx.clearRect(0, 0, this.fireworksCanvas.width, this.fireworksCanvas.height);

        for (let i = this.fireworks.length - 1; i >= 0; i--) {
          const p = this.fireworks[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.alpha -= 0.015;

          if (p.alpha <= 0) {
            this.fireworks.splice(i, 1);
          } else {
            this.fwCtx.beginPath();
            this.fwCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.fwCtx.fillStyle = p.color;
            this.fwCtx.globalAlpha = p.alpha;
            this.fwCtx.shadowColor = p.color;
            this.fwCtx.shadowBlur = 8;
            this.fwCtx.fill();
            this.fwCtx.shadowBlur = 0;
          }
        }

        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
          const c = this.confettiParticles[i];
          c.x += c.vx;
          c.y += c.vy;
          c.rotation += c.rotSpeed;
          c.alpha -= 0.008;

          if (c.y > window.innerHeight || c.alpha <= 0) {
            this.confettiParticles.splice(i, 1);
          } else {
            this.fwCtx.save();
            this.fwCtx.translate(c.x, c.y);
            this.fwCtx.rotate((c.rotation * Math.PI) / 180);
            this.fwCtx.fillStyle = c.color;
            this.fwCtx.globalAlpha = c.alpha;
            this.fwCtx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
            this.fwCtx.restore();
          }
        }
        this.fwCtx.globalAlpha = 1;
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  escape(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

window.Effects = new EffectsEngine();
