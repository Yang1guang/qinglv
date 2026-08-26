/**
 * 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: js/effects.js
 * 作用: 全屏动态星空、烟花彩带物理引擎、WebAudio自研音效合成器、云端流媒体点播总控
 */

class EffectsManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.audioCtx = null;
    this.bgm = null;
    this.isPlayingBgm = false;
    // 高可用全网兜底音乐库
    this.fallbackStreams = [
      "https://music.163.com/song/media/outer/url?id=1827600686.mp3",
      "https://music.163.com/song/media/outer/url?id=139774.mp3",
      "https://music.163.com/song/media/outer/url?id=441552.mp3"
    ];
    this.fallbackIndex = 0;
  }

  init() {
    this.initStarrySky();
    this.initFireworksCanvas();
    this.initAudioSystem();
  }

  // 接收来自云端 R2 的动态热更新
  updateConfig(newConfig) {
    this.config = newConfig;
    if (this.bgm) {
      this.bgm.pause();
      this.isPlayingBgm = false;
      this.updateVinylUI(false);
    }
    this.initBgmInstance();
  }

  /* ================= 1. Web Audio API 物理拟真音效合成器 (免文件开箱即响) ================= */
  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  playAudio(soundType) {
    // 优先尝试播放用户在后台或 config 里上传的自定义音频
    const sounds = this.config.audio?.sounds || {};
    if (sounds[soundType] && typeof sounds[soundType] === "string" && sounds[soundType].trim().length > 5 && !sounds[soundType].startsWith("assets/")) {
      const customAudio = new Audio(sounds[soundType]);
      customAudio.play().catch(() => this.synthesizeSound(soundType));
      return;
    }
    // 默认启用自研高质感电子/声学合成音效
    this.synthesizeSound(soundType);
  }

  synthesizeSound(type) {
    try {
      this.ensureAudioContext();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (type === "gatekeeperPass") {
        // 胜利大和弦 (C Maj9: C5, E5, G5, B5, D6)
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
      } else if (type === "gatekeeperError") {
        // 错误双低音提示
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
      } else if (type === "stamp") {
        // 印章重重盖下的低频砰击声
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
      } else if (type === "scratch" || type === "flip") {
        // 清脆撕纸/翻转微声
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

  /* ================= 2. 云端流媒体音乐播放与黑胶总控 ================= */
  initAudioSystem() {
    this.initBgmInstance();

    const toggleBtn = document.getElementById("audio-toggle-btn");
    const vinylDisc = document.getElementById("vinyl-disc");

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

    // 突破移动端浏览器对 AudioContext 和多媒体自动播放的策略限制
    const unlockHandler = () => {
      this.ensureAudioContext();
      if (this.bgm && this.config.audio?.bgmAutoPlay && !this.isPlayingBgm) {
        this.playBgm();
      }
      window.removeEventListener("click", unlockHandler);
      window.removeEventListener("touchstart", unlockHandler);
    };
    window.addEventListener("click", unlockHandler);
    window.addEventListener("touchstart", unlockHandler);
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
    // 过滤失效的相对本地路径，自动启用稳定云端音频源
    if (!targetUrl || targetUrl.startsWith("assets/")) {
      targetUrl = this.fallbackStreams[0];
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

    const attemptPlay = (audioObj) => {
      return audioObj.play().then(() => {
        this.isPlayingBgm = true;
        this.updateVinylUI(true);
      });
    };

    attemptPlay(this.bgm).catch(() => {
      // 容错灾备：如果主源受阻，自动顺序切换高可用备选节点
      this.fallbackIndex = (this.fallbackIndex + 1) % this.fallbackStreams.length;
      const nextStream = this.fallbackStreams[this.fallbackIndex];
      this.bgm = new Audio(nextStream);
      this.bgm.loop = true;

      attemptPlay(this.bgm).catch(() => {
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

  /* ================= 3. 全屏动态星空与流星雨 Canvas ================= */
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

  /* ================= 4. 全屏烟花与彩带粒子物理引擎 ================= */
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

// 全局挂载与自启
window.Effects = new EffectsManager(window.LOVE_CONFIG);
document.addEventListener("DOMContentLoaded", () => {
  window.Effects.init();
});
