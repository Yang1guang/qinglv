/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/effects.js
 * 作用: 动效中枢、高稳定单曲直连播放引擎、无死角流播
 */

class EffectsEngine {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.bgmAudio = null;
    this.isPlaying = false;

    this.fireworksCanvas = document.getElementById("fireworks-canvas");
    this.fwCtx = this.fireworksCanvas ? this.fireworksCanvas.getContext("2d") : null;
    this.fireworks = [];
    this.confettiParticles = [];

    this.init();
  }

  getNormalizedAudioConfig() {
    const audioCfg = this.config.audio || {};
    return {
      title: audioCfg.bgmTitle || "告白气球 (浪漫钢琴版)",
      artist: audioCfg.bgmArtist || "周杰伦",
      // 默认走本地代理，杜绝直接暴漏网易云被拦截
      url: audioCfg.bgmUrl || "/api/love/music-stream?netease_id=440208476",
      cover: audioCfg.vinylCover || ""
    };
  }

  init() {
    this.initAudioPlayer();
    this.initCanvasSize();
    this.initEventListeners();
    this.updateTrackInfoDisplay();

    // 交互唤醒手势，解除所有浏览器的防静音拦截
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
    const track = this.getNormalizedAudioConfig();
    if (this.bgmAudio && this.bgmAudio.src !== track.url) {
      this.bgmAudio.src = track.url;
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
      const track = this.getNormalizedAudioConfig();
      this.bgmAudio = new Audio(track.url);
      this.bgmAudio.preload = "auto";
      this.bgmAudio.loop = true; // 单曲稳定循环

      this.bgmAudio.addEventListener("play", () => {
        this.isPlaying = true;
        this.setVinylVisualPlaying(true);
      });

      this.bgmAudio.addEventListener("pause", () => {
        this.isPlaying = false;
        this.setVinylVisualPlaying(false);
      });

      this.bgmAudio.addEventListener("error", () => {
        console.warn("当前背景音乐流加载受阻，正在安全挂起...");
        this.isPlaying = false;
        this.setVinylVisualPlaying(false);
      });
    }
  }

  playBgm() {
    if (!this.bgmAudio) return;
    this.bgmAudio.play().then(() => {
      this.isPlaying = true;
      this.setVinylVisualPlaying(true);
    }).catch((err) => {
      this.isPlaying = false;
      this.setVinylVisualPlaying(false);
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
    const track = this.getNormalizedAudioConfig();
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
  }

  initEventListeners() {
    const disc = document.getElementById("vinyl-disc");
    const toggleBtn = document.getElementById("audio-toggle-btn");

    if (disc) disc.onclick = () => this.toggleBgm();
    if (toggleBtn) toggleBtn.onclick = () => this.toggleBgm();
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
}

window.Effects = new EffectsEngine();
