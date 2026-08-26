/**
 * ====================================================================
 * 太阳 ios-IP · 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: js/effects.js
 * 作用: 全屏动态星空流星、烟花彩带粒子物理引擎、全局音效管理器
 * ====================================================================
 */

class EffectsManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG;
    this.audioPool = {};
    this.bgm = null;
    this.isPlayingBgm = false;
  }

  /**
   * 初始化总入口
   */
  init() {
    this.initStarrySky();
    this.initFireworksCanvas();
    this.initAudioSystem();
  }

  /* ==========================================================
      🌌 1. 全屏动态星空与流星雨 Canvas 引擎
  ========================================================== */
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

    // 恒星粒子
    const stars = [];
    const starCount = Math.floor((width * height) / 7000);

    const createStars = () => {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.3,
          alpha: Math.random(),
          speed: Math.random() * 0.02 + 0.005,
          increasing: Math.random() > 0.5,
        });
      }
    };
    createStars();

    // 流星系统
    const meteors = [];
    const spawnMeteor = () => {
      if (meteors.length < 2 && Math.random() < 0.03) {
        meteors.push({
          x: Math.random() * width + width * 0.2,
          y: Math.random() * (height * 0.4),
          len: Math.random() * 80 + 100,
          speed: Math.random() * 8 + 6,
          angle: (Math.PI / 4) * (1 + (Math.random() * 0.2 - 0.1)),
          alpha: 1,
        });
      }
    };

    // 渲染循环
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 渲染闪烁星星
      stars.forEach((star) => {
        if (star.increasing) {
          star.alpha += star.speed;
          if (star.alpha >= 1) star.increasing = false;
        } else {
          star.alpha -= star.speed;
          if (star.alpha <= 0.1) star.increasing = true;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 渲染流星
      spawnMeteor();
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const tailX = m.x - Math.cos(m.angle) * m.len;
        const tailY = m.y - Math.sin(m.angle) * m.len;

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.alpha})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.alpha -= 0.01;

        if (m.alpha <= 0 || m.x < 0 || m.y > height) {
          meteors.splice(i, 1);
        }
      }

      requestAnimationFrame(render);
    };

    render();
  }

  /* ==========================================================
      🎆 2. 全屏烟花与彩带爆破粒子物理引擎
  ========================================================== */
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

  /**
   * 触发彩带爆破 (完成清单或刮奖成功时)
   */
  fireConfetti() {
    if (!this.fwCanvas) return;
    const colors = ["#f43f5e", "#fb7185", "#f59e0b", "#38bdf8", "#a855f7", "#34d399"];
    const count = 100;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.6,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
        gravity: 0.35,
        type: "rect",
      });
    }

    if (!this.isFwRunning) {
      this.runParticleLoop();
    }
  }

  /**
   * 触发烟花礼炮 (解密通关时)
   */
  fireFireworks() {
    if (!this.fwCanvas) return;
    const colors = ["#ffedd5", "#fde047", "#f43f5e", "#67e8f9", "#c084fc"];
    const originX = Math.random() * (window.innerWidth * 0.6) + window.innerWidth * 0.2;
    const originY = Math.random() * (window.innerHeight * 0.4) + window.innerHeight * 0.2;

    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: 0,
        rotSpeed: 0,
        alpha: 1,
        gravity: 0.1,
        type: "circle",
      });
    }

    if (!this.isFwRunning) {
      this.runParticleLoop();
    }
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

  /* ==========================================================
      🎵 3. 音频总控与交互音效池系统
  ========================================================== */
  initAudioSystem() {
    const audioCfg = this.config.audio || {};

    // 预热并缓存短音效
    if (audioCfg.sounds) {
      Object.keys(audioCfg.sounds).forEach((key) => {
        const audio = new Audio(audioCfg.sounds[key]);
        audio.preload = "auto";
        this.audioPool[key] = audio;
      });
    }

    // 初始化 BGM
    if (audioCfg.bgmUrl) {
      this.bgm = new Audio(audioCfg.bgmUrl);
      this.bgm.loop = true;
      this.bgm.preload = "auto";
    }

    // 绑定黑胶唱片旋转与唱针控制
    const toggleBtn = document.getElementById("audio-toggle-btn");
    const vinylDisc = document.getElementById("vinyl-disc");
    const vinylNeedle = document.getElementById("vinyl-needle");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.toggleBgm();
      });
    }

    // 监听移动端首次任意触摸/点击，激活音频上下文
    const unlockAudio = () => {
      if (this.bgm && this.config.audio.bgmAutoPlay && !this.isPlayingBgm) {
        this.playBgm();
      }
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
  }

  /**
   * 播放短交互音效
   */
  playAudio(soundName) {
    const sound = this.audioPool[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  /**
   * 切换 BGM 播放状态并同步黑胶唱片视觉
   */
  toggleBgm() {
    if (this.isPlayingBgm) {
      this.pauseBgm();
    } else {
      this.playBgm();
    }
  }

  playBgm() {
    if (!this.bgm) return;
    this.bgm
      .play()
      .then(() => {
        this.isPlayingBgm = true;
        this.updateVinylUI(true);
      })
      .catch(() => {});
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
}

// 实例化并挂载至全局
window.Effects = new EffectsManager(window.LOVE_CONFIG);
document.addEventListener("DOMContentLoaded", () => {
  window.Effects.init();
});
