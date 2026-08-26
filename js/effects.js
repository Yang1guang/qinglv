/**
 * 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: js/effects.js
 */

class EffectsManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.audioCtx = null;
    this.bgm = null;
    this.isPlayingBgm = false;
    // 默认兜底：周杰伦 - 告白气球
    this.fallbackMusic = "https://music.163.com/song/media/outer/url?id=436514312.mp3";
  }

  init() {
    this.initStarrySky();
    this.initFireworksCanvas();
    this.initAudioSystem();
  }

  updateConfig(newConfig) {
    this.config = newConfig;
    if (this.bgm) {
      this.bgm.pause();
      this.isPlayingBgm = false;
      this.updateVinylUI(false);
    }
    this.initBgmInstance();
    // 如果后台设置为自动播放，则热更新后直接起播
    if (newConfig.audio?.bgmAutoPlay) {
      this.playBgm();
    }
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  /* ================= 音频播放与自动播放调度 ================= */
  initAudioSystem() {
    this.initBgmInstance();

    const toggleBtn = document.getElementById("audio-toggle-btn");
    const vinylDisc = document.getElementById("vinyl-disc");

    // 手动点击统一为切换（播放中点击则关闭，关闭中点击则开启）
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        this.ensureAudioContext();
        this.toggleBgm();
      };
    }

    if (vinylDisc) {
      vinylDisc.onclick = (e) => {
        e.stopPropagation();
        this.ensureAudioContext();
        this.toggleBgm();
      };
    }

    // 突破移动端浏览器安全策略：首次点击/触摸屏幕时若未起播则立即自动播放
    const autoPlayTrigger = () => {
      this.ensureAudioContext();
      if (this.config.audio?.bgmAutoPlay !== false && !this.isPlayingBgm) {
        this.playBgm();
      }
      window.removeEventListener("click", autoPlayTrigger);
      window.removeEventListener("touchstart", autoPlayTrigger);
      window.removeEventListener("keydown", autoPlayTrigger);
    };

    window.addEventListener("click", autoPlayTrigger);
    window.addEventListener("touchstart", autoPlayTrigger);
    window.addEventListener("keydown", autoPlayTrigger);

    // 页面加载完毕后尝试立即起播
    if (this.config.audio?.bgmAutoPlay !== false) {
      setTimeout(() => {
        this.playBgm();
      }, 300);
    }
  }

  initBgmInstance() {
    const audioCfg = this.config.audio || {};
    const coverEl = document.getElementById("vinyl-cover");

    if (coverEl) {
      if (audioCfg.vinylCover && audioCfg.vinylCover.trim()) {
        coverEl.src = audioCfg.vinylCover;
        coverEl.style.display = "block";
      } else {
        coverEl.style.display = "none";
      }
    }

    let targetUrl = (audioCfg.bgmUrl || "").trim();
    if (!targetUrl || targetUrl.startsWith("assets/")) {
      targetUrl = this.fallbackMusic;
    }

    this.bgm = new Audio(targetUrl);
    this.bgm.loop = true;
    this.bgm.preload = "auto";
  }

  toggleBgm() {
    if (this.isPlayingBgm) {
      this.pauseBgm();
    } else {
      this.playBgm();
    }
  }

  playBgm() {
    if (!this.bgm) this.initBgmInstance();

    const doPlay = () => {
      return this.bgm.play().then(() => {
        this.isPlayingBgm = true;
        this.updateVinylUI(true);
      });
    };

    doPlay().catch(() => {
      // 灾备切换
      this.bgm = new Audio(this.fallbackMusic);
      this.bgm.loop = true;
      this.bgm.play().then(() => {
        this.isPlayingBgm = true;
        this.updateVinylUI(true);
      }).catch(() => {
        this.isPlayingBgm = false;
        this.updateVinylUI(false);
      });
    });
  }

  pauseBgm() {
    if (!this.bgm) return;
    this.bgm.pause();
    this.isPlayingBgm = false;
    this.updateVinylUI(false);
  }

  updateVinylUI(isPlaying) {
    const disc = document.getElementById("vinyl-disc");
    const needle = document.getElementById("vinyl-needle");
    const btn = document.getElementById("audio-toggle-btn");

    if (disc) disc.classList.toggle("vinyl-player__disc--spinning", isPlaying);
    if (needle) needle.classList.toggle("vinyl-player__needle--play", isPlaying);
    if (btn) btn.textContent = isPlaying ? "⏸️" : "🎵";
  }

  /* ================= 物理合成音效 ================= */
  playAudio(soundType) {
    try {
      this.ensureAudioContext();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (soundType === "gatekeeperPass") {
        [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0, now + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.12, now + i * 0.06 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.85);
        });
      } else if (soundType === "gatekeeperError") {
        [220, 180].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.1, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.2);
        });
      } else if (soundType === "stamp") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.16);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (soundType === "scratch" || soundType === "flip") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (_) {}
  }

  /* ================= 星空与烟花 ================= */
  initStarrySky() {
    const canvas = document.getElementById("starry-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createStars();
    });

    const stars = [];
    const starCount = Math.floor((width * height) / 6500);

    const createStars = () => {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.3,
          alpha: Math.random(),
          speed: Math.random() * 0.02 + 0.005,
          increasing: Math.random() > 0.5,
        });
      }
    };
    createStars();

    const meteors = [];
    const spawnMeteor = () => {
      if (meteors.length < 2 && Math.random() < 0.035) {
        meteors.push({
          x: Math.random() * width + width * 0.2,
          y: Math.random() * (height * 0.4),
          len: Math.random() * 80 + 110,
          speed: Math.random() * 8 + 6,
          angle: (Math.PI / 4) * (1 + (Math.random() * 0.2 - 0.1)),
          alpha: 1,
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        if (star.increasing) {
          star.alpha += star.speed;
          if (star.alpha >= 1) star.increasing = false;
        } else {
          star.alpha -= star.speed;
          if (star.alpha <= 0.1) star.increasing = true;
        }
        ctx.fillStyle = `rgba(255, 240, 245, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      spawnMeteor();
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const tailX = m.x - Math.cos(m.angle) * m.len;
        const tailY = m.y - Math.sin(m.angle) * m.len;

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.alpha})`);
        grad.addColorStop(1, `rgba(251, 113, 133, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.alpha -= 0.012;

        if (m.alpha <= 0 || m.x < 0 || m.y > height) {
          meteors.splice(i, 1);
        }
      }

      requestAnimationFrame(render);
    };

    render();
  }

  initFireworksCanvas() {
    this.fwCanvas = document.getElementById("fireworks-canvas");
    if (!this.fwCanvas) return;
    this.fwCtx = this.fwCanvas.getContext("2d");
    this.fwCanvas.width = window.innerWidth;
    this.fwCanvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      if (this.fwCanvas) {
        this.fwCanvas.width = window.innerWidth;
        this.fwCanvas.height = window.innerHeight;
      }
    });

    this.particles = [];
    this.isFwRunning = false;
  }

  fireConfetti() {
    if (!this.fwCanvas) return;
    const colors = ["#f43f5e", "#fb7185", "#f59e0b", "#38bdf8", "#a855f7", "#34d399"];
    for (let i = 0; i < 110; i++) {
      this.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.6,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 20,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        gravity: 0.35,
        type: "rect",
      });
    }
    if (!this.isFwRunning) this.runParticleLoop();
  }

  fireFireworks() {
    if (!this.fwCanvas) return;
    const colors = ["#ffedd5", "#fde047", "#f43f5e", "#67e8f9", "#c084fc", "#ffffff"];
    const originX = Math.random() * (window.innerWidth * 0.6) + window.innerWidth * 0.2;
    const originY = Math.random() * (window.innerHeight * 0.4) + window.innerHeight * 0.2;

    for (let i = 0; i < 130; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 2;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: 0,
        rotSpeed: 0,
        alpha: 1,
        gravity: 0.1,
        type: "circle",
      });
    }
    if (!this.isFwRunning) this.runParticleLoop();
  }

  runParticleLoop() {
    this.isFwRunning = true;
    const ctx = this.fwCtx;
    const canvas = this.fwCanvas;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.012;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.type === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (this.particles.length > 0) {
        requestAnimationFrame(loop);
      } else {
        this.isFwRunning = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    loop();
  }
}

// 挂载实例
window.Effects = new EffectsManager(window.LOVE_CONFIG);
document.addEventListener("DOMContentLoaded", () => {
  window.Effects.init();
});
