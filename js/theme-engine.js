/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/theme-engine.js
 * 作用: 多维物理引擎、12 套男女主题切换、双视角胶囊激活联动与独立背景图映射
 */

class ThemeEngine {
  constructor() {
    this.canvas = document.getElementById("starry-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.particles = [];
    this.animationFrameId = null;
    this.currentPerspective = localStorage.getItem("love_user_perspective") || "boy";
    this.currentThemeId = "sunset-twilight";
    this.presets = window.THEME_PRESETS || { boy: [], girl: [] };
  }

  init() {
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.updateCapsuleUI();

    const config = window.LOVE_CONFIG || {};
    const themeCfg = config.theme || {};

    const defaultTheme = this.currentPerspective === "boy" 
      ? (themeCfg.currentThemeBoy || themeCfg.currentTheme || "sunset-twilight")
      : (themeCfg.currentThemeGirl || "french-cream");

    const customBg = this.currentPerspective === "boy"
      ? (themeCfg.customBgUrlBoy || themeCfg.customBgUrl || "")
      : (themeCfg.customBgUrlGirl || "");

    this.applyTheme(defaultTheme, customBg, false);
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  isLicensed() {
    const cfg = window.LOVE_CONFIG || {};
    return Boolean(cfg._license && cfg._license.unlocked);
  }

  // 切换男女视角
  switchPerspective(gender) {
    this.currentPerspective = gender;
    localStorage.setItem("love_user_perspective", gender);
    this.updateCapsuleUI();

    const config = window.LOVE_CONFIG || {};
    const themeCfg = config.theme || {};

    const targetTheme = gender === "boy" 
      ? (themeCfg.currentThemeBoy || themeCfg.currentTheme || "sunset-twilight")
      : (themeCfg.currentThemeGirl || "french-cream");

    const targetBg = gender === "boy"
      ? (themeCfg.customBgUrlBoy || themeCfg.customBgUrl || "")
      : (themeCfg.customBgUrlGirl || "");

    this.applyTheme(targetTheme, targetBg, true);
  }

  updateCapsuleUI() {
    const boyBtn = document.getElementById("btn-perspective-boy");
    const girlBtn = document.getElementById("btn-perspective-girl");

    if (boyBtn && girlBtn) {
      if (this.currentPerspective === "boy") {
        boyBtn.classList.add("active");
        girlBtn.classList.remove("active");
      } else {
        girlBtn.classList.add("active");
        boyBtn.classList.remove("active");
      }
    }
  }

  applyTheme(themeId, customBgUrl = "", notify = false) {
    this.currentThemeId = themeId;

    let themeMeta = null;
    const allThemes = [...(this.presets.boy || []), ...(this.presets.girl || [])];
    themeMeta = allThemes.find(t => t.id === themeId);

    if (!themeMeta) {
      themeMeta = this.presets.boy[0] || { particleType: "meteor", themeType: "dark" };
    }

    // 1. 设置 Body 类名与主题属性
    document.body.className = document.body.className
      .replace(/theme-[a-z0-9-]+/g, "")
      .trim();
    document.body.classList.add(`theme-${themeId}`);
    document.body.setAttribute("data-theme-type", themeMeta.themeType || "dark");

    // 2. 注入背景色或壁纸
    if (customBgUrl) {
      document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${customBgUrl}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = themeMeta.colors?.bg || "";
    }

    // 3. 启动物理粒子引擎
    this.initParticlePhysics(themeMeta.particleType || "meteor");

    if (notify && typeof window.showToast === "function") {
      window.showToast(`✨ 已切入【${themeMeta.name}】专属时空`);
    }
  }

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
      this.particles.forEach((p) => {
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
      case "petals":
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

      case "sunDust":
      case "dewDrops":
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 2.5 + 1,
          speedY: (Math.random() - 0.5) * 0.3,
          speedX: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.7 + 0.2
        };

      case "bubbles":
      case "seaSpray":
        return {
          x: Math.random() * w,
          y: h + Math.random() * 50,
          radius: Math.random() * 12 + 6,
          speedY: -(Math.random() * 1.5 + 0.5),
          speedX: Math.sin(Math.random()) * 0.5,
          opacity: Math.random() * 0.4 + 0.3
        };

      case "fireflies":
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

      case "cyberMatrix":
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          length: Math.random() * 40 + 20,
          speedY: Math.random() * 6 + 3,
          opacity: Math.random() * 0.5 + 0.2
        };

      case "meteor":
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
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.opacity})`;
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
