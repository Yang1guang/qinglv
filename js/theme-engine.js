/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/theme-engine.js
 * 作用: 多维物理引擎、12 套男女主题切换、双视角胶囊激活联动与全视口浅色/深色背景智能穿透
 */

class ThemeEngineCore {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationFrameId = null;
    this.currentPerspective = localStorage.getItem("love_user_perspective") || "boy";
    this.currentThemeId = "sunset-twilight";
  }

  init() {
    this.canvas = document.getElementById("starry-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

    this.ensureBackgroundLayer();
    this.resizeCanvas();
    window.removeEventListener("resize", this.handleResize);
    this.handleResize = () => this.resizeCanvas();
    window.addEventListener("resize", this.handleResize);

    // 绑定前台胶囊点击事件（原生监听保障 100% 触发）
    this.bindCapsuleEvents();
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

  // 确保底层全视口独立背景容器存在
  ensureBackgroundLayer() {
    let bgLayer = document.getElementById("universe-bg-layer");
    if (!bgLayer) {
      bgLayer = document.createElement("div");
      bgLayer.id = "universe-bg-layer";
      bgLayer.className = "universe-bg-layer";
      document.body.prepend(bgLayer);
    }
    return bgLayer;
  }

  bindCapsuleEvents() {
    const boyBtn = document.getElementById("btn-perspective-boy");
    const girlBtn = document.getElementById("btn-perspective-girl");

    if (boyBtn) {
      boyBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.switchPerspective("boy");
      };
    }
    if (girlBtn) {
      girlBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.switchPerspective("girl");
      };
    }
  }

  resizeCanvas() {
    if (!this.canvas) {
      this.canvas = document.getElementById("starry-canvas");
      this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    }
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
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

    const presets = window.THEME_PRESETS || { boy: [], girl: [] };
    const allThemes = [...(presets.boy || []), ...(presets.girl || [])];
    let themeMeta = allThemes.find(t => t.id === themeId);

    if (!themeMeta) {
      themeMeta = (presets.boy && presets.boy[0]) ? presets.boy[0] : { particleType: "meteor", themeType: "dark" };
    }

    const isLight = themeMeta.themeType === "light" || this.currentPerspective === "girl";
    const themeType = isLight ? "light" : "dark";

    // 1. 设置 Body 类名与无障碍对比度主题类型属性
    document.body.className = document.body.className
      .replace(/theme-[a-z0-9-]+/g, "")
      .trim();
    document.body.classList.add(`theme-${themeId}`);
    document.body.setAttribute("data-theme-type", themeType);
    document.documentElement.setAttribute("data-theme-type", themeType);

    // 2. 将高清壁纸精准注入至独立全视口背景层 (未上传自定义壁纸时完全由 CSS 变量 --theme-bg-gradient 呈现)
    const bgLayer = this.ensureBackgroundLayer();
    
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundAttachment = "scroll";

    if (customBgUrl) {
      const scrim = isLight 
        ? "linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4))"
        : "linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45))";
      bgLayer.style.backgroundImage = `${scrim}, url('${customBgUrl}')`;
    } else {
      // 清空行内 style.backgroundImage，让 CSS 中定义的 --theme-bg-gradient 在电脑端与手机端 100% 完整生效
      bgLayer.style.backgroundImage = "";
    }

    // 3. 启动物理粒子引擎 (浅色模式自动适配梦幻气泡或暖金阳光粒子)
    let particleType = themeMeta.particleType || "meteor";
    if (isLight && particleType === "meteor") {
      particleType = "bubbles";
    }
    this.initParticlePhysics(particleType);

    if (notify) {
      const msg = `✨ 已切入【${themeMeta.name || "专属"}】时空`;
      if (typeof window.showToast === "function") {
        window.showToast(msg);
      } else if (window.Effects && typeof window.Effects.showMiniToast === "function") {
        window.Effects.showMiniToast(msg);
      }
    }
  }

  initParticlePhysics(type) {
    if (!this.canvas || !this.ctx) {
      this.canvas = document.getElementById("starry-canvas");
      this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    }
    if (!this.ctx) return;

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    this.particles = [];
    const count = window.innerWidth < 768 ? 25 : 50;

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
    const w = this.canvas.width || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;

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

// 导出全局单例并挂载原生 DOM 事件监听
window.ThemeEngine = new ThemeEngineCore();

document.addEventListener("DOMContentLoaded", () => {
  if (window.ThemeEngine) {
    window.ThemeEngine.init();
  }
});
