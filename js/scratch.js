/**
 * ====================================================================
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/scratch.js
 * 作用: 真实物理刮刮乐涂层、透明像素算法、防耍赖盖章核销系统 (支持 Stage 唤醒与 0x0 尺寸塌陷自愈)
 * ====================================================================
 */

class ScratchCardManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.storageKey = "love_universe_scratch_state";
    this.container = document.getElementById("scratch-container");
    this.currentPhase = (this.config.lifecycle && this.config.lifecycle.currentPhase) || "dating";
    this.savedState = this.loadState();
    this.activeCanvases = new Map();
  }

  loadState() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    } catch (_) {
      return {};
    }
  }

  saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.savedState));
  }

  init() {
    this.renderPhaseCards(this.currentPhase);
    this.bindStageLifecycle();
  }

  /**
   * 监听舞台生命周期与广播
   */
  bindStageLifecycle() {
    window.addEventListener("stage:opened", (e) => {
      const stageId = e.detail && e.detail.stageId;
      if (stageId === "scratch") {
        // 分幕激活后，在下一帧以真实 DOM 尺寸校准所有 Canvas
        requestAnimationFrame(() => {
          this.recalibrateCanvases();
        });
      }
    });

    window.addEventListener("resize", () => {
      this.recalibrateCanvases();
    });
  }

  /**
   * 切换阶段 (恋爱期 / 订婚期 / 结婚期)
   */
  switchPhase(phase) {
    if (!phase || phase === this.currentPhase) return;
    this.currentPhase = phase;
    this.renderPhaseCards(phase);
  }

  /**
   * 依据阶段动态渲染刮刮乐卡片
   */
  renderPhaseCards(phase = "dating") {
    if (!this.container) return;

    let targetData = null;
    if (window.STAGE_CONTENT && window.STAGE_CONTENT[phase]) {
      targetData = window.STAGE_CONTENT[phase];
    }

    const cards = (targetData && targetData.scratchCards) || this.config.scratchCards || [];
    
    const titleEl = document.getElementById("scratch-section-title");
    if (titleEl && targetData) {
      titleEl.textContent = targetData.scratchTitle || "舍己与包容特权券";
    }

    this.container.innerHTML = "";
    this.activeCanvases.clear();

    cards.forEach((cardData) => {
      const cardState = this.savedState[cardData.id] || {
        scratched: cardData.scratched || false,
        used: cardData.used || false,
        usedTime: cardData.usedTime || "",
      };

      const cardWrapper = document.createElement("div");
      cardWrapper.className = "scratch-card";
      cardWrapper.id = `scratch-card-${cardData.id}`;

      cardWrapper.innerHTML = `
        <div class="scratch-card__content">
          <div class="scratch-card__header">
            <span class="scratch-card__icon">${cardData.icon || "🎁"}</span>
            <h3 class="scratch-card__title">${cardData.title}</h3>
          </div>
          <p class="scratch-card__text">${cardData.content}</p>
          
          <div class="scratch-card__action">
            <button class="btn-universe btn-universe--primary btn-redeem" ${cardState.used ? "disabled" : ""}>
              ${cardState.used ? "已兑现特权" : "立即核销使用"}
            </button>
          </div>

          <div class="scratch-stamp ${cardState.used ? "scratch-stamp--visible" : ""}">
            <div class="scratch-stamp__circle">
              <span class="scratch-stamp__status">已核销</span>
              <span class="scratch-stamp__time">${cardState.usedTime || ""}</span>
            </div>
          </div>
        </div>

        <canvas class="scratch-card__canvas" ${cardState.scratched ? 'style="display:none;"' : ""}></canvas>
      `;

      this.container.appendChild(cardWrapper);

      if (!cardState.scratched) {
        const canvas = cardWrapper.querySelector(".scratch-card__canvas");
        this.setupCanvas(canvas, cardData.id);
      }

      const redeemBtn = cardWrapper.querySelector(".btn-redeem");
      redeemBtn.addEventListener("click", () => {
        this.handleRedeem(cardData.id, cardWrapper);
      });
    });
  }

  /**
   * 构建 Canvas 物理刮除逻辑 (自适应真实物理像素尺寸)
   */
  setupCanvas(canvas, cardId) {
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    
    // 若测量高度为 0 (隐藏状态)，先标记并在 stage:opened 时重校
    const width = Math.floor(rect.width) || parent.clientWidth || 320;
    const height = Math.floor(rect.height) || parent.clientHeight || 200;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.drawCover(ctx, width, height);

    this.activeCanvases.set(cardId, { canvas, ctx, cardId });

    let isDrawing = false;
    let isFinished = false;
    let lastPoint = null;

    const getPos = (e) => {
      const cRect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - cRect.left,
        y: clientY - cRect.top,
      };
    };

    const scratch = (pos) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();

      if (lastPoint) {
        ctx.lineWidth = 40;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      lastPoint = pos;
    };

    const checkPercentage = () => {
      if (isFinished) return;
      const curW = canvas.width;
      const curH = canvas.height;
      if (curW === 0 || curH === 0) return;

      const imgData = ctx.getImageData(0, 0, curW, curH);
      const data = imgData.data;
      const step = 32;
      let transparentCount = 0;
      let totalSampled = 0;

      for (let i = 3; i < data.length; i += 4 * step) {
        totalSampled++;
        if (data[i] < 128) {
          transparentCount++;
        }
      }

      const ratio = transparentCount / (totalSampled || 1);
      if (ratio > 0.42) {
        isFinished = true;
        this.revealCard(canvas, cardId);
      }
    };

    const onStart = (e) => {
      isDrawing = true;
      lastPoint = getPos(e);
      scratch(lastPoint);
      if (window.Effects && typeof window.Effects.playAudio === "function") {
        window.Effects.playAudio("scratch");
      }
    };

    const onMove = (e) => {
      if (!isDrawing || isFinished) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      scratch(pos);
    };

    const onEnd = () => {
      if (!isDrawing) return;
      isDrawing = false;
      lastPoint = null;
      checkPercentage();
    };

    canvas.onmousedown = onStart;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    canvas.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }

  drawCover(ctx, width, height) {
    if (width <= 0 || height <= 0) return;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#d1d5db");
    gradient.addColorStop(0.5, "#9ca3af");
    gradient.addColorStop(1, "#6b7280");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ 刮开涂层 兑现特权 ✨", width / 2, height / 2);
  }

  /**
   * 尺寸校准自愈逻辑
   */
  recalibrateCanvases() {
    this.activeCanvases.forEach(({ canvas, ctx }) => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const realW = Math.floor(rect.width) || parent.clientWidth;
      const realH = Math.floor(rect.height) || parent.clientHeight;

      if (realW > 0 && realH > 0 && (canvas.width !== realW || canvas.height !== realH)) {
        canvas.width = realW;
        canvas.height = realH;
        this.drawCover(ctx, realW, realH);
      }
    });
  }

  revealCard(canvas, cardId) {
    canvas.style.transition = "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
    canvas.style.opacity = "0";

    setTimeout(() => {
      canvas.style.display = "none";
      this.activeCanvases.delete(cardId);
    }, 450);

    if (!this.savedState[cardId]) {
      this.savedState[cardId] = {};
    }
    this.savedState[cardId].scratched = true;
    this.saveState();

    if (window.Effects && typeof window.Effects.fireConfetti === "function") {
      window.Effects.fireConfetti();
    }
  }

  handleRedeem(cardId, cardWrapper) {
    const cardState = this.savedState[cardId] || {};
    if (cardState.used) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

    cardState.used = true;
    cardState.usedTime = timeStr;
    this.savedState[cardId] = cardState;
    this.saveState();

    const stampEl = cardWrapper.querySelector(".scratch-stamp");
    const stampTimeEl = stampEl.querySelector(".scratch-stamp__time");
    const redeemBtn = cardWrapper.querySelector(".btn-redeem");

    stampTimeEl.textContent = timeStr;
    stampEl.classList.add("scratch-stamp--visible", "scratch-stamp--slam");

    redeemBtn.disabled = true;
    redeemBtn.textContent = "已兑现特权";

    if (window.Effects && typeof window.Effects.playAudio === "function") {
      window.Effects.playAudio("stamp");
    }
    if (navigator.vibrate) {
      navigator.vibrate([40, 30, 80]);
    }
  }
}

window.ScratchCardManager = ScratchCardManager;
document.addEventListener("DOMContentLoaded", () => {
  if (window.LOVE_CONFIG) {
    window.ScratchCardInstance = new ScratchCardManager(window.LOVE_CONFIG);
    window.ScratchCardInstance.init();
  }
});
