/**
 * 恋爱时光轴 & 漫游宇宙 (Love Universe) 前台核心主控
 * 文件名: js/core.js
 */

document.addEventListener("DOMContentLoaded", async () => {
  let config = window.LOVE_CONFIG || {};

  // 1. 尝试从 R2 云端热拉取最新动态配置
  try {
    const res = await fetch("/api/love/config");
    const data = await res.json();
    if (data.success && data.custom && data.config) {
      config = data.config;
      window.LOVE_CONFIG = config;
    }
  } catch (_) {}

  // 2. DOM 节点引用
  const dom = {
    gatekeeperScreen: document.getElementById("gatekeeper-screen"),
    gatekeeperDialog: document.querySelector(".gatekeeper__dialog"),
    gatekeeperTitle: document.getElementById("gatekeeper-title"),
    gatekeeperQuestion: document.getElementById("gatekeeper-question"),
    gatekeeperHint: document.getElementById("gatekeeper-hint"),
    gatekeeperInput: document.getElementById("gatekeeper-input"),
    gatekeeperBtn: document.getElementById("gatekeeper-btn"),
    mainContainer: document.getElementById("main-container"),
    heroNames: document.getElementById("hero-names"),
    heroSubtitle: document.getElementById("hero-subtitle"),
    letterTitle: document.getElementById("letter-title"),
    letterDate: document.getElementById("letter-date"),
    letterSign: document.getElementById("letter-sign"),
    typewriterText: document.getElementById("typewriter-text"),
    eggStar: document.getElementById("egg-star"),
    eggPaw: document.getElementById("egg-paw"),
    eggModal: document.getElementById("egg-modal"),
    eggModalText: document.getElementById("egg-modal-text"),
    eggModalClose: document.getElementById("egg-modal-close"),
    generatePosterBtn: document.getElementById("generate-poster-btn"),
    posterModal: document.getElementById("poster-modal"),
    posterPreviewBox: document.getElementById("poster-preview-box"),
    downloadPosterBtn: document.getElementById("download-poster-btn"),
    closePosterBtn: document.getElementById("close-poster-btn")
  };

  // 3. 填充基础静态数据
  if (config.meta) {
    if (dom.heroNames) dom.heroNames.textContent = `${config.meta.boyName || "男孩"} & ${config.meta.girlName || "女孩"}`;
    if (dom.heroSubtitle) dom.heroSubtitle.textContent = config.meta.siteSubtitle || "";
    if (config.meta.siteTitle) document.title = config.meta.siteTitle;
  }

  // 4. 门禁与超级暗号直通
  const gateCfg = config.gatekeeper || {};

  if (!gateCfg.enabled) {
    unlockMainUniverse(false);
  } else {
    if (dom.gatekeeperTitle && gateCfg.title) dom.gatekeeperTitle.textContent = gateCfg.title;
    if (dom.gatekeeperQuestion && gateCfg.question) dom.gatekeeperQuestion.textContent = gateCfg.question;
    if (dom.gatekeeperHint && gateCfg.hint) dom.gatekeeperHint.textContent = gateCfg.hint;

    if (dom.gatekeeperBtn) dom.gatekeeperBtn.addEventListener("click", verifyPassword);
    if (dom.gatekeeperInput) {
      dom.gatekeeperInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") verifyPassword();
      });
    }
  }

  function verifyPassword() {
    if (!dom.gatekeeperInput) return;
    const inputVal = dom.gatekeeperInput.value.trim().toLowerCase();
    const correctVal = String(gateCfg.correctAnswer || "240520").trim().toLowerCase();

    // 🕵️ 超级隐蔽暗号：输入 admin#521 直接静默跳转后台
    if (inputVal === "admin#521" || inputVal === "admin" || inputVal === "521") {
      location.href = "admin.html";
      return;
    }

    if (inputVal === correctVal) {
      if (window.Effects) {
        window.Effects.playAudio("gatekeeperPass");
        window.Effects.fireFireworks();
      }
      unlockMainUniverse(true);
    } else {
      triggerPasswordError();
    }
  }

  function triggerPasswordError() {
    if (!dom.gatekeeperDialog) return;
    if (window.Effects) window.Effects.playAudio("gatekeeperError");
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    const errorTips = gateCfg.errorTips || ["密码不对哦，再想想！"];
    const randomTip = errorTips[Math.floor(Math.random() * errorTips.length)];
    if (dom.gatekeeperHint) {
      dom.gatekeeperHint.textContent = randomTip;
      dom.gatekeeperHint.style.color = "#f43f5e";
    }

    dom.gatekeeperDialog.classList.remove("gatekeeper__dialog--error");
    void dom.gatekeeperDialog.offsetWidth;
    dom.gatekeeperDialog.classList.add("gatekeeper__dialog--error");
    dom.gatekeeperInput.value = "";
    dom.gatekeeperInput.focus();
  }

  function unlockMainUniverse(withAnimation = true) {
    if (withAnimation && dom.gatekeeperScreen) {
      dom.gatekeeperScreen.classList.add("gatekeeper--unlocking");
      setTimeout(() => { dom.gatekeeperScreen.style.display = "none"; }, 700);
    } else if (dom.gatekeeperScreen) {
      dom.gatekeeperScreen.style.display = "none";
    }

    if (dom.mainContainer) {
      dom.mainContainer.style.display = "block";
      setTimeout(() => { dom.mainContainer.classList.remove("main-container--hidden"); }, 50);
    }

    if (window.TimelineManager) {
      const timelineMgr = new window.TimelineManager(config);
      timelineMgr.init();
    }

    if (window.ScratchCardManager) {
      const scratchMgr = new window.ScratchCardManager(config);
      scratchMgr.init();
    }

    startTypewriter();

    if (config.audio && config.audio.bgmAutoPlay && window.Effects) {
      window.Effects.playBgm();
    }
  }

  // 5. 打字机情书
  function startTypewriter() {
    const letterCfg = config.letter || {};
    if (dom.letterTitle && letterCfg.title) dom.letterTitle.textContent = letterCfg.title;
    if (dom.letterDate && letterCfg.signDate) dom.letterDate.textContent = letterCfg.signDate;
    if (dom.letterSign && letterCfg.signature) dom.letterSign.textContent = letterCfg.signature;
    if (!dom.typewriterText || !letterCfg.content) return;

    const rawContent = letterCfg.content.replace(/\|/g, "\n\n");
    let currentIndex = 0;
    dom.typewriterText.textContent = "";

    const typeNextChar = () => {
      if (currentIndex < rawContent.length) {
        dom.typewriterText.textContent += rawContent.charAt(currentIndex);
        currentIndex++;
        const delay = rawContent.charAt(currentIndex - 1) === "\n" ? 350 : 45 + Math.random() * 40;
        setTimeout(typeNextChar, delay);
      }
    };
    setTimeout(typeNextChar, 500);
  }

  // 6. 彩蛋绑定
  const eggs = config.easterEggs || [];
  if (dom.eggStar) {
    dom.eggStar.addEventListener("click", () => showEggModal(eggs[0]?.message || "🌟 发现第一颗暗号星：想你每一天！"));
  }
  if (dom.eggPaw) {
    dom.eggPaw.addEventListener("click", () => showEggModal(eggs[1]?.message || "🐾 踩到猫爪印啦：今天多抱你一分钟！"));
  }
  if (dom.eggModalClose && dom.eggModal) {
    dom.eggModalClose.addEventListener("click", () => { dom.eggModal.style.display = "none"; });
    dom.eggModal.addEventListener("click", (e) => { if (e.target === dom.eggModal) dom.eggModal.style.display = "none"; });
  }

  function showEggModal(msg) {
    if (dom.eggModal && dom.eggModalText) {
      dom.eggModalText.textContent = msg;
      dom.eggModal.style.display = "flex";
      if (window.Effects) {
        window.Effects.fireConfetti();
        window.Effects.playAudio("stamp");
      }
    }
  }

  // 7. 海报生成
  let exportedPosterDataUrl = "";
  if (dom.generatePosterBtn) {
    dom.generatePosterBtn.addEventListener("click", () => {
      dom.generatePosterBtn.disabled = true;
      dom.generatePosterBtn.querySelector("span").textContent = "⚙️ 正在生成 300DPI 超清海报...";
      generatePosterCanvas().then((dataUrl) => {
        exportedPosterDataUrl = dataUrl;
        if (dom.posterPreviewBox) {
          dom.posterPreviewBox.innerHTML = `<img src="${dataUrl}" style="width:100%; border-radius:14px; box-shadow:0 8px 24px rgba(0,0,0,0.5);" alt="海报预览" />`;
        }
        if (dom.posterModal) dom.posterModal.style.display = "flex";
      }).finally(() => {
        dom.generatePosterBtn.disabled = false;
        dom.generatePosterBtn.querySelector("span").textContent = "✨ 一键生成海报";
      });
    });
  }

  if (dom.closePosterBtn && dom.posterModal) {
    dom.closePosterBtn.addEventListener("click", () => { dom.posterModal.style.display = "none"; });
  }
  if (dom.downloadPosterBtn) {
    dom.downloadPosterBtn.addEventListener("click", () => {
      if (!exportedPosterDataUrl) return;
      const link = document.createElement("a");
      link.download = `恋爱纪念日_${Date.now()}.jpg`;
      link.href = exportedPosterDataUrl;
      link.click();
    });
  }

  async function generatePosterCanvas() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1080;
    canvas.height = 1920;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGradient.addColorStop(0, "#171b30");
    bgGradient.addColorStop(0.5, "#0b1120");
    bgGradient.addColorStop(1, "#070a14");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.fillRect(90, 160, 900, 1180);
    ctx.shadowColor = "transparent";

    const photoUrl = config.timeline?.[0]?.frontImg || "assets/images/photo_01.jpg";
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = photoUrl;
    await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });

    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 130, 200, 820, 820);
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(130, 200, 820, 820);
    }

    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${config.meta?.boyName || "Boy"} & ${config.meta?.girlName || "Girl"}`, 540, 1110);

    ctx.fillStyle = "#6b7280";
    ctx.font = "30px sans-serif";
    ctx.fillText(`“ ${config.timeline?.[0]?.title || "我们的美好回忆"} ”`, 540, 1180);

    const startTimestamp = new Date(config.meta?.startDate || "2024-05-20").getTime();
    const totalDays = Math.floor((Date.now() - startTimestamp) / (1000 * 60 * 60 * 24));

    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 88px sans-serif";
    ctx.fillText(`${totalDays}`, 540, 1500);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "32px sans-serif";
    ctx.fillText("DAYS OF LOVE · 甜蜜同行", 540, 1570);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "26px sans-serif";
    ctx.fillText("✨ 太阳 ios-IP · 我们的漫游宇宙 ✨", 540, 1800);

    return canvas.toDataURL("image/jpeg", 0.92);
  }
});
