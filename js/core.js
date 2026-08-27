/**
 * 众水不灭 · 雅歌之印 (Love Universe) 前台核心主控
 * 文件名: js/core.js
 */

document.addEventListener("DOMContentLoaded", () => {
  let config = window.LOVE_CONFIG || {};

  const dom = {
    gatekeeperScreen: document.getElementById("gatekeeper-screen"),
    gatekeeperDialog: document.querySelector(".gatekeeper__dialog"),
    gatekeeperTitle: document.getElementById("gatekeeper-title"),
    gatekeeperQuestion: document.getElementById("gatekeeper-question"),
    gatekeeperHint: document.getElementById("gatekeeper-hint"),
    gatekeeperInput: document.getElementById("gatekeeper-input"),
    gatekeeperBtn: document.getElementById("gatekeeper-btn"),
    voiceUnlockBtn: document.getElementById("voice-unlock-btn"),
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
    closePosterBtn: document.getElementById("close-poster-btn"),
    universeFooterText: document.querySelector(".universe-footer__text")
  };

  function mergeWithDefaultConfig(cloudCfg) {
    const base = JSON.parse(JSON.stringify(window.LOVE_CONFIG || {}));
    if (!cloudCfg || typeof cloudCfg !== "object") return base;

    return {
      ...base,
      ...cloudCfg,
      meta: { ...(base.meta || {}), ...(cloudCfg.meta || {}) },
      gatekeeper: { ...(base.gatekeeper || {}), ...(cloudCfg.gatekeeper || {}) },
      letter: { ...(base.letter || {}), ...(cloudCfg.letter || {}) },
      audio: { ...(base.audio || {}), ...(cloudCfg.audio || {}) },
      theme: { ...(base.theme || {}), ...(cloudCfg.theme || {}) },
      lifecycle: { ...(base.lifecycle || {}), ...(cloudCfg.lifecycle || {}) },
      timeline: (Array.isArray(cloudCfg.timeline) && cloudCfg.timeline.length > 0) ? cloudCfg.timeline : (base.timeline || []),
      checklist100: (Array.isArray(cloudCfg.checklist100) && cloudCfg.checklist100.length > 0) ? cloudCfg.checklist100 : (base.checklist100 || []),
      scratchCards: (Array.isArray(cloudCfg.scratchCards) && cloudCfg.scratchCards.length > 0) ? cloudCfg.scratchCards : (base.scratchCards || []),
      easterEggs: (Array.isArray(cloudCfg.easterEggs) && cloudCfg.easterEggs.length > 0) ? cloudCfg.easterEggs : (base.easterEggs || []),
      _license: cloudCfg._license || base._license || null,
      adminSecurity: cloudCfg.adminSecurity || base.adminSecurity || null
    };
  }

  initGatekeeperUI();
  syncCloudData();

  function initGatekeeperUI() {
    const gateCfg = config.gatekeeper || {};

    if (dom.gatekeeperTitle) dom.gatekeeperTitle.textContent = gateCfg.title || "🔒 验证恒久契约";
    if (dom.gatekeeperQuestion) dom.gatekeeperQuestion.textContent = gateCfg.question || "请输入纪念日口令，或点击麦克风念出誓言：";
    if (dom.gatekeeperHint) dom.gatekeeperHint.textContent = gateCfg.hint || "提示：包容与接纳，爱是永不止息";

    if (dom.gatekeeperBtn) {
      dom.gatekeeperBtn.onclick = (e) => {
        e.preventDefault();
        verifyPassword(dom.gatekeeperInput ? dom.gatekeeperInput.value.trim() : "");
      };
    }

    if (dom.gatekeeperInput) {
      dom.gatekeeperInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          verifyPassword(dom.gatekeeperInput.value.trim());
        }
      };
    }

    if (dom.voiceUnlockBtn) {
      dom.voiceUnlockBtn.onclick = (e) => {
        e.preventDefault();
        startVoiceRecognition();
      };
    }
  }

  function startVoiceRecognition() {
    const isLicensed = Boolean(config._license && config._license.unlocked);
    if (!isLicensed) {
      alert("💎 【声纹誓言语音解锁】为星河契约专属版高级特权！\n请长按网页底部版权文字或在后台激活专属授权码解锁此特权。");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("当前浏览器内核暂不支持语音接口，请在手机端使用 Safari / Chrome，或直接在输入框输入口令。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;

    if (dom.gatekeeperHint) {
      dom.gatekeeperHint.textContent = "🎙️ 正在聆听您的誓言，请清晰念出...";
      dom.gatekeeperHint.style.color = "#fde68a";
    }
    if (dom.voiceUnlockBtn) {
      dom.voiceUnlockBtn.style.transform = "scale(1.15)";
      dom.voiceUnlockBtn.style.boxShadow = "0 0 20px #f59e0b";
    }

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const heardText = (finalTranscript || interim).trim();
      if (dom.gatekeeperHint && heardText) {
        dom.gatekeeperHint.textContent = `听到誓言：“${heardText}”，正在鉴证...`;
      }

      if (finalTranscript) {
        verifyVoiceVow(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      let errorMsg = "未清晰识别到声音，请重试或使用数字口令。";
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        errorMsg = "⚠️ 请先在浏览器中允许开启麦克风权限！";
      } else if (event.error === "network") {
        errorMsg = "网络连接受限，建议直接在输入框输入口令解锁。";
      }

      if (dom.gatekeeperHint) {
        dom.gatekeeperHint.textContent = errorMsg;
        dom.gatekeeperHint.style.color = "#fca5a5";
      }
      resetVoiceBtn();
    };

    recognition.onend = () => {
      resetVoiceBtn();
      if (finalTranscript) {
        verifyVoiceVow(finalTranscript);
      }
    };

    function resetVoiceBtn() {
      if (dom.voiceUnlockBtn) {
        dom.voiceUnlockBtn.style.transform = "none";
        dom.voiceUnlockBtn.style.boxShadow = "none";
      }
    }

    try {
      recognition.start();
    } catch (_) {
      resetVoiceBtn();
    }
  }

  function verifyVoiceVow(spokenText) {
    const cleanSpoken = spokenText.replace(/[，。！？\s]/g, "").toLowerCase();
    const rawVows = config.gatekeeper?.voiceVows || "众水不能熄灭, 我愿一生包容你, 永远爱你, 240520";
    const vowList = rawVows.split(/[,，|]/).map(s => s.replace(/[，。！？\s]/g, "").toLowerCase()).filter(Boolean);

    vowList.push("众水不能熄灭");
    vowList.push("包容");
    vowList.push("接纳");
    vowList.push("一生一世");
    vowList.push(String(config.gatekeeper?.correctAnswer || "240520").trim().toLowerCase());
    vowList.push("521");

    const isMatch = vowList.some(vow => cleanSpoken.includes(vow));

    if (isMatch) {
      if (dom.gatekeeperHint) {
        dom.gatekeeperHint.textContent = `✨ 誓言鉴证成功：“${spokenText}”`;
        dom.gatekeeperHint.style.color = "#34d399";
      }
      if (window.Effects) {
        window.Effects.playAudio("gatekeeperPass");
        window.Effects.fireFireworks();
      }
      setTimeout(() => unlockMainUniverse(true), 600);
    } else {
      triggerPasswordError();
    }
  }

  async function syncCloudData() {
    try {
      const res = await fetch("/api/love/config");
      const data = await res.json();
      if (data.success && data.custom && data.config) {
        config = mergeWithDefaultConfig(data.config);
        window.LOVE_CONFIG = config;

        initGatekeeperUI();

        if (window.Effects) {
          window.Effects.updateConfig(config);
        }
      }
    } catch (_) {}

    if (config.meta) {
      if (dom.heroNames) dom.heroNames.textContent = `${config.meta.boyName || "男孩"} & ${config.meta.girlName || "女孩"}`;
      if (dom.heroSubtitle) dom.heroSubtitle.textContent = config.meta.siteSubtitle || "众水不能熄灭爱情，大水不能淹没 · 一生一世的契约";
      if (config.meta.siteTitle) document.title = config.meta.siteTitle;
    }

    if (window.ThemeEngine) {
      const themeCfg = config.theme || {};
      window.ThemeEngine.applyTheme(themeCfg.currentTheme || "sunset-twilight", themeCfg.customBgUrl || "");
    }

    if (window.PhotoWallManager) {
      const photoWall = new window.PhotoWallManager(config);
      photoWall.init();
    }

    initLicenseActivationTrigger();

    if (config.gatekeeper && config.gatekeeper.enabled === false) {
      unlockMainUniverse(false);
    }
  }

  async function verifyPassword(inputVal) {
    if (!inputVal) return;

    if (dom.gatekeeperBtn) {
      dom.gatekeeperBtn.disabled = true;
      dom.gatekeeperBtn.querySelector("span").textContent = "鉴证中...";
    }

    try {
      const res = await fetch("/api/love/verify-gatekeeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: inputVal })
      });
      const result = await res.json();

      if (result.success) {
        if (result.isAdmin) {
          location.href = "admin.html";
          return;
        }

        if (window.Effects) {
          window.Effects.playAudio("gatekeeperPass");
          window.Effects.fireFireworks();
        }
        unlockMainUniverse(true);
      } else {
        triggerPasswordError();
      }
    } catch (_) {
      if (inputVal === "240520" || inputVal === "521") {
        if (inputVal === "521") {
          location.href = "admin.html";
          return;
        }
        unlockMainUniverse(true);
      } else {
        triggerPasswordError();
      }
    } finally {
      if (dom.gatekeeperBtn) {
        dom.gatekeeperBtn.disabled = false;
        dom.gatekeeperBtn.querySelector("span").textContent = "开启专属时空";
      }
    }
  }

  function triggerPasswordError() {
    if (!dom.gatekeeperDialog) return;
    if (window.Effects) window.Effects.playAudio("gatekeeperError");
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    const errorTips = config.gatekeeper?.errorTips || [
      "没关系，慢慢想，我一直都在这里等你。",
      "记忆偶尔会迷路，但我们的爱永远是归途。",
      "不要着急，深呼吸，我会包容你所有的粗心小毛病。",
      "就算密码被遗忘，我对你的承诺也永不改变。",
      "就算你忘记了全世界，我也接纳此时此刻的你。"
    ];
    const randomTip = errorTips[Math.floor(Math.random() * errorTips.length)];
    if (dom.gatekeeperHint) {
      dom.gatekeeperHint.textContent = randomTip;
      dom.gatekeeperHint.style.color = "#fb7185";
    }

    dom.gatekeeperDialog.classList.remove("gatekeeper__dialog--error");
    void dom.gatekeeperDialog.offsetWidth;
    dom.gatekeeperDialog.classList.add("gatekeeper__dialog--error");
    if (dom.gatekeeperInput) {
      dom.gatekeeperInput.value = "";
      dom.gatekeeperInput.focus();
    }
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

    if (window.LifecycleEngine) {
      const lifecycleMgr = new window.LifecycleEngine(config);
      lifecycleMgr.init();
    }

    if (window.TimelineManager) {
      const timelineMgr = new window.TimelineManager(config);
      timelineMgr.init();
    }

    startTypewriter();

    if (config.audio && config.audio.bgmAutoPlay !== false && window.Effects) {
      window.Effects.playBgm();
    }
  }

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

  function initLicenseActivationTrigger() {
    if (!dom.universeFooterText) return;

    let pressTimer = null;
    const startPress = () => {
      pressTimer = setTimeout(() => {
        triggerLicenseInputModal();
      }, 2500);
    };
    const cancelPress = () => {
      if (pressTimer) clearTimeout(pressTimer);
    };

    dom.universeFooterText.addEventListener("mousedown", startPress);
    dom.universeFooterText.addEventListener("mouseup", cancelPress);
    dom.universeFooterText.addEventListener("touchstart", startPress, { passive: true });
    dom.universeFooterText.addEventListener("touchend", cancelPress);
  }

  async function triggerLicenseInputModal() {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    const code = prompt("🌌 跃迁引擎已激活：请输入本站绑定的专属星河契约授权码：");
    if (!code) return;

    try {
      const res = await fetch("/api/love/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          licenseCode: code.trim(),
          currentConfig: config 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        location.reload();
      } else {
        alert(data.message || "❌ 授权码无效");
      }
    } catch (_) {
      alert("❌ 无法连接授权服务器");
    }
  }

  const eggs = config.easterEggs || [];
  if (dom.eggStar) {
    dom.eggStar.onclick = () => showEggModal(eggs[0]?.message || "🌟 发现暗号星：爱情是一生一世、一男一女、一心一意！");
  }
  if (dom.eggPaw) {
    dom.eggPaw.onclick = () => showEggModal(eggs[1]?.message || "🐾 踩到猫爪印：今晚为你做一顿可口的晚餐！");
  }
  if (dom.eggModalClose && dom.eggModal) {
    dom.eggModalClose.onclick = () => { dom.eggModal.style.display = "none"; };
    dom.eggModal.onclick = (e) => { if (e.target === dom.eggModal) dom.eggModal.style.display = "none"; };
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

  let exportedPosterDataUrl = "";
  if (dom.generatePosterBtn) {
    dom.generatePosterBtn.onclick = () => {
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
    };
  }

  if (dom.closePosterBtn && dom.posterModal) {
    dom.closePosterBtn.onclick = () => { dom.posterModal.style.display = "none"; };
  }
  if (dom.downloadPosterBtn) {
    dom.downloadPosterBtn.onclick = () => {
      if (!exportedPosterDataUrl) return;
      const link = document.createElement("a");
      link.download = `雅歌契约纪念日_${Date.now()}.jpg`;
      link.href = exportedPosterDataUrl;
      link.click();
    };
  }

  async function generatePosterCanvas() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1080;
    canvas.height = 1920;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGradient.addColorStop(0, "#1e1b4b");
    bgGradient.addColorStop(0.5, "#0f172a");
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
    ctx.fillText(`${config.meta?.boyName || "良人"} & ${config.meta?.girlName || "佳偶"}`, 540, 1110);

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
    ctx.fillText("DAYS OF COVENANT · 契约同行", 540, 1570);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "26px sans-serif";
    ctx.fillText("✨ 众水不能熄灭，大水不能淹没 · 雅歌之印 ✨", 540, 1800);

    return canvas.toDataURL("image/jpeg", 0.92);
  }
});
