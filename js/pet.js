/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/pet.js
 * 作用: 恩典灵宠状态管理、感恩喂养记录与舍己之果触发
 */

class GracePetManager {
  constructor(config) {
    this.config = config || {};
    this.petData = this.config.petData || {
      name: "和平灵鸽 · 恩典使者",
      icon: "🕊️",
      glowEnergy: 100,
      gratitudeCount: 0,
      sacrificeCount: 0,
      logs: []
    };
  }

  init() {
    this.injectDOM();
    this.bindEvents();
    this.updateUI();
  }

  injectDOM() {
    // 1. 注入悬浮触发挂件
    const widget = document.createElement("div");
    widget.className = "grace-pet-widget";
    widget.id = "grace-pet-trigger";
    widget.title = "点击进入恩典灵宠空间";
    widget.innerHTML = `
      <div class="grace-pet-avatar">
        <span id="grace-pet-icon-display">${this.petData.icon || "🕊️"}</span>
        <div class="grace-pet-halo"></div>
      </div>
      <div class="grace-pet-badge" id="grace-pet-level-badge">光芒值 ${this.petData.glowEnergy || 100}</div>
    `;
    document.body.appendChild(widget);

    // 2. 注入灵宠交互模态弹窗
    const modal = document.createElement("div");
    modal.className = "grace-pet-modal";
    modal.id = "grace-pet-modal";
    modal.innerHTML = `
      <div class="grace-pet-dialog">
        <button class="grace-pet-dialog-close" id="grace-pet-close-btn">✕</button>
        
        <div class="grace-pet-card-header">
          <div class="grace-pet-big-avatar">
            <span id="grace-pet-big-icon">${this.petData.icon || "🕊️"}</span>
          </div>
          <div class="grace-pet-name">${this.petData.name || "和平灵鸽 · 恩典使者"}</div>
          <div class="grace-pet-sub">以每日的感恩与舍己为粮，爱永不止息</div>
        </div>

        <div class="grace-stats-grid">
          <div class="grace-stat-box">
            <div class="grace-stat-val" id="stat-glow-energy">${this.petData.glowEnergy || 100}</div>
            <div class="grace-stat-lbl">✨ 光芒能量</div>
          </div>
          <div class="grace-stat-box">
            <div class="grace-stat-val" id="stat-gratitude-count">${this.petData.gratitudeCount || 0}</div>
            <div class="grace-stat-lbl">💧 感恩之露</div>
          </div>
          <div class="grace-stat-box">
            <div class="grace-stat-val" id="stat-sacrifice-count">${this.petData.sacrificeCount || 0}</div>
            <div class="grace-stat-lbl">🍎 舍己之果</div>
          </div>
        </div>

        <div class="grace-action-section">
          <div class="grace-action-title">💧 献上今日感恩之露 (记录一件感动小事)</div>
          <textarea id="gratitude-input" class="grace-textarea" rows="2" placeholder="今天我想对你说谢谢，因为你..."></textarea>
          <button class="grace-feed-btn" id="feed-gratitude-btn">🕊️ 凝聚感恩之露并喂养</button>
          <button class="grace-sacrifice-btn" id="feed-sacrifice-btn">🤝 我愿主动退让一步 (结出舍己之果)</button>
        </div>

        <div style="font-size:12px; font-weight:800; color:#94a3b8; margin-bottom:8px;">📜 近期感恩与包容足迹：</div>
        <div class="grace-log-list" id="grace-log-container"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  bindEvents() {
    const trigger = document.getElementById("grace-pet-trigger");
    const modal = document.getElementById("grace-pet-modal");
    const closeBtn = document.getElementById("grace-pet-close-btn");
    const feedBtn = document.getElementById("feed-gratitude-btn");
    const sacrificeBtn = document.getElementById("feed-sacrifice-btn");

    if (trigger && modal) {
      trigger.onclick = () => { modal.style.display = "flex"; this.updateUI(); };
    }
    if (closeBtn && modal) {
      closeBtn.onclick = () => { modal.style.display = "none"; };
      modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
    }

    if (feedBtn) {
      feedBtn.onclick = () => this.feedGratitude();
    }
    if (sacrificeBtn) {
      sacrificeBtn.onclick = () => this.triggerSacrifice();
    }
  }

  feedGratitude() {
    const input = document.getElementById("gratitude-input");
    const text = input ? input.value.trim() : "";
    if (!text) return alert("请写下一句发自内心的感恩之言！");

    this.petData.glowEnergy = (this.petData.glowEnergy || 100) + 15;
    this.petData.gratitudeCount = (this.petData.gratitudeCount || 0) + 1;
    if (!this.petData.logs) this.petData.logs = [];

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    this.petData.logs.unshift({ type: "gratitude", text, date: dateStr });

    if (input) input.value = "";

    if (window.Effects) {
      window.Effects.fireFireworks();
      window.Effects.playAudio("stamp");
    }

    this.updateUI();
    this.syncToCloud("✓ 已献上感恩之露，灵宠光芒凝聚！");
  }

  triggerSacrifice() {
    if (!confirm("确定要在本次争执或意见分歧中，主动选择退让与包容吗？\n爱情不是讲理的地方，而是舍己与接纳的地方。")) return;

    this.petData.glowEnergy = (this.petData.glowEnergy || 100) + 30;
    this.petData.sacrificeCount = (this.petData.sacrificeCount || 0) + 1;
    if (!this.petData.logs) this.petData.logs = [];

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    this.petData.logs.unshift({ type: "sacrifice", text: "选择在分歧中退让一步，因你比对错更重要。", date: dateStr });

    if (window.Effects) {
      window.Effects.fireConfetti();
      window.Effects.playAudio("gatekeeperPass");
    }

    this.updateUI();
    this.syncToCloud("🕊️ 结出宝贵的舍己之果，愿爱化解一切隔阂！");
  }

  updateUI() {
    const energyBadge = document.getElementById("grace-pet-level-badge");
    const statGlow = document.getElementById("stat-glow-energy");
    const statGrat = document.getElementById("stat-gratitude-count");
    const statSac = document.getElementById("stat-sacrifice-count");
    const container = document.getElementById("grace-log-container");

    if (energyBadge) energyBadge.textContent = `光芒值 ${this.petData.glowEnergy || 100}`;
    if (statGlow) statGlow.textContent = this.petData.glowEnergy || 100;
    if (statGrat) statGrat.textContent = this.petData.gratitudeCount || 0;
    if (statSac) statSac.textContent = this.petData.sacrificeCount || 0;

    if (container) {
      const logs = this.petData.logs || [];
      if (logs.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#64748b; font-size:11.5px; padding:12px;">暂无足迹，写下一句感恩开始喂养吧</div>`;
      } else {
        container.innerHTML = logs.slice(0, 10).map(item => `
          <div class="grace-log-item">
            <div>${item.type === 'sacrifice' ? '🍎 【舍己之果】' : '💧 【感恩之露】'} ${this.escape(item.text)}</div>
            <span>${item.date}</span>
          </div>
        `).join("");
      }
    }
  }

  async syncToCloud(successMsg) {
    if (!this.config) this.config = {};
    this.config.petData = this.petData;

    try {
      const token = localStorage.getItem("love_admin_token") || "";
      if (token) {
        await fetch("/api/love/config", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-auth": token },
          body: JSON.stringify({ config: this.config })
        });
      }
    } catch (_) {}

    if (typeof showToast === "function") {
      showToast(successMsg);
    } else {
      alert(successMsg);
    }
  }

  escape(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

window.GracePetManager = GracePetManager;
