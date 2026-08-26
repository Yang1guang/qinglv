/**
 * 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: js/theme-engine.js
 * 作用: 多维主题注册表、Canvas 粒子物理引擎调度与内存安全管理
 */

class ThemeEngine {
  constructor() {
    this.currentThemeId = "sunset-twilight";
    this.customBgUrl = "";
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;
    this.particles = [];

    // 6 大风格注册表 (元数据与物理粒子引擎)
    this.registry = {
      "sunset-twilight": {
        id: "sunset-twilight",
        name: "🌌 暮色星河",
        tag: "浪漫 / 温暖",
        desc: "落日余晖与闪烁星空交织，带尾迹的流星雨穿梭",
        init: (ctx, w, h) => this.initTwilightPhysics(ctx, w, h)
      },
      "sakura-romance": {
        id: "sakura-romance",
        name: "🌸 初雪樱花",
        tag: "温柔 / 唯美",
        desc: "3D 翻转花瓣受微风吹拂徐徐飘落，触碰指尖随风舞动",
        init: (ctx, w, h) => this.initSakuraPhysics(ctx, w, h)
      },
      "cyber-space": {
        id: "cyber-space",
        name: "⚡ 赛博漫游",
        tag: "科技 / 帅气",
        desc: "霓虹光束与全息矩阵粒子穿梭，极具未来科幻质感",
        init: (ctx, w, h) => this.initCyberPhysics(ctx, w, h)
      },
      "firefly-forest": {
        id: "firefly-forest",
        name: "🌲 萤火森林",
        tag: "治愈 / 深邃",
        desc: "幽绿森林夜空中的发光萤火虫，忽明忽暗灵动飞舞",
        init: (ctx, w, h) => this.initFireflyPhysics(ctx, w, h)
      },
      "warm-ember": {
        id: "warm-ember",
        name: "🔥 炽热余烬",
        tag: "热情 / 爱意",
        desc: "如壁炉般缓缓升腾的火星余烬，温暖深沉而热烈",
        init: (ctx, w, h) => this.initEmberPhysics(ctx, w, h)
      },
      "sweet-dream": {
        id: "sweet-dream",
        name: "🍬 奶油甜梦",
        tag: "可爱 / 治愈",
        desc: "梦幻半透明糖果气泡缓缓升起，伴随微光折射动效",
        init: (ctx, w, h) => this.initBubblePhysics(ctx, w, h)
      }
    };
  }

  init() {
    this.canvas = document.getElementById("starry-canvas");
    if (this.canvas) {
      this.ctx = this.canvas.getContext("2d");
      this.resizeCanvas();
      window.addEventListener("resize", () => this.resizeCanvas());
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // 核心入口：切换主题
  applyTheme(themeId, customBgUrl = "") {
    const targetTheme = this.registry[themeId] ? themeId : "sunset-twilight";
    this.currentThemeId = targetTheme;
    this.customBgUrl = customBgUrl;

    // 1. 设置 body 属性以激活 CSS 变量
    document.body.setAttribute("data-theme", targetTheme);

    // 2. 自定义高清背景图加载与平滑淡入
    this.applyCustomBackground(customBgUrl);

    // 3. 销毁旧的 Canvas 渲染循环 (杜绝内存泄漏与掉帧)
    this.destroyPhysics();

    // 4. 挂载当前主题专属粒子物理引擎
    if (this.ctx && this.registry[targetTheme]?.init) {
      this.registry[targetTheme].init(this.ctx, this.canvas.width, this.canvas.height);
    }
  }

  applyCustomBackground(url) {
    let layer = document.getElementById("customThemeBgLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "customThemeBgLayer";
      layer.className = "custom-theme-bg-layer";
      document.body.prepend(layer);
    }

    if (url && url.trim().length > 5) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        layer.style.backgroundImage = `url('${url}')`;
        layer.classList.add("custom-theme-bg-layer--active");
      };
    } else {
      layer.classList.remove("custom-theme-bg-layer--active");
      setTimeout(() => { layer.style.backgroundImage = "none"; }, 500);
    }
  }

  destroyPhysics() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /* ================= 粒子引擎 1: 暮色星河 (流星与群星) ================= */
  initTwilightPhysics(ctx, w, h) {
    const count = Math.floor((w * h) / 7000);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.3,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
        inc: Math.random() > 0.5
      });
    }

    const meteors = [];
    const loop = () => {
      ctx.clearRect(0, 0, w, h);

      // 星星
      this.particles.forEach(p => {
        if (p.inc) { p.alpha += p.speed; if (p.alpha >= 1) p.inc = false; }
        else { p.alpha -= p.speed; if (p.alpha <= 0.1) p.inc = true; }
        ctx.fillStyle = `rgba(255, 240, 245, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 流星
      if (meteors.length < 2 && Math.random() < 0.03) {
        meteors.push({
          x: Math.random() * w + w * 0.2,
          y: Math.random() * (h * 0.4),
          len: Math.random() * 80 + 100,
          speed: Math.random() * 8 + 6,
          angle: Math.PI / 4,
          alpha: 1
        });
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const tailX = m.x - Math.cos(m.angle) * m.len;
        const tailY = m.y - Math.sin(m.angle) * m.len;
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.alpha})`);
        grad.addColorStop(1, `rgba(244, 63, 94, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.alpha -= 0.012;
        if (m.alpha <= 0 || m.x < 0 || m.y > h) meteors.splice(i, 1);
      }

      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  /* ================= 粒子引擎 2: 初雪樱花 (3D 翻转花瓣) ================= */
  initSakuraPhysics(ctx, w, h) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 10 + 8,
        speedX: Math.random() * 1.5 + 0.5,
        speedY: Math.random() * 1.8 + 1,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.03 + 0.01,
        angle: Math.random() * Math.PI * 2
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, w, h);

      this.particles.forEach(p => {
        p.y += p.speedY;
        p.x += Math.sin(p.angle) * 0.8 + p.speedX;
        p.flip += p.flipSpeed;
        p.angle += 0.02;

        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
        if (p.x > w + 20) { p.x = -20; }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.scale(Math.sin(p.flip), 1);

        ctx.fillStyle = "rgba(251, 182, 206, 0.85)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size, p.size / 3, 0, p.size);
        ctx.bezierCurveTo(p.size, p.size / 3, p.size / 2, -p.size / 2, 0, 0);
        ctx.fill();
        ctx.restore();
      });

      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  /* ================= 粒子引擎 3: 赛博漫游 (矩阵霓虹光束) ================= */
  initCyberPhysics(ctx, w, h) {
    const count = 40;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: Math.random() * 60 + 20,
        speed: Math.random() * 6 + 3,
        color: Math.random() > 0.5 ? "#06b6d4" : "#a855f7",
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, w, h);

      this.particles.forEach(p => {
        p.y += p.speed;
        if (p.y > h + p.len) { p.y = -p.len; p.x = Math.random() * w; }

        const grad = ctx.createLinearGradient(p.x, p.y - p.len, p.x, p.y);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, p.color);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.len);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  /* ================= 粒子引擎 4: 萤火森林 (呼吸发光萤火虫) ================= */
  initFireflyPhysics(ctx, w, h) {
    const count = 45;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.5 + 1.2,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        alpha: Math.random(),
        pulseSpeed: Math.random() * 0.03 + 0.01,
        increasing: Math.random() > 0.5
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, w, h);

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        if (p.increasing) { p.alpha += p.pulseSpeed; if (p.alpha >= 1) p.increasing = false; }
        else { p.alpha -= p.pulseSpeed; if (p.alpha <= 0.1) p.increasing = true; }

        ctx.save();
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 12;
        ctx.fillStyle = `rgba(167, 243, 208, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  /* ================= 粒子引擎 5: 炽热余烬 (上升火星) ================= */
  initEmberPhysics(ctx, w, h) {
    const count = 50;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(Math.random() * 2 + 1),
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, w, h);

      this.particles.forEach(p => {
        p.x += p.vx + (Math.random() - 0.5) * 0.5;
        p.y += p.vy;
        p.alpha -= 0.005;

        if (p.y < -10 || p.alpha <= 0) {
          p.y = h + 10;
          p.x = Math.random() * w;
          p.alpha = Math.random() * 0.8 + 0.2;
        }

        ctx.save();
        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(251, 146, 60, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  /* ================= 粒子引擎 6: 奶油甜梦 (梦幻半透泡泡) ================= */
  initBubblePhysics(ctx, w, h) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 16 + 8,
        vy: -(Math.random() * 1.2 + 0.6),
        wobble: Math.random() * Math.PI,
        wobbleSpeed: Math.random() * 0.03 + 0.01
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, w, h);

      this.particles.forEach(p => {
        p.y += p.vy;
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * 0.8;

        if (p.y < -p.r * 2) {
          p.y = h + p.r * 2;
          p.x = Math.random() * w;
        }

        ctx.save();
        ctx.strokeStyle = "rgba(254, 240, 138, 0.4)";
        ctx.fillStyle = "rgba(244, 114, 182, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 泡泡高光
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }
}

// 挂载至全局单例
window.ThemeEngine = new ThemeEngine();
document.addEventListener("DOMContentLoaded", () => {
  window.ThemeEngine.init();
});
