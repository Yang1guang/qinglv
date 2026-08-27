/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/theme-engine.js
 * 作用: 多维物理引擎、12 套男女主题切换、独立背景图映射与授权拦截
 */

class ThemeEngine {
  constructor() {
    this.canvas = document.getElementById("starry-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.particles = [];
    this.animationFrameId = null;
    this.currentPerspective = localStorage.getItem("love_user_perspective") || "boy"; // boy or girl
    this.currentThemeId = "sunset-twilight";
    this.presets = window.THEME_PRESETS || { boy: [], girl: [] };
  }

  init() {
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    // 默认应用当前视角的配置
    const config = window.LOVE_CONFIG || {};
    const themeCfg = config.theme || {};
    const defaultTheme = this.currentPerspective === "boy" 
      ? (themeCfg.currentThemeBoy || "sunset-twilight")
      : (themeCfg.currentThemeGirl || "french-cream");

    const customBg = this.currentPerspective === "boy"
      ? (themeCfg.customBgUrlBoy || themeCfg.customBgUrl || "")
      : (themeCfg.customBgUrlGirl || themeCfg.customBgUrl || "");

    this.applyTheme(defaultTheme, customBg, false);
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // 校验当前站点是否已兑换永久授权
  isLicensed() {
    const cfg = window.LOVE_CONFIG || {};
    return Boolean(cfg._license && cfg._license.unlocked);
  }

  // 切换男女视角 (受授权保护)
  switchPerspective(gender) {
    if (!this.isLicensed()) {
      alert("💎 【12 款男女双视角主题与独立壁纸】为星河契约专属版特权！\n请长按网页底部版权文字或进入后台输入激活码解锁此特权。");
      return;
    }

    this.currentPerspective = gender;
    localStorage.setItem("love_user_perspective", gender);

    const config = window.LOVE_CONFIG || {};
    const themeCfg = config.theme || {};

    const targetTheme = gender === "boy" 
      ? (themeCfg.currentThemeBoy || "sunset-twilight")
      : (themeCfg.currentThemeGirl || "french-cream");

    const targetBg = gender === "boy"
      ? (themeCfg.customBgUrlBoy || themeCfg.customBgUrl || "")
      : (themeCfg.customBgUrlGirl || themeCfg.customBgUrl || "");

    this.applyTheme(targetTheme, targetBg, true);
  }

  // 应用具体主题
  applyTheme(themeId, customBgUrl = "", showToast = false) {
    this.currentThemeId = themeId;

    // 查找主题元数据
    let themeMeta = null;
    const allThemes = [...(this.presets.boy || []), ...(this.presets.girl || [])];
    themeMeta = allThemes.find(t => t.id === themeId);

    if (!themeMeta) {
      themeMeta = this.presets.boy[0] || { particleType: "meteor", themeType: "dark" };
    }

    // 1. 设置 Body 类名与主题类型
    document.body.className = document.body.className
      .replace(/theme-[a-z0-9-]+/g, "")
      .trim();
    document.body.classList.add(`theme-${themeId}`);
    document.body.setAttribute("data-theme-type", themeMeta.themeType || "dark");

    // 2. 注入背景色或自定义壁纸
    if (customBgUrl) {
      document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${customBgUrl}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = themeMeta.colors?.bg || "";
    }

    // 3. 启动对应的 Canvas 物理粒子引擎
    this.initParticlePhysics(themeMeta.particleType || "meteor");

    if (showToast && typeof window.showToast === "function") {
      window.showToast(`✨ 已切换至【${themeMeta.name}】`);
    }
  }

  // 物理粒子系统分发
  initParticlePhysics(type) {
    if (!this.ctx) return;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    this.particles = [];
    const count = window.innerWidth < 768 ? 25 : 55;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(type));
    }

    const renderLoop = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.particles.forEach((p, idx) => {
        this.updateAndDrawParticle(p, type);
      });
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  createParticle(type) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    switch (type) {
      case "petals": // 🌸 3D 樱花花瓣
      case "floralRipples":
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 8 + 6,
          speedY: Math.random() * 1.2 + 0.6,
          speedX: Math.sin(Math.random()) * 0.8,
          rotation: Math.random() * 360,
          rotSpeed: Math.random() * 2 - 1,
          opacity: Math.random() * 0.6 + 0.3
        };

      case "sunDust": // 🧁 丁达尔暖阳微尘
      case "dewDrops":
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 2.5 + 1,
          speedY: (Math.random() - 0.5) * 0.3,
          speedX: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.7 + 0.2,
          pulse: Math.random() * 0.02 + 0.01
        };

      case "bubbles": // 🍬 七彩梦幻气泡
      case "seaSpray":
        return {
          x: Math.random() * w,
          y: h + Math.random() * 50,
          radius: Math.random() * 12 + 6,
          speedY: -(Math.random() * 1.5 + 0.5),
          speedX: Math.sin(Math.random()) * 0.5,
          opacity: Math.random() * 0.4 + 0.3
        };

      case "fireflies": // 🌲 幽林萤火
      case "bioplankton":
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 2.2 + 1,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: (Math.random() - 0.5) * 0.8,
          alpha: Math.random(),
          alphaSpeed: Math.random() * 0.02 + 0.01
        };

      case "cyberMatrix": // ⚡ 赛博矩阵光束
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          length: Math.random() * 40 + 20,
          speedY: Math.random() * 6 + 3,
          opacity: Math.random() * 0.5 + 0.2
        };

      case "meteor": // 🌌 暮色流星雨
      default:
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 1.8 + 0.5,
          twinkle: Math.random() * 0.03 + 0.01,
          alpha: Math.random()
        };
    }
  }

  updateAndDrawParticle(p, type) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    switch (type) {
      case "petals":
      case "floralRipples":
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;
        if (p.y > h) p.y = -10;
        if (p.x > w) p.x = 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = `rgba(244, 114, 182, ${p.opacity})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;

      case "sunDust":
      case "dewDrops":
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(Date.now() * 0.002) * 0.01;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${Math.abs(p.opacity)})`;
        ctx.shadowColor = "rgba(245, 158, 11, 0.6)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case "bubbles":
      case "seaSpray":
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(192, 132, 252, ${p.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = `rgba(243, 232, 255, ${p.opacity * 0.25})`;
        ctx.fill();
        break;

      case "fireflies":
      case "bioplankton":
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha += p.alphaSpeed;
        if (p.alpha > 1 || p.alpha < 0.1) p.alphaSpeed = -p.alphaSpeed;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${Math.abs(p.alpha)})`;
        ctx.shadowColor = "rgba(52, 211, 153, 0.8)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case "cyberMatrix":
        p.y += p.speedY;
        if (p.y > h) {
          p.y = -p.length;
          p.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.strokeStyle = `rgba(56, 189, 248, ${p.opacity})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        break;

      case "meteor":
      default:
        p.alpha += p.twinkle;
        if (p.alpha > 1 || p.alpha < 0.2) p.twinkle = -p.twinkle;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(p.alpha)})`;
        ctx.fill();
        break;
    }
  }
}

window.ThemeEngine = new ThemeEngine();
