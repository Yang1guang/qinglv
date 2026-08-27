/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/lifecycle.js
 * 作用: 情感生命周期引擎 (严格控制恋爱期、订婚期、结婚期选项边界)
 */

class LifecycleEngine {
  constructor(config) {
    this.config = config || {};
    this.currentPhase = this.config.lifecycle?.currentPhase || "dating"; // dating / engaged / married
  }

  init() {
    this.renderPhaseContent();
  }

  renderPhaseContent() {
    const lifecycleCfg = this.config.lifecycle || {};
    const phase = lifecycleCfg.currentPhase || "dating";
    this.currentPhase = phase;

    const titleEl = document.getElementById("checklist-section-title");
    const descEl = document.getElementById("checklist-section-desc");

    if (titleEl && descEl) {
      if (phase === "dating") {
        titleEl.textContent = "恋爱期 · 精神守望与克制清单";
        descEl.textContent = "在尊重与接纳中了解彼此，坚守圣洁与纯粹";
      } else if (phase === "engaged") {
        titleEl.textContent = "订婚期 · 契约预备与舍己清单";
        descEl.textContent = "为一生一世的盟约做准备，在磨合中学会妥协";
      } else if (phase === "married") {
        titleEl.textContent = "结婚期 · 生命交融与烟火气清单";
        descEl.textContent = "合为一体，同甘共苦，在长相厮守中包容彼此";
      }
    }
  }

  // 根据当前阶段获取对应的 100 件小事清单池
  getFilteredChecklist() {
    const allItems = this.config.checklist100 || [];
    // 阶段过滤规则：dating 仅展示 phase===1 的项目；engaged 展示 <=2；married 展示全部
    return allItems.filter(item => {
      const p = item.phase || 1;
      if (this.currentPhase === "dating") return p === 1;
      if (this.currentPhase === "engaged") return p <= 2;
      return true; // married
    });
  }

  // 根据当前阶段获取对应的特权刮刮乐卡片池
  getFilteredScratchCards() {
    const allCards = this.config.scratchCards || [];
    return allCards.filter(card => {
      const p = card.phase || 1;
      if (this.currentPhase === "dating") return p === 1;
      if (this.currentPhase === "engaged") return p <= 2;
      return true;
    });
  }
}

window.LifecycleEngine = LifecycleEngine;
