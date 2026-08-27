/**
 * 众水不灭 · 雅歌之印 (Love Universe) 前台核心主控
 * 文件名: js/core.js
 */

document.addEventListener("DOMContentLoaded", () => {
  let config = window.LOVE_CONFIG || {};

  // 1. DOM 节点引用
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

  // 2. 立即初始化门禁界面与事件绑定
  initGatekeeperUI();

  // 3. 异步从 R2 拉取最新动态配置与初始化视觉
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

    // 声纹誓言麦克风识别绑定
    if (dom.voiceUnlockBtn) {
      dom.voiceUnlockBtn.onclick = (e) => {
        e.preventDefault();
        startVoiceRecognition();
      };
    }
  }

  // 语音誓言识别逻辑 (Web Speech API)
  function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("当前浏览器暂不支持语音识别，请直接在输入框输入口令解锁。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;

    if (dom.gatekeeperHint) {
      dom.gatekeeperHint.textContent = "🎙️ 正在聆听您的誓言，请清晰念出...";
      dom.gatekeeperHint.style.color = "#fde68a";
    }
    if (dom.voiceUnlockBtn) {
      dom.voiceUnlockBtn.style.animation = "pulse 1.2s infinite";
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (dom.gatekeeperHint) {
        dom.gatekeeperHint.textContent = `听到誓言：“${transcript}”，正在鉴证...`;
      }
      verifyPassword(transcript);
    };

    recognition.onerror = () => {
      if (dom.gatekeeperHint) {
        dom.gatekeeperHint.textContent = "未清晰识别到声音，请重试或使用数字口令。";
        dom.gatekeeperHint.style.color = "#fca5a5";
      }
      if (dom.voiceUnlockBtn) dom.voiceUnlockBtn.style.animation = "none";
    };

    recognition.onend = () => {
      if (dom.voiceUnlockBtn) dom.voiceUnlockBtn.style.animation = "none";
    };

    try {
      recognition.start();
    } catch (_) {}
  }

  async function syncCloudData() {
    try {
      const res = await fetch("/api/love/config");
      const data = await res.json();
      if (data.success && data.custom && data.config) {
        config = data.config;
        window.LOVE_CONFIG = config;

        initGatekeeperUI();

        if (window.Effects) {
          window.Effects.updateConfig(config);
        }
      }
    } catch (_) {}

    // 填充元数据
    if (config.meta) {
      if (dom.heroNames) dom.heroNames.textContent = `${config.meta.boyName || "男孩"} & ${config.meta.girlName || "女孩"}`;
      if (dom.heroSubtitle) dom.heroSubtitle.textContent = config.meta.siteSubtitle || "众水不能熄灭爱情，大水不能淹没 · 一生一世的契约";
      if (config.meta.siteTitle) document.title = config.meta.siteTitle;
    }

    // 激活多维主题物理引擎
    if (window.ThemeEngine) {
      const themeCfg = config.theme || {};
      window.ThemeEngine.applyTheme(themeCfg.currentTheme || "sunset-twilight", themeCfg.customBgUrl || "");
    }

    // 激活「时光留白」视差照片墙
    if (window.PhotoWallManager) {
      const photoWall = new window.PhotoWallManager(config);
      photoWall.init();
    }

    // 绑定底部版权长按触发隐藏星际授权兑换
    initLicenseActivationTrigger();

    // 若后台关闭了门禁，则直接进入
    if (config.gatekeeper && config.gatekeeper.enabled === false) {
      unlockMainUniverse(false);
    }
  }

  // 门禁口令与誓言校验
  async function verifyPassword(inputVal) {
    if (!inputVal) return;

    if (dom.gatekeeperBtn) {
      dom.gatekeeperBtn.disabled = true;
      dom.gatekeeperBtn.querySelector("span").textContent = "鉴证中...";
    }

    // 语音模式誓言关键词包含匹配
    const sacredVows = ["众水不能熄灭", "一生一世", "包容", "接纳", "雅歌", "我愿", "永远爱你"];
    const isVowMatched = sacredVows.some(vow => inputVal.includes(vow));

    if (isVowMatched) {
      if (window.Effects) {
        window.Effects.playAudio("gatekeeperPass");
        window.Effects.fireFireworks();
      }
      unlockMainUniverse(true);
      if (dom.gatekeeperBtn) {
        dom.gatekeeperBtn.disabled = false;
        dom.gatekeeperBtn.querySelector("span").textContent = "解密进入圣所";
      }
      return;
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
        dom.gatekeeperBtn.querySelector("span").textContent = "解密进入圣所";
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

    // 1. 初始化生命周期引擎
    if (window.LifecycleEngine) {
      const lifecycleMgr = new window.LifecycleEngine(config);
      lifecycleMgr.init();
    }

    // 2. 初始化拍立得相册
    if (window.TimelineManager) {
      const timelineMgr = new window.TimelineManager(config);
      timelineMgr.init();
    }

    // 3. 初始化特权刮刮乐
    if (window.ScratchCardManager) {
      const scratchMgr = new window.ScratchCardManager(config);
      scratchMgr.init();
    }

    startTypewriter();

    if (config.audio && config.audio.bgmAutoPlay !== false && window.Effects) {
      window.Effects.playBgm();
    }
  }

  // 5. 打字机告白
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

  // 6. 长按底部版权文字触发星际授权码兑换
  function initLicenseActivationTrigger() {
    if (!dom.universeFooterText) return;

    let pressTimer = null;
    const startPress = () => {
      pressTimer = setTimeout(() => {
        triggerLicenseInputModal();
      }, 2500); // 长按 2.5 秒触发
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
        body: JSON.stringify({ licenseCode: code.trim() })
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

  // 7. 彩蛋绑定
  const eggs = config.easterEggs || [];
  if (dom.eggStar) {
    dom.eggStar.onclick = () => showEggModal(eggs[0]?.message || "🌟 发现暗号星：爱情是一生一世、一心一意！");
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

  // 8. 300DPI 超清海报生成
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
