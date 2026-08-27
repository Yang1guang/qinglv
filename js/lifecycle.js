/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/lifecycle.js
 * 作用: 情感生命周期联动引擎，负责前台 3 阶段按钮切换、待办清单渲染及特权卡联动
 */

class LifecycleEngine {
  constructor(config) {
    this.config = config || {};
    this.stageData = window.STAGE_CONTENT || {};
    // 当前激活阶段，默认读取配置或恋爱期
    this.activePhase = this.config.lifecycle?.currentPhase || "dating";
    // 本地持久化保存用户的打勾状态与刮卡状态
    this.userProgress = this.loadUserProgress();
  }

  init() {
    this.bindPhaseButtons();
    this.switchPhase(this.activePhase, false);
  }

  loadUserProgress() {
    try {
      const cache = localStorage.getItem("love_universe_stage_progress");
      return cache ? JSON.parse(cache) : {};
    } catch (_) {
      return {};
    }
  }

  saveUserProgress() {
    try {
      localStorage.setItem("love_universe_stage_progress", JSON.stringify(this.userProgress));
    } catch (_) {}
  }

  bindPhaseButtons() {
    const buttons = document.querySelectorAll(".phase-tab-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const phase = btn.dataset.phase;
        if (phase && phase !== this.activePhase) {
          this.switchPhase(phase, true);
        }
      });
    });
  }

  switchPhase(phase, playSound = false) {
    if (!this.stageData[phase]) return;
    this.activePhase = phase;

    // 1. 更新按钮高亮状态
    document.querySelectorAll(".phase-tab-btn").forEach(btn => {
      if (btn.dataset.phase === phase) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const data = this.stageData[phase];

    // 2. 更新清单标题与描述
    const titleEl = document.getElementById("checklist-section-title");
    const descEl = document.getElementById("checklist-section-desc");
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.subtitle;

    // 3. 更新特权卡区域标题
    const scratchTitleEl = document.getElementById("scratch-section-title");
    if (scratchTitleEl) scratchTitleEl.textContent = data.scratchTitle;

    // 4. 渲染待办清单
    this.renderChecklist(data.checklist);

    // 5. 联动渲染特权刮刮乐
    this.renderScratchCards(data.scratchCards);

    if (playSound && window.Effects) {
      window.Effects.playAudio("flip");
    }
  }

  renderChecklist(items) {
    const container = document.getElementById("checklist-container");
    if (!container) return;

    container.innerHTML = "";
    let completedCount = 0;

    items.forEach((item, idx) => {
      // 优先读取本地持久化状态
      const isDone = this.userProgress[`chk_${item.id}`] !== undefined 
        ? this.userProgress[`chk_${item.id}`] 
        : Boolean(item.completed);

      if (isDone) completedCount++;

      const el = document.createElement("div");
      el.className = `checklist-item ${isDone ? 'checklist-item--checked' : ''}`;
      el.innerHTML = `
        <div class="checklist-item__box">
          <span class="checklist-item__check">✓</span>
        </div>
        <div class="checklist-item__text">${this.escapeHtml(item.title)}</div>
      `;

      el.onclick = () => {
        const newState = !el.classList.contains("checklist-item--checked");
        el.classList.toggle("checklist-item--checked", newState);
        this.userProgress[`chk_${item.id}`] = newState;
        this.saveUserProgress();

        if (newState && window.Effects) {
          window.Effects.fireConfetti();
          window.Effects.playAudio("stamp");
        }
        this.updateChecklistStats(items.length);
      };

      container.appendChild(el);
    });

    this.updateChecklistStats(items.length);
  }

  updateChecklistStats(total) {
    const container = document.getElementById("checklist-container");
    if (!container) return;
    const completedCount = container.querySelectorAll(".checklist-item--checked").length;
    const fill = document.getElementById("checklist-progress-fill");
    const stats = document.getElementById("checklist-stats");

    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    if (fill) fill.style.width = `${percent}%`;
    if (stats) stats.textContent = `已达成心愿 ${completedCount} / ${total} 项 (${percent}%)`;
  }

  renderScratchCards(cards) {
    const container = document.getElementById("scratch-container");
    if (!container) return;

    container.innerHTML = "";

    cards.forEach((card, idx) => {
      const isScratched = this.userProgress[`scratched_${card.id}`] || Boolean(card.scratched);
      const isUsed = this.userProgress[`used_${card.id}`] || Boolean(card.used);
      const usedTime = this.userProgress[`used_time_${card.id}`] || card.usedTime || "";

      const cardEl = document.createElement("div");
      cardEl.className = `scratch-card ${isScratched ? 'scratched' : ''} ${isUsed ? 'used' : ''}`;
      cardEl.id = `card-dom-${card.id}`;

      cardEl.innerHTML = `
        <div class="scratch-card__body">
          <div class="scratch-card__icon">${card.icon || '🎁'}</div>
          <h4 class="scratch-card__title">${this.escapeHtml(card.title)}</h4>
          <p class="scratch-card__content">${this.escapeHtml(card.content)}</p>
          <button class="scratch-card__use-btn" id="btn-use-${card.id}" ${isUsed ? 'disabled' : ''}>
            ${isUsed ? '已兑现特权' : '兑现特权'}
          </button>
        </div>
        ${!isScratched ? `<canvas class="scratch-card__canvas" id="canvas-${card.id}"></canvas>` : ''}
        ${isUsed ? `<div class="scratch-card__stamp"><div class="stamp-inner">已核销<br><small>${usedTime}</small></div></div>` : ''}
      `;

      container.appendChild(cardEl);

      // 绑定涂层刮开事件
      if (!isScratched) {
        this.initCanvasScratch(card.id);
      }

      // 绑定核销按钮事件
      const useBtn = cardEl.querySelector(`#btn-use-${card.id}`);
      if (useBtn) {
        useBtn.onclick = () => this.useCard(card.id);
      }
    });
  }

  initCanvasScratch(cardId) {
    setTimeout(() => {
      const canvas = document.getElementById(`canvas-${cardId}`);
      if (!canvas) return;
      const cardDom = document.getElementById(`card-dom-${cardId}`);
      const rect = cardDom.getBoundingClientRect();
      canvas.width = rect.width || 320;
      canvas.height = rect.height || 200;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#64748b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ 刮开涂层 兑现特权 ✨", canvas.width / 2, canvas.height / 2);

      let isDrawing = false;
      let scratchedPixels = 0;

      const scratch = (x, y) => {
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();

        scratchedPixels++;
        if (scratchedPixels > 25 && !cardDom.classList.contains("scratched")) {
          cardDom.classList.add("scratched");
          this.userProgress[`scratched_${cardId}`] = true;
          this.saveUserProgress();
          canvas.style.opacity = "0";
          setTimeout(() => canvas.remove(), 300);
          if (window.Effects) window.Effects.playAudio("scratch");
        }
      };

      const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - r.left, y: clientY - r.top };
      };

      canvas.addEventListener("mousedown", (e) => { isDrawing = true; const p = getPos(e); scratch(p.x, p.y); });
      canvas.addEventListener("mousemove", (e) => { if (isDrawing) { const p = getPos(e); scratch(p.x, p.y); } });
      window.addEventListener("mouseup", () => { isDrawing = false; });

      canvas.addEventListener("touchstart", (e) => { isDrawing = true; const p = getPos(e); scratch(p.x, p.y); }, { passive: true });
      canvas.addEventListener("touchmove", (e) => { if (isDrawing) { const p = getPos(e); scratch(p.x, p.y); } }, { passive: true });
      window.addEventListener("touchend", () => { isDrawing = false; });
    }, 50);
  }

  useCard(cardId) {
    if (!confirm("确定要现在核销兑现这张特权券吗？")) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    this.userProgress[`used_${cardId}`] = true;
    this.userProgress[`used_time_${cardId}`] = dateStr;
    this.saveUserProgress();

    if (window.Effects) {
      window.Effects.fireFireworks();
      window.Effects.playAudio("stamp");
    }

    // 刷新当前阶段的特权卡展示
    this.renderScratchCards(this.stageData[this.activePhase].scratchCards);
  }

  escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

window.LifecycleEngine = LifecycleEngine;
