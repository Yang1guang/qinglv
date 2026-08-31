/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/reminder.js
 * 作用: 晨光智能提醒控制器 (0 额外网络请求、本地内存即时推算、每日单次免打扰锁、便签互动与平滑联动)
 */

class ReminderManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.modalEl = null;
    this.contentEl = null;
    this.dismissBtn = null;
    this.todayStr = this.getTodayDateString();
  }

  getTodayDateString() {
    // 强制基于东八区获取年月日 YYYY-MM-DD
    const nowBJT = new Date(Date.now() + 8 * 3600 * 1000);
    const y = nowBJT.getUTCFullYear();
    const m = String(nowBJT.getUTCMonth() + 1).padStart(2, "0");
    const d = String(nowBJT.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  init() {
    if (this.config.reminder && this.config.reminder.enabled === false) {
      return;
    }

    this.modalEl = document.getElementById("reminder-modal");
    this.contentEl = document.getElementById("reminder-modal-content");
    this.dismissBtn = document.getElementById("btn-dismiss-reminder");

    if (!this.modalEl || !this.contentEl) return;

    // 检查每日免打扰锁：当天已关闭过则不再弹出
    const dismissedKey = `love_reminder_dismissed_${this.todayStr}`;
    if (localStorage.getItem(dismissedKey) === "true") {
      return;
    }

    this.bindEvents();

    // 门禁协同：若门禁处于开启状态，等待门禁解锁后再呈现
    this.waitForGatekeeperUnlock(() => {
      this.checkAndDisplayReminders();
    });
  }

  waitForGatekeeperUnlock(callback) {
    const gateScreen = document.getElementById("gatekeeper-screen");
    if (!gateScreen || gateScreen.style.display === "none" || this.config.gatekeeper?.enabled === false) {
      setTimeout(callback, 800);
      return;
    }

    // 轮询监听门禁是否收起
    const timer = setInterval(() => {
      if (gateScreen.style.display === "none" || !document.body.contains(gateScreen)) {
        clearInterval(timer);
        setTimeout(callback, 500);
      }
    }, 400);
  }

  /**
   * 本地 0 请求比对纪念日与备忘便签
   */
  checkAndDisplayReminders() {
    if (!window.AnniversaryEngine) return;

    const anniversaries = Array.isArray(this.config.anniversaries) ? this.config.anniversaries : [];
    const advanceDays = Array.isArray(this.config.reminder?.advanceDays) ? this.config.reminder.advanceDays : [7, 3, 1, 0];
    const memos = Array.isArray(this.config.reminder?.memos) ? this.config.reminder.memos : [];

    let urgentItems = [];

    // 1. 检索命中的纪念日 (今日或即将到来 <= 3 天)
    anniversaries.forEach((item, idx) => {
      const metrics = window.AnniversaryEngine.calculateAnniversaryMetrics(item);
      if (!metrics) return;

      const isToday = Boolean(metrics.isToday);
      const daysRemaining = metrics.mode === "countup" ? 0 : (metrics.daysRemaining || 0);

      if (isToday || (metrics.mode === "annual" && daysRemaining <= 3) || advanceDays.includes(daysRemaining)) {
        urgentItems.push({
          type: "anniversary",
          item,
          metrics,
          isToday,
          daysRemaining,
          originalIndex: idx
        });
      }
    });

    // 排序：今日事件优先 -> 剩余天数由少到多
    urgentItems.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return a.daysRemaining - b.daysRemaining;
    });

    // 2. 检索待办备忘便签
    const activeMemos = memos.filter(m => !m.done);

    // 若无任何命中事件与备忘，静默退出
    if (urgentItems.length === 0 && activeMemos.length === 0) {
      return;
    }

    this.renderModalContent(urgentItems, activeMemos);
    this.openModal();
  }

  renderModalContent(urgentItems, activeMemos) {
    let html = "";

    if (urgentItems.length > 0) {
      html += urgentItems.map(entry => {
        const { item, metrics, isToday, daysRemaining, originalIndex } = entry;
        const itemClass = isToday 
          ? "reminder-item reminder-item--today" 
          : "reminder-item reminder-item--upcoming";

        let daysHtml = isToday 
          ? `<span class="reminder-item__days-num">TODAY</span><span class="reminder-item__days-unit">正是今天</span>`
          : `<span class="reminder-item__days-num">${daysRemaining}</span><span class="reminder-item__days-unit">天后到来</span>`;

        const dateMeta = metrics.formattedLunarDate 
          ? `${metrics.targetSolarDate} (${metrics.formattedLunarDate})` 
          : (metrics.targetSolarDate || item.date);

        return `
          <div class="${itemClass}" data-scroll-to="anni" data-idx="${originalIndex}">
            <div class="reminder-item__left">
              <div class="reminder-item__title-wrap">
                <span class="reminder-item__icon">${item.icon || "💖"}</span>
                <span class="reminder-item__title">${this.escapeHtml(item.title || "契约纪念日")}</span>
              </div>
              <span class="reminder-item__meta">${dateMeta} · ${item.tag || "恒久守护"}</span>
            </div>
            <div class="reminder-item__right">
              ${daysHtml}
            </div>
          </div>
        `;
      }).join("");
    }

    if (activeMemos.length > 0) {
      html += activeMemos.map((memo, mIdx) => `
        <div class="reminder-memo-item">
          <input type="checkbox" class="reminder-memo-checkbox" data-memo-idx="${mIdx}">
          <span class="reminder-memo-text">${this.escapeHtml(memo.title || "专属备忘事项")} (${memo.targetDate || "近日"})</span>
        </div>
      `).join("");
    }

    this.contentEl.innerHTML = html;

    // 绑定点击卡片平滑滚动至对应纪念日
    this.contentEl.querySelectorAll(".reminder-item").forEach(card => {
      card.onclick = () => {
        this.closeModal();
        const anniSection = document.getElementById("anniversary-section");
        if (anniSection) {
          anniSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
    });

    // 绑定便签打卡互动
    this.contentEl.querySelectorAll(".reminder-memo-checkbox").forEach(cb => {
      cb.onchange = (e) => {
        const textSpan = cb.parentElement.querySelector(".reminder-memo-text");
        if (textSpan) {
          textSpan.classList.toggle("done", cb.checked);
        }
        if (navigator.vibrate) navigator.vibrate(25);
      };
    });
  }

  openModal() {
    this.modalEl.style.display = "flex";
    void this.modalEl.offsetWidth;
    this.modalEl.classList.add("active");

    if (window.Effects && typeof window.Effects.showMiniToast === "function") {
      window.Effects.showMiniToast("🌅 晨光初现，为你带来今日专属心意提醒。");
    }
  }

  closeModal() {
    this.modalEl.classList.remove("active");
    setTimeout(() => {
      this.modalEl.style.display = "none";
    }, 400);

    // 写入当日免打扰锁，当天不再打扰
    const dismissedKey = `love_reminder_dismissed_${this.todayStr}`;
    localStorage.setItem(dismissedKey, "true");
  }

  bindEvents() {
    if (this.dismissBtn) {
      this.dismissBtn.onclick = (e) => {
        e.preventDefault();
        this.closeModal();
      };
    }

    // 点击蒙层背景关闭
    this.modalEl.onclick = (e) => {
      if (e.target === this.modalEl) {
        this.closeModal();
      }
    };
  }
}

window.ReminderManager = ReminderManager;
