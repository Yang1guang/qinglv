/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/icebreaker.js
 * 作用: 破冰与情感信号箱客户端主控 (自适应退避轮询、Web Audio 解锁与降噪压制、状态机握手、情书展卷与触觉反馈)
 */

class IceBreakerManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.deviceId = this.getOrCreateDeviceId();
    this.pollTimer = null;
    this.pollInterval = 4000; // 初始活跃轮询 4 秒
    this.consecutiveNoChangeCount = 0;
    this.currentActiveSignal = null;
    this.audioContext = null;
    this.coolingTimerId = null;
  }

  getOrCreateDeviceId() {
    let devId = localStorage.getItem("love_device_id");
    if (!devId) {
      devId = `dev_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      localStorage.setItem("love_device_id", devId);
    }
    return devId;
  }

  escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  init() {
    const container = document.getElementById("icebreaker-container");
    if (!container) return;

    this.renderActionButtons(container);
    this.bindGlobalEvents();
    this.initAudioContext();
    this.startAdaptivePolling();
  }

  /**
   * 1. 依据关系生命周期阶段动态渲染安全动作按钮
   */
  renderActionButtons(container) {
    const phase = this.config.lifecycle?.currentPhase || "dating";
    const allActions = this.config.icebreaker?.actions || {};
    const currentActions = allActions[phase] || allActions["dating"] || [];

    if (currentActions.length === 0) {
      const section = document.getElementById("icebreaker-section");
      if (section) section.style.display = "none";
      return;
    }

    const section = document.getElementById("icebreaker-section");
    if (section) section.style.display = "block";

    container.innerHTML = currentActions.map(action => `
      <button class="icebreaker-btn" data-action-type="${action.type}">
        <span class="icebreaker-btn__icon">${action.icon}</span>
        <span class="icebreaker-btn__label">${action.label}</span>
        <span class="icebreaker-btn__desc">${this.escapeHtml(action.desc)}</span>
      </button>
    `).join("");

    container.querySelectorAll(".icebreaker-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const actionType = btn.getAttribute("data-action-type");
        this.handleSendSignal(actionType);
      };
    });
  }

  /**
   * 2. 发送破冰/情感信号
   */
  async handleSendSignal(actionType) {
    const phase = this.config.lifecycle?.currentPhase || "dating";
    const perspective = (window.ThemeEngine && window.ThemeEngine.currentPerspective) || "boy";

    if (navigator.vibrate) navigator.vibrate([30, 40]);

    try {
      const res = await fetch("/api/love/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: phase,
          senderGender: perspective,
          senderDeviceId: this.deviceId,
          actionType: actionType,
          customText: ""
        })
      });

      const data = await res.json();

      if (data.success) {
        this.playGentleChime();
        if (data.status === "mutual_resolved") {
          this.showMutualCelebration(data.signal);
        } else {
          if (window.Effects && typeof window.Effects.showMiniToast === "function") {
            window.Effects.showMiniToast("🕊️ 情感信笺已飞向对方时空，愿爱包容一切。");
          }
          this.triggerSendingPulse();
        }
        this.pollInterval = 3000;
        this.startAdaptivePolling();
      } else if (data.code === "IN_COOLDOWN") {
        alert(`⏳ ${data.message} (还剩 ${data.remainingSeconds} 秒)`);
      } else {
        alert(`提示: ${data.message || data.error}`);
      }
    } catch (err) {
      console.warn("[信号系统] 网络异常:", err.message);
    }
  }

  /**
   * 3. 自适应退避轮询机制 (切出应用或锁屏时完全休眠)
   */
  startAdaptivePolling() {
    clearTimeout(this.pollTimer);

    const executePoll = async () => {
      if (document.hidden) {
        return; // 页面切后台完全挂起，0 资源开销
      }

      try {
        const res = await fetch("/api/love/signal");
        if (res.ok) {
          const data = await res.json();
          this.handleServerSignalResponse(data);
        }
      } catch (_) {}

      // 退避算法：若无新信号，逐步将轮询间隔自适应拉长至 12 秒
      if (this.consecutiveNoChangeCount > 4) {
        this.pollInterval = Math.min(12000, this.pollInterval + 2000);
      } else {
        this.pollInterval = Math.max(4000, this.pollInterval);
      }

      this.pollTimer = setTimeout(executePoll, this.pollInterval);
    };

    this.pollTimer = setTimeout(executePoll, 1000);
  }

  /**
   * 4. 响应服务端信号分发
   */
  handleServerSignalResponse(data) {
    const active = data.activeSignal;

    if (!active) {
      this.hideBanner();
      this.consecutiveNoChangeCount++;
      return;
    }

    // A. 双方在同一刻双向奔赴
    if (active.status === "mutual_resolved") {
      this.consecutiveNoChangeCount = 0;
      if (!this.currentActiveSignal || this.currentActiveSignal.status !== "mutual_resolved") {
        this.currentActiveSignal = active;
        this.showMutualCelebration(active);
      }
      return;
    }

    // B. 我自己发出的信号
    if (active.senderDeviceId === this.deviceId) {
      this.consecutiveNoChangeCount = 0;
      if (active.status === "accepted") {
        this.showAcceptedCelebration(active);
      }
      return;
    }

    // C. 对方发来的活跃信号
    if (active.status === "active" || active.status === "viewed" || active.status === "cooling") {
      this.consecutiveNoChangeCount = 0;
      this.currentActiveSignal = active;
      this.showIncomingBanner(active);
    }
  }

  /**
   * 5. 弹出顶部非侵入微光通知横幅
   */
  showIncomingBanner(signal) {
    const banner = document.getElementById("icebreaker-banner");
    const textEl = document.getElementById("icebreaker-banner-text");
    if (!banner || !textEl) return;

    const senderTitle = signal.senderGender === "boy" ? "他" : "她";
    let actionTip = `${senderTitle}递来了一封和解信笺...`;

    if (signal.actionType === "calm_down") actionTip = `${senderTitle}需要片刻冷静...`;
    else if (signal.actionType === "apology") actionTip = `${senderTitle}真诚地向你道歉了...`;
    else if (signal.actionType === "miss_you") actionTip = `${senderTitle}正在深深地想念你...`;
    else if (signal.actionType === "warm_hug") actionTip = `${senderTitle}隔空送来了温暖拥抱...`;

    textEl.textContent = `💌 ${actionTip}`;
    banner.classList.add("show");

    banner.onclick = (e) => {
      e.preventDefault();
      this.openReconciliationModal(signal);
      this.ackSignal("viewed", signal.signalId);
    };
  }

  hideBanner() {
    const banner = document.getElementById("icebreaker-banner");
    if (banner) banner.classList.remove("show");
  }

  /**
   * 6. 打开沉浸式全屏和解空间
   */
  openReconciliationModal(signal) {
    const modal = document.getElementById("icebreaker-modal");
    if (!modal) return;

    this.hideBanner();
    this.playGentleChime();

    const badgeEl = document.getElementById("icebreaker-modal-badge");
    const titleEl = document.getElementById("icebreaker-modal-title");
    const letterEl = document.getElementById("icebreaker-modal-letter");
    const actionsEl = document.getElementById("icebreaker-modal-actions");

    const senderTitle = signal.senderGender === "boy" ? "良人" : "佳偶";
    if (badgeEl) badgeEl.textContent = `SACRED COVENANT · ${senderTitle}的温情信笺`;
    if (titleEl) titleEl.textContent = "愿爱化解一切 · 我们的避风港";
    if (letterEl) letterEl.textContent = `“ ${signal.content} ”`;

    // 渲染回应按键
    if (actionsEl) {
      if (signal.actionType === "calm_down") {
        actionsEl.innerHTML = `
          <div class="icebreaker-cooling-box">
            <span>🌿 情绪正在降温中，深呼吸，平静安息。</span>
            <div class="icebreaker-cooling-timer" id="coolingTimerText">冷静期进行中</div>
          </div>
          <button class="icebreaker-btn-primary" id="btn-accept-peace"><span>🤝 握住这只手 (我也在调整心情)</span></button>
          <button class="icebreaker-btn-secondary" id="btn-close-modal"><span>稍后回应 ✕</span></button>
        `;
      } else {
        actionsEl.innerHTML = `
          <button class="icebreaker-btn-primary" id="btn-accept-peace"><span>🕊️ 握住这只手 (接纳并和好)</span></button>
          <button class="icebreaker-btn-secondary" id="btn-wait-peace"><span>还在整理心情中 (稍等片刻)</span></button>
          <button class="icebreaker-btn-secondary" id="btn-close-modal"><span>收起 ✕</span></button>
        `;
      }

      const acceptBtn = document.getElementById("btn-accept-peace");
      const waitBtn = document.getElementById("btn-wait-peace");
      const closeBtn = document.getElementById("btn-close-modal");

      if (acceptBtn) {
        acceptBtn.onclick = () => {
          this.ackSignal("accept", signal.signalId, "我们和好吧，爱是永不止息。");
          this.closeModal();
          this.showAcceptedCelebration(signal);
        };
      }
      if (waitBtn) {
        waitBtn.onclick = () => {
          this.ackSignal("wait_a_bit", signal.signalId, "还在整理心情，很快就好。");
          this.closeModal();
          if (window.Effects) window.Effects.showMiniToast("已通知对方你正在整理心情...");
        };
      }
      if (closeBtn) {
        closeBtn.onclick = () => this.closeModal();
      }
    }

    modal.classList.add("active");
  }

  closeModal() {
    const modal = document.getElementById("icebreaker-modal");
    if (modal) modal.classList.remove("active");
  }

  /**
   * 7. 回应信号
   */
  async ackSignal(responseType, signalId, responseText = "") {
    const perspective = (window.ThemeEngine && window.ThemeEngine.currentPerspective) || "girl";
    try {
      await fetch("/api/love/signal/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId,
          responderGender: perspective,
          responderDeviceId: this.deviceId,
          responseType,
          responseText
        })
      });
    } catch (_) {}
  }

  /**
   * 8. 触发双向奔赴盛典 (MUTUAL_HEAL)
   */
  showMutualCelebration(signal) {
    this.playGentleChime();
    if (window.Effects) {
      window.Effects.fireConfetti();
      if (typeof window.Effects.fireFireworks === "function") {
        window.Effects.fireFireworks();
      }
      window.Effects.showMiniToast("✨ 奇妙的默契！你们在同一刻选择了彼此与和好！💖");
    }

    const modal = document.getElementById("icebreaker-modal");
    if (modal) {
      modal.classList.add("icebreaker-modal--mutual");
      this.openReconciliationModal({
        ...signal,
        content: "众水不能熄灭爱情，大水不能淹没。在这一刻，你们同时向对方递出了和好的橄榄枝！"
      });
    }
  }

  /**
   * 9. 触发和好达成庆典
   */
  showAcceptedCelebration(signal) {
    if (window.Effects) {
      window.Effects.fireConfetti();
      window.Effects.showMiniToast("🎉 破冰成功！爱是恒久忍耐又有恩慈，愿爱永不止息。");
    }
  }

  triggerSendingPulse() {
    const card = document.querySelector(".icebreaker-card");
    if (card) {
      card.style.borderColor = "var(--primary-pink)";
      setTimeout(() => { card.style.borderColor = ""; }, 1200);
    }
  }

  /**
   * 10. Web Audio 纯净空灵风铃音效合成 (带全局 BGM 降噪压制)
   */
  initAudioContext() {
    const unlock = () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext && this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("click", unlock, { once: true });
  }

  playGentleChime() {
    this.duckGlobalBgm();

    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioContext = new AudioCtx();
      }
      if (!this.audioContext) return;

      const ctx = this.audioContext;
      if (ctx.state === "suspended") ctx.resume();

      // 合成两声清脆唯美的高空和弦 (523.25Hz C5 -> 659.25Hz E5 -> 783.99Hz G5)
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 1.3);
      });
    } catch (_) {}

    setTimeout(() => {
      this.resumeGlobalBgm();
    }, 1600);
  }

  duckGlobalBgm() {
    if (window.Effects && window.Effects.bgmAudio) {
      window.Effects.bgmAudio.volume = 0.15;
    }
  }

  resumeGlobalBgm() {
    if (window.Effects && window.Effects.bgmAudio) {
      window.Effects.bgmAudio.volume = 1.0;
    }
  }

  bindGlobalEvents() {
    // 页面切后台自动暂停轮询，切回前台立即单触同步
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.pollInterval = 3000;
        this.startAdaptivePolling();
      }
    });
  }
}

window.IceBreakerManager = IceBreakerManager;
