/**
 * ====================================================================
 * 太阳 ios-IP · 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: js/timeline.js
 * 作用: 恋爱同行计时器、3D 翻转拍立得相册 (含背面60秒专属语音条)、恋爱 100 件事清单引擎
 * ====================================================================
 */

class TimelineManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG;
    this.checklistStorageKey = "love_universe_checklist_state";
    this.currentPlayingAudio = null;
    this.currentActivePillEl = null;

    this.dom = {
      years: document.getElementById("timer-years"),
      days: document.getElementById("timer-days"),
      hours: document.getElementById("timer-hours"),
      minutes: document.getElementById("timer-minutes"),
      seconds: document.getElementById("timer-seconds"),
      milestoneDays: document.getElementById("milestone-days"),
      timelineFlow: document.getElementById("timeline-flow"),
      checklistContainer: document.getElementById("checklist-container"),
      checklistProgressFill: document.getElementById("checklist-progress-fill"),
      checklistStats: document.getElementById("checklist-stats"),
    };
  }

  /**
   * 初始化入口
   */
  init() {
    this.initLoveTimer();
    this.renderTimeline();
    this.initChecklist();
  }

  /**
   * 1. 恋爱同行计时器与纪念日倒计时
   */
  initLoveTimer() {
    const startDate = new Date(this.config.meta.startDate).getTime();
    const milestoneDate = new Date(this.config.meta.nextMilestoneDate).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = now - startDate;

      if (diff > 0) {
        // 计算精确的年、天、时、分、秒
        const totalSeconds = Math.floor(diff / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        const years = Math.floor(totalDays / 365);
        const remainingDays = totalDays % 365;
        const hours = totalHours % 24;
        const minutes = totalMinutes % 60;
        const seconds = totalSeconds % 60;

        if (this.dom.years) this.dom.years.textContent = years;
        if (this.dom.days) this.dom.days.textContent = String(remainingDays).padStart(3, "0");
        if (this.dom.hours) this.dom.hours.textContent = String(hours).padStart(2, "0");
        if (this.dom.minutes) this.dom.minutes.textContent = String(minutes).padStart(2, "0");
        if (this.dom.seconds) this.dom.seconds.textContent = String(seconds).padStart(2, "0");
      }

      // 下一个纪念日倒计时计算
      if (this.dom.milestoneDays && milestoneDate) {
        const milestoneDiff = milestoneDate - now;
        const daysLeft = Math.max(0, Math.ceil(milestoneDiff / (1000 * 60 * 60 * 24)));
        this.dom.milestoneDays.textContent = daysLeft;
      }
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  /**
   * 格式化秒数为 mm:ss
   */
  formatAudioTime(sec) {
    if (isNaN(sec) || sec <= 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  /**
   * 2. 动态渲染时光轴与 3D 拍立得翻转相册 (含背面语音胶囊)
   */
  renderTimeline() {
    const container = this.dom.timelineFlow;
    if (!container) return;

    const timelineData = this.config.timeline || [];
    container.innerHTML = "";

    timelineData.forEach((item, index) => {
      const nodeEl = document.createElement("article");
      nodeEl.className = "timeline-node";
      nodeEl.setAttribute("data-index", index);

      const nodeId = item.id || `node_${index}`;

      // 拍立得卡片骨架
      nodeEl.innerHTML = `
        <div class="timeline-node__dot"></div>
        <div class="timeline-node__time">${item.date}</div>
        <div class="polaroid-card" id="polaroid-${nodeId}">
          <div class="polaroid-card__inner">
            <!-- 正面: 照片与地点 -->
            <div class="polaroid-card__front">
              <div class="polaroid-card__photo-box">
                <img class="polaroid-card__img" src="${item.frontImg}" alt="${item.title}" loading="lazy" />
                <span class="polaroid-card__tag">${item.tag}</span>
              </div>
              <div class="polaroid-card__caption">
                <h3 class="polaroid-card__title">${item.title}</h3>
                <p class="polaroid-card__desc">${item.desc}</p>
                <div class="polaroid-card__meta">
                  <span class="polaroid-card__location">${item.location}</span>
                  <span class="polaroid-card__hint">👆 点击翻转</span>
                </div>
              </div>
            </div>

            <!-- 背面: 手写私语与 60 秒语音记录胶囊 -->
            <div class="polaroid-card__back">
              <div class="polaroid-card__back-content">
                <div class="polaroid-card__stamp">LOVE MEMORY</div>
                <h4 class="polaroid-card__back-title">💌 专属记忆</h4>
                <p class="polaroid-card__back-text">${item.backText}</p>
                ${
                  item.voiceAudio
                    ? `
                  <div class="polaroid-card__voice-box">
                    <div class="polaroid-voice-pill" id="voice-pill-${nodeId}" data-audio="${item.voiceAudio}">
                      <div class="polaroid-voice-icon">▶</div>
                      <div class="polaroid-voice-waves">
                        <span class="polaroid-wave-bar"></span>
                        <span class="polaroid-wave-bar"></span>
                        <span class="polaroid-wave-bar"></span>
                        <span class="polaroid-wave-bar"></span>
                        <span class="polaroid-wave-bar"></span>
                      </div>
                      <div class="polaroid-voice-info">
                        <span class="polaroid-voice-title">独家语音记忆</span>
                        <span class="polaroid-voice-duration" id="voice-dur-${nodeId}">点击聆听</span>
                      </div>
                    </div>
                  </div>`
                    : ""
                }
              </div>
              <div class="polaroid-card__back-footer">
                <span>${item.date}</span>
                <span>Tap to flip ↩</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // 绑定 3D 翻转交互 (物理隔离：点击语音胶囊时不翻转卡片)
      const cardInner = nodeEl.querySelector(".polaroid-card__inner");
      nodeEl.querySelector(".polaroid-card").addEventListener("click", (e) => {
        if (e.target.closest(".polaroid-voice-pill")) return;

        cardInner.classList.toggle("polaroid-card__inner--flipped");
        if (window.Effects) {
          window.Effects.playAudio("flip");
        }
      });

      // 绑定情话语音播放事件
      const voicePill = nodeEl.querySelector(".polaroid-voice-pill");
      if (voicePill) {
        voicePill.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleVoicePlayback(voicePill, item.voiceAudio, nodeId);
        });
      }

      container.appendChild(nodeEl);
    });
  }

  /**
   * 语音片段播放控制 (带声波律动、实时倒计时与互斥暂停)
   */
  handleVoicePlayback(pillEl, audioUrl, nodeId) {
    const iconEl = pillEl.querySelector(".polaroid-voice-icon");
    const durEl = pillEl.querySelector(".polaroid-voice-duration");

    // 1. 若当前点击的正是正在播放的音频，则执行暂停复位
    if (this.currentPlayingAudio && !this.currentPlayingAudio.paused && this.currentActivePillEl === pillEl) {
      this.currentPlayingAudio.pause();
      pillEl.classList.remove("playing");
      if (iconEl) iconEl.textContent = "▶";
      if (durEl) durEl.textContent = "已暂停";
      return;
    }

    // 2. 清理并复位其它正在播放的语音节点
    if (this.currentPlayingAudio) {
      this.currentPlayingAudio.pause();
      this.currentPlayingAudio = null;
    }
    document.querySelectorAll(".polaroid-voice-pill").forEach((pill) => {
      pill.classList.remove("playing");
      const ic = pill.querySelector(".polaroid-voice-icon");
      const dur = pill.querySelector(".polaroid-voice-duration");
      if (ic) ic.textContent = "▶";
      if (dur && dur.textContent.includes("正在播放")) dur.textContent = "点击聆听";
    });

    // 3. 实例化新音频流
    const audio = new Audio(audioUrl);
    this.currentPlayingAudio = audio;
    this.currentActivePillEl = pillEl;

    pillEl.classList.add("playing");
    if (iconEl) iconEl.textContent = "⏸";
    if (durEl) durEl.textContent = "缓冲中...";

    audio.addEventListener("timeupdate", () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const remaining = Math.max(0, audio.duration - audio.currentTime);
        if (durEl) durEl.textContent = `播放中 ${this.formatAudioTime(remaining)}`;
      }
    });

    audio.play().catch(() => {
      pillEl.classList.remove("playing");
      if (iconEl) iconEl.textContent = "▶";
      if (durEl) durEl.textContent = "播放失败";
    });

    audio.onended = () => {
      pillEl.classList.remove("playing");
      if (iconEl) iconEl.textContent = "▶";
      if (durEl) durEl.textContent = "重播记忆";
      this.currentPlayingAudio = null;
      this.currentActivePillEl = null;
    };
  }

  /**
   * 3. 恋爱 100 件小事清单管理
   */
  initChecklist() {
    const container = this.dom.checklistContainer;
    if (!container) return;

    const defaultList = this.config.checklist100 || [];
    let savedState = {};

    try {
      savedState = JSON.parse(localStorage.getItem(this.checklistStorageKey)) || {};
    } catch (_) {
      savedState = {};
    }

    container.innerHTML = "";

    defaultList.forEach((item) => {
      const isCompleted = savedState.hasOwnProperty(item.id) ? savedState[item.id] : item.completed;
      const itemEl = document.createElement("div");
      itemEl.className = `checklist-item ${isCompleted ? "checklist-item--checked" : ""}`;
      itemEl.setAttribute("data-id", item.id);

      itemEl.innerHTML = `
        <label class="checklist-item__label">
          <input type="checkbox" class="checklist-item__checkbox" ${isCompleted ? "checked" : ""} />
          <span class="checklist-item__custom-box"></span>
          <span class="checklist-item__text">${item.title}</span>
        </label>
      `;

      const checkbox = itemEl.querySelector(".checklist-item__checkbox");
      checkbox.addEventListener("change", (e) => {
        const checked = e.target.checked;
        savedState[item.id] = checked;
        localStorage.setItem(this.checklistStorageKey, JSON.stringify(savedState));

        itemEl.classList.toggle("checklist-item--checked", checked);
        this.updateChecklistProgress(defaultList, savedState);

        // 打勾瞬间触发全屏彩带特效与提示音
        if (checked && window.Effects) {
          window.Effects.fireConfetti();
          window.Effects.playAudio("stamp");
        }
      });

      container.appendChild(itemEl);
    });

    this.updateChecklistProgress(defaultList, savedState);
  }

  /**
   * 更新小事清单进度条与统计
   */
  updateChecklistProgress(defaultList, savedState) {
    const total = defaultList.length;
    let completedCount = 0;

    defaultList.forEach((item) => {
      const isCompleted = savedState.hasOwnProperty(item.id) ? savedState[item.id] : item.completed;
      if (isCompleted) completedCount++;
    });

    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    if (this.dom.checklistProgressFill) {
      this.dom.checklistProgressFill.style.width = `${percentage}%`;
    }
    if (this.dom.checklistStats) {
      this.dom.checklistStats.textContent = `已达成心愿 ${completedCount} / ${total} 项 (${percentage}%)`;
    }
  }
}

// 挂载至全局
window.TimelineManager = TimelineManager;
