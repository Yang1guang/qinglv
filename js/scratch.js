/**
 * ====================================================================
 * 太阳 ios-IP · 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: js/scratch.js
 * 作用: 真实物理刮刮乐涂层、透明像素算法、防耍赖盖章核销系统
 * ====================================================================
 */

class ScratchCardManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG;
    this.storageKey = "love_universe_scratch_state";
    this.container = document.getElementById("scratch-container");
    this.savedState = this.loadState();
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

  /**
   * 初始化所有刮刮乐卡片
   */
  init() {
    if (!this.container) return;
    const cards = this.config.scratchCards || [];
    this.container.innerHTML = "";

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
        <!-- 底层揭晓内容 -->
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

          <!-- 拟真印章 DOM -->
          <div class="scratch-stamp ${cardState.used ? "scratch-stamp--visible" : ""}">
            <div class="scratch-stamp__circle">
              <span class="scratch-stamp__status">已核销</span>
              <span class="scratch-stamp__time">${cardState.usedTime || ""}</span>
            </div>
          </div>
        </div>

        <!-- 顶层 Canvas 磨砂刮奖涂层 -->
        <canvas class="scratch-card__canvas" ${cardState.scratched ? 'style="display:none;"' : ""}></canvas>
      `;

      this.container.appendChild(cardWrapper);

      // 绑定刮奖 Canvas 引擎
      if (!cardState.scratched) {
        const canvas = cardWrapper.querySelector(".scratch-card__canvas");
        this.setupCanvas(canvas, cardData.id);
      }

      // 绑定核销按钮事件
      const redeemBtn = cardWrapper.querySelector(".btn-redeem");
      redeemBtn.addEventListener("click", () => {
        this.handleRedeem(cardData.id, cardWrapper);
      });
    });
  }

  /**
   * 构建 Canvas 物理刮除逻辑
   */
  setupCanvas(canvas, cardId) {
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const width = rect.width || 300;
    const height = rect.height || 180;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    // 绘制高级金属磨砂质感涂层
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#d1d5db");
    gradient.addColorStop(0.5, "#9ca3af");
    gradient.addColorStop(1, "#6b7280");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 涂层装饰纹样与提示字
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ 刮开涂层 兑现特权 ✨", width / 2, height / 2);

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
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.fill();

      // 平滑连线消除断点
      if (lastPoint) {
        ctx.lineWidth = 36;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      lastPoint = pos;
    };

    // 计算被刮开的透明像素百分比 (步进抽样优化性能)
    const checkPercentage = () => {
      if (isFinished) return;
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const step = 32; // 抽样步长
      let transparentCount = 0;
      let totalSampled = 0;

      for (let i = 3; i < data.length; i += 4 * step) {
        totalSampled++;
        if (data[i] < 128) {
          transparentCount++;
        }
      }

      const ratio = transparentCount / totalSampled;
      if (ratio > 0.45) {
        isFinished = true;
        this.revealCard(canvas, cardId);
      }
    };

    // 统一指针事件监听 (兼容 Touch 与 Mouse)
    const onStart = (e) => {
      isDrawing = true;
      lastPoint = getPos(e);
      scratch(lastPoint);
      if (window.Effects) window.Effects.playAudio("scratch");
    };

    const onMove = (e) => {
      if (!isDrawing || isFinished) return;
      e.preventDefault();
      const pos = getPos(e);
      scratch(pos);
    };

    const onEnd = () => {
      if (!isDrawing) return;
      isDrawing = false;
      lastPoint = null;
      checkPercentage();
    };

    canvas.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    canvas.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }

  /**
   * 超过 45% 面积时自动完全淡出揭开
   */
  revealCard(canvas, cardId) {
    canvas.style.transition = "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
    canvas.style.opacity = "0";

    setTimeout(() => {
      canvas.style.display = "none";
    }, 500);

    if (!this.savedState[cardId]) {
      this.savedState[cardId] = {};
    }
    this.savedState[cardId].scratched = true;
    this.saveState();

    if (window.Effects) {
      window.Effects.fireConfetti();
    }
  }

  /**
   * 拟真印章核销逻辑
   */
  handleRedeem(cardId, cardWrapper) {
    const cardState = this.savedState[cardId] || {};
    if (cardState.used) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

    cardState.used = true;
    cardState.usedTime = timeStr;
    this.savedState[cardId] = cardState;
    this.saveState();

    // 触发印章动效
    const stampEl = cardWrapper.querySelector(".scratch-stamp");
    const stampTimeEl = stampEl.querySelector(".scratch-stamp__time");
    const redeemBtn = cardWrapper.querySelector(".btn-redeem");

    stampTimeEl.textContent = timeStr;
    stampEl.classList.add("scratch-stamp--visible", "scratch-stamp--slam");

    redeemBtn.disabled = true;
    redeemBtn.textContent = "已兑现特权";

    // 播放核销砰击声与震动
    if (window.Effects) {
      window.Effects.playAudio("stamp");
    }
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 100]);
    }
  }
}

// 挂载至全局
window.ScratchCardManager = ScratchCardManager;
