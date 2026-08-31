/**
 * 众水不灭 · 雅歌之印 (Love Universe) 控制中心主控
 * 文件名: js/admin.js
 * 作用: 全模块可视化看板、倒数日与纪念日、破冰信号箱控制中心、三阶段文案实时绑定、R2 独立多媒体上传与全量云端持久化
 */

let currentConfig = null;
let currentAdminToken = "";
let currentDomainHost = "";

// 纯原生 RFC 3492 Punycode 逆向解码器 (实现中文域名如 张小阳李小光.love520.xyz 的无损还原展示)
function decodePunycodeHost(domainStr) {
  if (!domainStr || typeof domainStr !== "string") return domainStr || "";
  try {
    return domainStr.split(".").map(part => {
      if (!part.toLowerCase().startsWith("xn--")) return part;
      let input = part.slice(4);
      let output = [];
      let i = 0, n = 128, bias = 72;
      let basic = input.lastIndexOf("-");
      if (basic > 0) {
        for (let j = 0; j < basic; ++j) output.push(input.charCodeAt(j));
        input = input.slice(basic + 1);
      }
      while (input.length > 0) {
        let oldi = i, w = 1, k = 36;
        for (;; k += 36) {
          let c = input.charCodeAt(0);
          input = input.slice(1);
          let digit = c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : 36;
          i += digit * w;
          let t = k <= bias ? 1 : (k >= bias + 26 ? 26 : k - bias);
          if (digit < t) break;
          w *= 36 - t;
        }
        let outLen = output.length + 1;
        let delta = oldi === 0 ? Math.floor(i / 700) : Math.floor((i - oldi) / 2);
        delta += Math.floor(delta / outLen);
        let k2 = 0;
        while (delta > ((36 - 1) * 26) / 2) {
          delta = Math.floor(delta / (36 - 1));
          k2 += 36;
        }
        bias = Math.floor(k2 + ((36 - 1 + 1) * delta) / (delta + 38));
        n += Math.floor(i / outLen);
        i %= outLen;
        output.splice(i, 0, n);
        i++;
      }
      return String.fromCodePoint(...output);
    }).join(".");
  } catch (_) {
    return domainStr;
  }
}

// 获取认证 Token
function getAuthToken() {
  return (currentAdminToken || localStorage.getItem("love_admin_token") || "").trim();
}

// 弹出 Toast 提示
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// 统计播放列表中已上传的本地歌曲数量
function getLocalSongCount() {
  const list = currentConfig?.audio?.playlist || [];
  return list.filter(s => s && s.url && (s.url.startsWith("/raw/") || s.url.includes("/assets/"))).length;
}

// 智能解析文件名中的歌手与歌名
function parseSongFilename(filename) {
  const clean = filename.replace(/\.[^/.]+$/, "").trim();
  if (clean.includes(" - ")) {
    const parts = clean.split(" - ");
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  } else if (clean.includes("-")) {
    const parts = clean.split("-");
    return { artist: parts[0].trim(), title: parts.slice(1).join("-").trim() };
  } else if (clean.includes("_")) {
    const parts = clean.split("_");
    return { artist: parts[0].trim(), title: parts.slice(1).join("_").trim() };
  }
  return { artist: "本地上传", title: clean };
}

// 深度合并云端配置与本地默认基准 (含 anniversaries 与 icebreaker 严密防御合并)
function mergeWithDefaultConfig(cloudCfg) {
  const base = JSON.parse(JSON.stringify(window.LOVE_CONFIG || {}));
  if (!cloudCfg || typeof cloudCfg !== "object") return base;

  return {
    ...base,
    ...cloudCfg,
    meta: { ...(base.meta || {}), ...(cloudCfg.meta || {}) },
    gatekeeper: { ...(base.gatekeeper || {}), ...(cloudCfg.gatekeeper || {}) },
    letter: { ...(base.letter || {}), ...(cloudCfg.letter || {}) },
    audio: {
      playlist: [],
      ...(base.audio || {}),
      ...(cloudCfg.audio || {}),
      playlist: Array.isArray(cloudCfg.audio?.playlist) ? cloudCfg.audio.playlist : (base.audio?.playlist || [])
    },
    theme: { ...(base.theme || {}), ...(cloudCfg.theme || {}) },
    lifecycle: { ...(base.lifecycle || {}), ...(cloudCfg.lifecycle || {}) },
    anniversaries: (Array.isArray(cloudCfg.anniversaries) && cloudCfg.anniversaries.length > 0) ? cloudCfg.anniversaries : (base.anniversaries || []),
    icebreaker: {
      enabled: cloudCfg.icebreaker?.enabled !== false,
      cooldownMinutes: cloudCfg.icebreaker?.cooldownMinutes || base.icebreaker?.cooldownMinutes || 15,
      soundEnabled: cloudCfg.icebreaker?.soundEnabled !== false,
      actions: cloudCfg.icebreaker?.actions || base.icebreaker?.actions || {}
    },
    timeline: (Array.isArray(cloudCfg.timeline) && cloudCfg.timeline.length > 0) ? cloudCfg.timeline : (base.timeline || []),
    checklist100: (Array.isArray(cloudCfg.checklist100) && cloudCfg.checklist100.length > 0) ? cloudCfg.checklist100 : (base.checklist100 || []),
    scratchCards: (Array.isArray(cloudCfg.scratchCards) && cloudCfg.scratchCards.length > 0) ? cloudCfg.scratchCards : (base.scratchCards || []),
    easterEggs: (Array.isArray(cloudCfg.easterEggs) && cloudCfg.easterEggs.length > 0) ? cloudCfg.easterEggs : (base.easterEggs || []),
    _license: cloudCfg._license || base._license || null,
    adminSecurity: cloudCfg.adminSecurity || base.adminSecurity || null
  };
}

// 管理员登录校验
async function verifyAdminLogin() {
  const pwdInput = document.getElementById("adminPwdInput");
  const pwd = pwdInput ? pwdInput.value.trim() : "";
  const tokenToVerify = pwd || getAuthToken();

  if (!tokenToVerify) {
    alert("请输入管理员密码！");
    if (pwdInput) pwdInput.focus();
    return;
  }

  const success = await fetchConfigFromCloud(tokenToVerify);
  if (success) {
    currentAdminToken = tokenToVerify;
    localStorage.setItem("love_admin_token", tokenToVerify);
    const modal = document.getElementById("authModal");
    const layout = document.getElementById("adminLayout");
    if (modal) modal.style.display = "none";
    if (layout) layout.style.display = "block";
    showToast("✓ 验证成功，已连接独立云端存储");
  } else {
    localStorage.removeItem("love_admin_token");
    currentAdminToken = "";
    if (pwdInput) pwdInput.value = "";
    alert("❌ 口令错误或未授权！请输入当前站点设置的正确管理员密码");
  }
}

// 从云端拉取配置
async function fetchConfigFromCloud(tokenOverride) {
  const token = (tokenOverride || getAuthToken()).trim();
  if (!token) return false;

  try {
    const res = await fetch(`/api/love/config?auth=${encodeURIComponent(token)}`, {
      headers: { "x-admin-auth": token, "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return false;
    const data = await res.json();

    if (data.success && data.isAdmin) {
      currentDomainHost = data.domain || window.location.hostname;
      const displayDomain = decodePunycodeHost(currentDomainHost);
      const domainBadge = document.getElementById("adminDomainBadge");
      if (domainBadge) domainBadge.textContent = `我的网址: ${displayDomain}`;

      if (data.custom && data.config) {
        currentConfig = mergeWithDefaultConfig(data.config);
      } else {
        currentConfig = JSON.parse(JSON.stringify(window.LOVE_CONFIG || {}));
      }
      renderAllForms();
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

// 渲染全站所有表单
function renderAllForms() {
  if (!currentConfig) return;

  const sec = currentConfig.adminSecurity || {};
  document.getElementById("admin_customPassword").value = sec.password || "521";

  const lifecycle = currentConfig.lifecycle || {};
  document.getElementById("lifecycle_phase").value = lifecycle.currentPhase || "dating";

  const meta = currentConfig.meta || {};
  document.getElementById("meta_boyName").value = meta.boyName || "";
  document.getElementById("meta_girlName").value = meta.girlName || "";
  document.getElementById("meta_startDate").value = meta.startDate || "";
  document.getElementById("meta_nextMilestoneTitle").value = meta.nextMilestoneTitle || "";
  document.getElementById("meta_nextMilestoneDate").value = meta.nextMilestoneDate || "";
  document.getElementById("meta_siteTitle").value = meta.siteTitle || "";
  document.getElementById("meta_siteSubtitle").value = meta.siteSubtitle || "";

  const gate = currentConfig.gatekeeper || {};
  document.getElementById("gatekeeper_enabled").value = String(gate.enabled !== false);
  document.getElementById("gatekeeper_title").value = gate.title || "";
  document.getElementById("gatekeeper_question").value = gate.question || "";
  document.getElementById("gatekeeper_hint").value = gate.hint || "";
  document.getElementById("gatekeeper_correctAnswer").value = gate.correctAnswer || "";
  document.getElementById("gatekeeper_voiceVows").value = gate.voiceVows || "";
  document.getElementById("gatekeeper_errorTips").value = (gate.errorTips || []).join("\n");

  const letter = currentConfig.letter || {};
  document.getElementById("letter_title").value = letter.title || "";
  document.getElementById("letter_signDate").value = letter.signDate || "";
  document.getElementById("letter_signature").value = letter.signature || "";
  document.getElementById("letter_content").value = letter.content || "";

  renderTimelineList();
  renderAnniversariesList();
  renderIcebreakerSettings();
  renderChecklist();
  renderScratchCards();

  const audio = currentConfig.audio || {};
  document.getElementById("audio_bgmAutoPlay").value = String(audio.bgmAutoPlay !== false);
  document.getElementById("audio_playMode").value = audio.playMode || "list-loop";
  document.getElementById("audio_bgmTitle").value = audio.bgmTitle || "";
  document.getElementById("audio_bgmArtist").value = audio.bgmArtist || "";
  document.getElementById("audio_bgmUrl").value = audio.bgmUrl || "";
  document.getElementById("audio_vinylCover").value = audio.vinylCover || "";

  renderPlaylist();

  const eggs = currentConfig.easterEggs || [];
  document.getElementById("egg_1_message").value = eggs[0]?.message || "";
  document.getElementById("egg_2_message").value = eggs[1]?.message || "";

  renderThemeShowroom();
  renderLicenseStatus();
}

// 渲染授权状态
function renderLicenseStatus() {
  const badge = document.getElementById("licenseStatusBadge");
  if (!badge) return;
  const displayHost = decodePunycodeHost(currentConfig._license?.boundDomain || currentDomainHost);
  if (currentConfig._license && currentConfig._license.unlocked) {
    badge.innerHTML = `<span style="color:#34d399;">✨ 已永久激活【${currentConfig._license.tier || "全功能版本"}】 (绑定网址: ${displayHost})</span>`;
  } else {
    badge.innerHTML = `<span style="color:#f59e0b;">⏳ 基础免费版 (未输入专属激活码)</span>`;
  }
}

// 提交域名授权激活码
async function submitDomainLicense() {
  const codeInput = document.getElementById("inputLicenseCode");
  const code = codeInput ? codeInput.value.trim() : "";
  if (!code) return alert("请输入授权兑换码！");
  showToast("⏳ 正在验证...");
  try {
    const res = await fetch("/api/love/verify-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseCode: code, currentConfig })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🎉 ${data.message}`);
      await fetchConfigFromCloud();
    } else {
      alert(`❌ 激活失败: ${data.message}`);
    }
  } catch (err) {
    alert("❌ 请求异常: " + err.message);
  }
}

// ================= 5. 倒数日与恒久纪念日管理看板 =================

function renderAnniversariesList() {
  const container = document.getElementById("anniversariesListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!currentConfig.anniversaries) currentConfig.anniversaries = [];
  const list = currentConfig.anniversaries;

  if (list.length === 0) {
    container.innerHTML = `<div style="color:#94a3b8; font-size:12.5px; text-align:center; padding:18px;">🍃 暂无纪念日数据，可点击上方快捷模板一键添加，或点击【➕ 自定义新增】。</div>`;
    return;
  }

  list.forEach((item, idx) => {
    const isCountup = item.type === "countup";
    const isTarget = item.type === "target";
    const isCountdown = item.type === "countdown" || (!isCountup && !isTarget);
    const isLunar = Boolean(item.isLunar);
    const isLeap = Boolean(item.isLeapMonth);
    const isPinned = Boolean(item.pinToHero);

    let previewMetrics = "";
    if (window.AnniversaryEngine) {
      const m = window.AnniversaryEngine.calculateAnniversaryMetrics(item);
      if (m) {
        if (m.mode === "countup") {
          previewMetrics = `已同行守护 ${m.totalDays} 天 (${m.summaryText})`;
        } else if (m.isToday) {
          previewMetrics = `🎉 正是今天 · 岁岁常相伴`;
        } else {
          previewMetrics = `距离下一次还有 ${m.daysRemaining} 天 (${m.targetSolarDate})`;
        }
      }
    }

    const card = document.createElement("div");
    card.className = "item-card";
    card.style.border = isPinned ? "1.5px solid #f59e0b" : "1px solid var(--border-card)";
    card.style.boxShadow = isPinned ? "0 0 16px rgba(245, 158, 11, 0.25)" : "none";

    card.innerHTML = `
      <div class="item-card-header" style="flex-wrap:wrap; gap:8px;">
        <span class="item-card-title">
          ${escapeHtml(item.icon || "💖")} #${idx + 1} - ${escapeHtml(item.title || "未命名纪念日")}
          ${isPinned ? '<span style="font-size:10.5px; background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; padding:2px 8px; border-radius:10px; margin-left:6px; font-weight:800;">👑 首页主打倒数</span>' : ''}
          ${previewMetrics ? `<span style="font-size:11px; color:#7dd3fc; margin-left:8px; font-weight:700;">[ ${previewMetrics} ]</span>` : ''}
        </span>
        <div style="display:flex; gap:6px;">
          <button class="btn-tool" style="padding:3px 8px; font-size:11px; ${isPinned ? 'background:#f59e0b; color:#fff;' : ''}" onclick="togglePinAnniversaryToHero(${idx})" title="设为首页顶部主打倒数">${isPinned ? '★ 已主打' : '☆ 设为主打'}</button>
          <button class="btn-tool" style="padding:3px 8px; font-size:11px;" onclick="moveAnniversaryItem(${idx}, -1)" ${idx === 0 ? "disabled" : ""}>⬆️</button>
          <button class="btn-tool" style="padding:3px 8px; font-size:11px;" onclick="moveAnniversaryItem(${idx}, 1)" ${idx === list.length - 1 ? "disabled" : ""}>⬇️</button>
          <button class="btn-del" style="padding:3px 8px; font-size:11px;" onclick="deleteAnniversaryItem(${idx})">🗑️ 删除</button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>纪念日名称</label><input type="text" class="admin-input" id="anni_title_${idx}" value="${escapeHtml(item.title || "")}" oninput="currentConfig.anniversaries[${idx}].title=this.value"></div>
        <div class="form-group"><label>图标 Emoji</label><input type="text" class="admin-input" id="anni_icon_${idx}" value="${escapeHtml(item.icon || "💖")}" oninput="currentConfig.anniversaries[${idx}].icon=this.value"></div>
        <div class="form-group"><label>分类阶段标签 (如: 专属诞辰 / 恋爱起点)</label><input type="text" class="admin-input" id="anni_tag_${idx}" value="${escapeHtml(item.tag || "")}" oninput="currentConfig.anniversaries[${idx}].tag=this.value"></div>
        
        <div class="form-group">
          <label>度量模式</label>
          <select class="admin-select" id="anni_type_${idx}" onchange="currentConfig.anniversaries[${idx}].type=this.value; renderAnniversariesList();">
            <option value="countdown" ${isCountdown ? 'selected' : ''}>🔁 每年重复倒数 (生日 / 周年纪念)</option>
            <option value="countup" ${isCountup ? 'selected' : ''}>⏳ 累积同行天数 (恋爱确认 / 领证结婚)</option>
            <option value="target" ${isTarget ? 'selected' : ''}>🎯 未来单次目标 (求婚 / 婚礼预定)</option>
          </select>
        </div>

        <div class="form-group">
          <label>历法系统</label>
          <select class="admin-select" id="anni_islunar_${idx}" onchange="currentConfig.anniversaries[${idx}].isLunar=(this.value==='true'); renderAnniversariesList();">
            <option value="false" ${!isLunar ? 'selected' : ''}>☀️ 公历 (阳历)</option>
            <option value="true" ${isLunar ? 'selected' : ''}>🌙 农历 (阴历)</option>
          </select>
        </div>

        <div class="form-group" style="${isLunar ? '' : 'display:none;'}">
          <label>农历闰月属性</label>
          <select class="admin-select" id="anni_isleap_${idx}" onchange="currentConfig.anniversaries[${idx}].isLeapMonth=(this.value==='true'); renderAnniversariesList();">
            <option value="false" ${!isLeap ? 'selected' : ''}>平月 (正常月份)</option>
            <option value="true" ${isLeap ? 'selected' : ''}>闰月 (如闰四月)</option>
          </select>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>设定日期 (格式: YYYY-MM-DD${isLunar ? '，例如 1998-04-15 代表农历四月十五' : ''})</label>
          <input type="text" class="admin-input" id="anni_date_${idx}" value="${escapeHtml(item.date || "")}" placeholder="例如: 2024-05-20" oninput="currentConfig.anniversaries[${idx}].date=this.value">
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>专属情书寄语 (Love Memo · 展卷动画呈现)</label>
          <textarea class="admin-textarea" rows="2" id="anni_memo_${idx}" placeholder="写下一句专属私密寄语..." oninput="currentConfig.anniversaries[${idx}].memo=this.value">${escapeHtml(item.memo || "")}</textarea>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>专属回忆照片 (长按卡片暗纹浮现与拍立得海报呈现)</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="anni_bg_${idx}" value="${escapeHtml(item.bgImg || "")}" placeholder="输入图片直链或点击右侧上传..." oninput="currentConfig.anniversaries[${idx}].bgImg=this.value">
            <button class="btn-upload" onclick="triggerDirectUpload('anni_bg_${idx}', 'image/*', (url)=>{ currentConfig.anniversaries[${idx}].bgImg=url; })">🖼️ 上传照片</button>
          </div>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label style="color:#fbcfe8; font-weight:800;">🎙️ 专属 10 秒声纹录音直链 (微播放胶囊呈现)</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="anni_voice_${idx}" value="${escapeHtml(item.voiceAudio || "")}" placeholder="输入音频直链或点击右侧上传 MP3 录音..." oninput="currentConfig.anniversaries[${idx}].voiceAudio=this.value">
            <button class="btn-upload" style="background:linear-gradient(135deg, #f43f5e 0%, #be123c 100%); color:#fff; border-color:rgba(255,255,255,0.3);" onclick="triggerDirectUpload('anni_voice_${idx}', 'audio/*', (url)=>{ currentConfig.anniversaries[${idx}].voiceAudio=url; })">🎙️ 上传录音</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addCustomAnniversaryItem() {
  if (!currentConfig.anniversaries) currentConfig.anniversaries = [];
  currentConfig.anniversaries.push({
    id: "anni_" + Date.now(),
    title: "新美好纪念日",
    type: "countdown",
    isLunar: false,
    isLeapMonth: false,
    date: "2026-05-20",
    annualRepeat: true,
    icon: "💖",
    tag: "专属印记",
    memo: "在时光的长河里，每一刻都值得铭记。",
    bgImg: "",
    voiceAudio: "",
    pinToHero: false
  });
  renderAnniversariesList();
  showToast("✓ 已添加自定义纪念日");
}

function addPresetAnniversaryTemplate(templateKey) {
  if (!currentConfig.anniversaries) currentConfig.anniversaries = [];
  const templates = {
    birthday_girl: {
      title: "她的农历生日",
      type: "countdown",
      isLunar: true,
      isLeapMonth: false,
      date: "1998-04-15",
      annualRepeat: true,
      icon: "🎂",
      tag: "专属诞辰",
      memo: "愿你一生被爱，眼里常有星辰大海，笑里全是不染尘埃的纯真。",
      bgImg: "assets/images/photo_02.jpg",
      voiceAudio: "",
      pinToHero: false
    },
    birthday_boy: {
      title: "他的公历生日",
      type: "countdown",
      isLunar: false,
      isLeapMonth: false,
      date: "1996-10-24",
      annualRepeat: true,
      icon: "🪐",
      tag: "先生生辰",
      memo: "感谢你的坚毅与温柔，做我们小家庭永远遮风挡雨的港湾。",
      bgImg: "",
      voiceAudio: "",
      pinToHero: false
    },
    love_start: {
      title: "初次牵手 · 恋爱起点",
      type: "countup",
      isLunar: false,
      isLeapMonth: false,
      date: "2024-05-20",
      annualRepeat: false,
      icon: "💖",
      tag: "恋爱起点",
      memo: "那一天的晚风很温柔，牵起你手的那一刻，我知道余生有了归宿。",
      bgImg: "assets/images/photo_01.jpg",
      voiceAudio: "",
      pinToHero: true
    },
    engaged: {
      title: "神圣订婚盟约之日",
      type: "countup",
      isLunar: false,
      isLeapMonth: false,
      date: "2025-05-20",
      annualRepeat: false,
      icon: "💍",
      tag: "盟约确立",
      memo: "愿得一人心，白首不相离。在爱中彼此坚固。",
      bgImg: "assets/images/photo_03.jpg",
      voiceAudio: "",
      pinToHero: false
    },
    married: {
      title: "领证结婚 · 合为一体",
      type: "countup",
      isLunar: false,
      isLeapMonth: false,
      date: "2026-10-01",
      annualRepeat: false,
      icon: "🏠",
      tag: "神圣婚典",
      memo: "在上帝与众人见证下，缔结一生一世不可分开的神圣盟约。",
      bgImg: "assets/images/photo_03.jpg",
      voiceAudio: "",
      pinToHero: false
    },
    travel: {
      title: "海边日落旅行之约",
      type: "target",
      isLunar: false,
      isLeapMonth: false,
      date: "2026-12-25",
      annualRepeat: false,
      icon: "✈️",
      tag: "浪漫之约",
      memo: "一起去向往的远方，看最美的海浪与星辰。",
      bgImg: "assets/images/photo_02.jpg",
      voiceAudio: "",
      pinToHero: false
    }
  };

  const chosen = templates[templateKey];
  if (!chosen) return;

  currentConfig.anniversaries.push({
    id: "anni_" + Date.now(),
    ...chosen
  });

  renderAnniversariesList();
  showToast(`✓ 已成功添加【${chosen.title}】模板！`);
}

function togglePinAnniversaryToHero(idx) {
  if (!currentConfig.anniversaries) return;
  const targetState = !currentConfig.anniversaries[idx].pinToHero;
  currentConfig.anniversaries.forEach((item, i) => {
    item.pinToHero = (i === idx) ? targetState : false;
  });
  renderAnniversariesList();
  showToast(targetState ? `✓ 已将 #${idx + 1} 设为首页主打倒数` : "✓ 已取消首页主打倒数");
}

function deleteAnniversaryItem(idx) {
  if (confirm("确定删除该纪念日事件吗？")) {
    currentConfig.anniversaries.splice(idx, 1);
    renderAnniversariesList();
  }
}

function moveAnniversaryItem(idx, direction) {
  const targetIdx = idx + direction;
  const list = currentConfig.anniversaries;
  if (targetIdx < 0 || targetIdx >= list.length) return;
  const temp = list[idx];
  list[idx] = list[targetIdx];
  list[targetIdx] = temp;
  renderAnniversariesList();
}

// ================= 🌟 6. 破冰与情感信号箱控制中心 (Batch 4 新增) =================

function renderIcebreakerSettings() {
  if (!currentConfig) return;
  const ib = currentConfig.icebreaker || {};
  const enabledSelect = document.getElementById("icebreaker_enabled");
  const cooldownInput = document.getElementById("icebreaker_cooldownMinutes");
  const cooldownValText = document.getElementById("icebreaker_cooldown_val");
  const soundSelect = document.getElementById("icebreaker_soundEnabled");

  if (enabledSelect) enabledSelect.value = String(ib.enabled !== false);
  if (cooldownInput) {
    cooldownInput.value = ib.cooldownMinutes || 15;
    if (cooldownValText) cooldownValText.textContent = `${ib.cooldownMinutes || 15} 分钟`;
  }
  if (soundSelect) soundSelect.value = String(ib.soundEnabled !== false);

  const container = document.getElementById("icebreakerActionsContainer");
  if (!container) return;

  const stages = [
    { key: "dating", name: "🌿 恋爱期 (坚守圣洁界限 · 严禁同居与室内私密行为引导)", color: "#38bdf8" },
    { key: "engaged", name: "💍 订婚期 (盟约预备 · 化解现实筹备焦虑)", color: "#f59e0b" },
    { key: "married", name: "🏠 结婚期 (合为一体 · 实体避风港 · 不可含怒到日落)", color: "#f43f5e" }
  ];

  const actionsData = ib.actions || window.LOVE_CONFIG?.icebreaker?.actions || {};

  container.innerHTML = stages.map(st => {
    const list = actionsData[st.key] || [];
    return `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; margin-bottom:14px;">
        <div style="font-size:14px; font-weight:900; color:${st.color}; margin-bottom:12px;">${st.name}</div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${list.map((act, actIdx) => `
            <div style="background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:12px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="font-size:18px;">${act.icon || "💖"}</span>
                <span style="font-size:13px; font-weight:800; color:#fff;">${escapeHtml(act.label || "动作名称")}</span>
                <span style="font-size:11px; color:#94a3b8; margin-left:auto;">[类型: ${act.type}]</span>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:11px;">自定义温情提示与和解台阶文案</label>
                <textarea class="admin-textarea" rows="2" id="ib_${st.key}_${act.type}_desc" oninput="updateIcebreakerActionText('${st.key}', '${act.type}', this.value)">${escapeHtml(act.desc || "")}</textarea>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function updateIcebreakerActionText(stageKey, actionType, val) {
  if (!currentConfig.icebreaker) currentConfig.icebreaker = {};
  if (!currentConfig.icebreaker.actions) currentConfig.icebreaker.actions = {};
  if (!Array.isArray(currentConfig.icebreaker.actions[stageKey])) {
    const baseActions = window.LOVE_CONFIG?.icebreaker?.actions?.[stageKey] || [];
    currentConfig.icebreaker.actions[stageKey] = JSON.parse(JSON.stringify(baseActions));
  }
  const target = currentConfig.icebreaker.actions[stageKey].find(a => a.type === actionType);
  if (target) {
    target.desc = val;
  }
}

async function clearIcebreakerHistory() {
  if (!confirm("⚠️ 确定要清空历史和好足迹与当前未决信号吗？此操作不可撤销。")) return;
  showToast("⏳ 正在重置...");
  try {
    const token = getAuthToken();
    const res = await fetch("/api/love/signal/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-auth": token, "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      alert("✨ 已成功清空历史信号与和好足迹！");
    } else {
      alert("❌ 操作失败: " + (data.error || "服务端异常"));
    }
  } catch (err) {
    alert("❌ 请求异常: " + err.message);
  }
}

// 热门标签点击快捷搜索
function quickSearchTag(tagText) {
  document.getElementById("musicSearchKeyword").value = tagText;
  executeOnlineMusicSearch();
}

// 执行在线音乐检索
async function executeOnlineMusicSearch() {
  const kw = document.getElementById("musicSearchKeyword").value.trim();
  const listContainer = document.getElementById("onlineSearchResultList");
  if (!kw) return alert("请输入要搜索的歌名或歌手！");

  listContainer.innerHTML = `<div style="color:#fde68a; font-size:12px; padding:10px; text-align:center;">⏳ 正在检索全网高保真音频流...</div>`;

  try {
    const res = await fetch(`/api/love/music-search?keyword=${encodeURIComponent(kw)}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.songs) && data.songs.length > 0) {
      listContainer.innerHTML = data.songs.map((song, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.06); padding:10px 14px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
          <div style="flex:1; overflow:hidden; margin-right:10px;">
            <div style="font-size:13.5px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(song.title)}</div>
            <div style="font-size:11.5px; color:#94a3b8;">${escapeHtml(song.artist)}</div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button class="btn-tool preview-play-btn" id="prev_btn_${idx}" style="padding:5px 10px; font-size:11.5px;" onclick="testPreviewAudio('${song.url}', 'prev_btn_${idx}', '${escapeHtml(song.title)}')">🎧 试听</button>
            <button class="btn-tool" style="background:rgba(56, 189, 248, 0.2); color:#7dd3fc; border-color:rgba(56,189,248,0.35); padding:5px 10px; font-size:11.5px;" onclick="addSongToPlaylist('${escapeHtml(song.title)}', '${escapeHtml(song.artist)}', '${song.url}', '')">➕ 加歌单</button>
            <button class="btn-tool" style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color:#fff; padding:5px 10px; font-size:11.5px;" onclick="setAsSingleBGM('${escapeHtml(song.title)}', '${escapeHtml(song.artist)}', '${song.url}')">👑 设为主打</button>
          </div>
        </div>
      `).join("");
    } else {
      listContainer.innerHTML = `<div style="color:#fca5a5; font-size:12px; padding:10px; text-align:center;">🍃 未找到可用音频，建议点击下方【上传MP3】直接上传歌曲文件</div>`;
    }
  } catch (_) {
    listContainer.innerHTML = `<div style="color:#fca5a5; font-size:12px; padding:10px; text-align:center;">❌ 检索超时，请检查网络</div>`;
  }
}

// 设为主打背景音乐
function setAsSingleBGM(title, artist, url) {
  document.getElementById("audio_bgmTitle").value = title;
  document.getElementById("audio_bgmArtist").value = artist;
  document.getElementById("audio_bgmUrl").value = url;
  
  if (!currentConfig.audio) currentConfig.audio = {};
  if (!Array.isArray(currentConfig.audio.playlist)) currentConfig.audio.playlist = [];
  
  const exists = currentConfig.audio.playlist.some(s => s.url === url);
  if (!exists && currentConfig.audio.playlist.length < 30) {
    currentConfig.audio.playlist.unshift({ id: "song_" + Date.now(), title, artist, url, cover: "" });
    renderPlaylist();
  }
  showToast(`✓ 已将《${title}》设为主打歌，请点击右上角【💾 立即发布生效】！`);
}

// 添加搜索歌曲至播放列表
function addSongToPlaylist(title, artist, url, cover) {
  if (!currentConfig.audio) currentConfig.audio = {};
  if (!Array.isArray(currentConfig.audio.playlist)) currentConfig.audio.playlist = [];

  if (currentConfig.audio.playlist.length >= 30) {
    return alert("⚠️ 播放列表最多可添加 30 首音乐，请删除部分曲目后再添加！");
  }

  currentConfig.audio.playlist.push({
    id: "song_" + Date.now(),
    title: title || "新添加曲目",
    artist: artist || "精选歌手",
    url: url || "",
    cover: cover || ""
  });

  renderPlaylist();
  showToast(`✓ 已将《${title}》加入播放列表 (${currentConfig.audio.playlist.length}/30)`);
}

// 渲染播放列表管理卡片
function renderPlaylist() {
  const container = document.getElementById("playlistContainer");
  const countBadge = document.getElementById("playlistCountBadge");
  if (!container) return;
  container.innerHTML = "";

  const list = currentConfig?.audio?.playlist || [];
  const localCount = getLocalSongCount();

  if (countBadge) {
    countBadge.textContent = `(${list.length} / 30 首 · 本地已传 ${localCount} / 5)`;
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="color:#94a3b8; font-size:12.5px; text-align:center; padding:18px;">🍃 暂无列表曲目，可在上方搜索歌曲一键【➕ 加歌单】或点击上方【📤 传本地MP3】。</div>`;
    return;
  }

  list.forEach((song, idx) => {
    const isLocal = song.url && (song.url.startsWith("/raw/") || song.url.includes("/assets/"));
    const card = document.createElement("div");
    card.className = "item-card";
    card.style.marginBottom = "10px";
    card.innerHTML = `
      <div class="item-card-header">
        <span class="item-card-title">
          🎵 #${idx + 1} - ${escapeHtml(song.title || "未命名曲目")}
          ${isLocal ? '<span style="font-size:10px; background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 6px; border-radius:8px; margin-left:6px;">本地文件</span>' : ''}
        </span>
        <div style="display:flex; gap:6px;">
          <button class="btn-tool preview-play-btn" id="pl_prev_${idx}" style="padding:3px 8px; font-size:11px;" onclick="testPreviewAudio('${song.url}', 'pl_prev_${idx}', '${escapeHtml(song.title)}')">🎧 试听</button>
          <button class="btn-tool" style="padding:3px 8px; font-size:11px;" onclick="movePlaylistSong(${idx}, -1)" ${idx === 0 ? "disabled" : ""}>⬆️</button>
          <button class="btn-tool" style="padding:3px 8px; font-size:11px;" onclick="movePlaylistSong(${idx}, 1)" ${idx === list.length - 1 ? "disabled" : ""}>⬇️</button>
          <button class="btn-del" style="padding:3px 8px; font-size:11px;" onclick="deletePlaylistSong(${idx})">🗑️</button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>歌名</label><input type="text" class="admin-input" id="pl_title_${idx}" value="${escapeHtml(song.title || "")}" oninput="currentConfig.audio.playlist[${idx}].title=this.value"></div>
        <div class="form-group"><label>歌手</label><input type="text" class="admin-input" id="pl_artist_${idx}" value="${escapeHtml(song.artist || "")}" oninput="currentConfig.audio.playlist[${idx}].artist=this.value"></div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label>音频直链地址</label>
          <div class="upload-input-group">
            <input type="text" id="pl_url_${idx}" value="${escapeHtml(song.url || "")}" oninput="currentConfig.audio.playlist[${idx}].url=this.value">
            <button class="btn-upload" onclick="triggerDirectUploadSongItem(${idx})">📤 上传MP3</button>
          </div>
        </div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label>专属黑胶中心封面 (可选)</label>
          <div class="upload-input-group">
            <input type="text" id="pl_cover_${idx}" value="${escapeHtml(song.cover || "")}" oninput="currentConfig.audio.playlist[${idx}].cover=this.value">
            <button class="btn-upload" onclick="triggerDirectUpload('pl_cover_${idx}', 'image/*', (url)=>{ currentConfig.audio.playlist[${idx}].cover=url; })">🖼️ 上传封面</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// 手动添加一条空白曲目
function addCustomPlaylistItem() {
  if (!currentConfig.audio) currentConfig.audio = {};
  if (!Array.isArray(currentConfig.audio.playlist)) currentConfig.audio.playlist = [];

  if (currentConfig.audio.playlist.length >= 30) {
    return alert("⚠️ 播放列表最多可添加 30 首音乐！");
  }

  currentConfig.audio.playlist.push({
    id: "song_" + Date.now(),
    title: "自定义新音乐",
    artist: "歌手",
    url: "",
    cover: ""
  });
  renderPlaylist();
}

// 快捷上传本地 MP3 并直接加入播放列表
function triggerDirectUploadLocalSong() {
  if (!currentConfig.audio) currentConfig.audio = {};
  if (!Array.isArray(currentConfig.audio.playlist)) currentConfig.audio.playlist = [];

  if (currentConfig.audio.playlist.length >= 30) {
    return alert("⚠️ 播放列表最多可容纳 30 首音乐！请先删除部分歌曲。");
  }

  const localCount = getLocalSongCount();
  if (localCount >= 5) {
    return alert(`⚠️ 存储空间保护机制生效：\n每个站点最多支持上传 5 首本地专属 MP3 音频（当前已上传 ${localCount} 首）。\n\n💡 建议方案：\n请使用上方【🔍 在线搜索云端音乐】功能，支持全网数百万首歌曲无损直连，0 占用本地存储！`);
  }

  triggerDirectUpload(null, "audio/*", (url, file) => {
    const meta = parseSongFilename(file.name);
    currentConfig.audio.playlist.push({
      id: "song_" + Date.now(),
      title: meta.title,
      artist: meta.artist,
      url: url,
      cover: ""
    });
    renderPlaylist();
    showToast(`✓ 已成功上传《${meta.title}》并加入播放列表！`);
  });
}

// 单个曲目卡片内部上传替换 MP3
function triggerDirectUploadSongItem(idx) {
  const currentUrl = currentConfig.audio.playlist[idx]?.url || "";
  const isAlreadyLocal = currentUrl.startsWith("/raw/") || currentUrl.includes("/assets/");
  
  if (!isAlreadyLocal && getLocalSongCount() >= 5) {
    return alert(`⚠️ 存储空间保护机制生效：\n每个站点最多支持上传 5 首本地专属 MP3 音频。\n请使用在线搜索，或将已有本地歌曲替换！`);
  }

  triggerDirectUpload(`pl_url_${idx}`, "audio/*", (url, file) => {
    currentConfig.audio.playlist[idx].url = url;
    const titleInput = document.getElementById(`pl_title_${idx}`);
    const artistInput = document.getElementById(`pl_artist_${idx}`);
    
    if (titleInput && (!titleInput.value || titleInput.value === "自定义新音乐")) {
      const meta = parseSongFilename(file.name);
      titleInput.value = meta.title;
      currentConfig.audio.playlist[idx].title = meta.title;
      if (artistInput && (!artistInput.value || artistInput.value === "歌手")) {
        artistInput.value = meta.artist;
        currentConfig.audio.playlist[idx].artist = meta.artist;
      }
    }
    renderPlaylist();
  });
}

// 单曲模式默认 BGM 上传
function triggerDirectUploadSingleBgm() {
  triggerDirectUpload("audio_bgmUrl", "audio/*", (url, file) => {
    const meta = parseSongFilename(file.name);
    const titleInput = document.getElementById("audio_bgmTitle");
    const artistInput = document.getElementById("audio_bgmArtist");
    if (titleInput) titleInput.value = meta.title;
    if (artistInput) artistInput.value = meta.artist;
    showToast(`✓ 主打歌音频已上传，自动解析为《${meta.title}》`);
  });
}

// 一键清除自定义壁纸，恢复系统自带主题渐变
function clearCustomBg(gender) {
  if (!currentConfig) return;
  if (!currentConfig.theme) currentConfig.theme = {};

  if (gender === 'boy') {
    const input = document.getElementById("theme_customBgUrlBoy");
    if (input) input.value = "";
    currentConfig.theme.customBgUrlBoy = "";
    currentConfig.theme.customBgUrl = "";
    showToast("✓ 已清除男生视角自定义壁纸，恢复自带主题！");
  } else if (gender === 'girl') {
    const input = document.getElementById("theme_customBgUrlGirl");
    if (input) input.value = "";
    currentConfig.theme.customBgUrlGirl = "";
    showToast("✓ 已清除女生视角自定义壁纸，恢复自带主题！");
  }
}

// 删除播放列表歌曲
function deletePlaylistSong(idx) {
  if (confirm("确定从播放列表中移除该歌曲吗？")) {
    currentConfig.audio.playlist.splice(idx, 1);
    renderPlaylist();
  }
}

// 移动排序
function movePlaylistSong(idx, direction) {
  const targetIdx = idx + direction;
  const list = currentConfig.audio.playlist;
  if (targetIdx < 0 || targetIdx >= list.length) return;
  const temp = list[idx];
  list[idx] = list[targetIdx];
  list[targetIdx] = temp;
  renderPlaylist();
}

// 试听控制器
let previewAudioObj = null;
let currentPreviewBtnId = null;

function testPreviewAudio(url, btnId, songTitle) {
  const currentBtn = document.getElementById(btnId);

  if (previewAudioObj && currentPreviewBtnId === btnId && !previewAudioObj.paused) {
    previewAudioObj.pause();
    if (currentBtn) currentBtn.textContent = "🎧 试听";
    showToast("⏸️ 已暂停试听");
    return;
  }

  document.querySelectorAll(".preview-play-btn").forEach(b => b.textContent = "🎧 试听");

  if (previewAudioObj) {
    previewAudioObj.pause();
    previewAudioObj = null;
  }

  currentPreviewBtnId = btnId;
  if (currentBtn) currentBtn.textContent = "⏳ 缓冲中";

  previewAudioObj = new Audio(url);

  previewAudioObj.play().then(() => {
    if (currentBtn) currentBtn.textContent = "⏸️ 暂停";
    showToast(`🎵 正在试听: ${songTitle || "选定曲目"}`);
  }).catch(() => {
    if (currentBtn) currentBtn.textContent = "🎧 试听";
    alert(`⚠️ 《${songTitle || "该歌曲"}》因平台 VIP 版权风控无法在线解析。\n\n💡 完美解决方案：\n请使用下方【📤 传本地MP3】按钮，直接上传您本地下载好的原版 MP3 文件，100% 永久稳定可播！`);
  });

  previewAudioObj.onended = () => {
    if (currentBtn) currentBtn.textContent = "🎧 试听";
  };
}

// 渲染主题陈列室
function renderThemeShowroom() {
  const boyBox = document.getElementById("boyThemesContainer");
  const girlBox = document.getElementById("girlThemesContainer");
  const presets = window.THEME_PRESETS || { boy: [], girl: [] };

  const curBoy = currentConfig.theme?.currentThemeBoy || currentConfig.theme?.currentTheme || "sunset-twilight";
  const curGirl = currentConfig.theme?.currentThemeGirl || "french-cream";

  if (boyBox) {
    boyBox.innerHTML = presets.boy.map(item => {
      const isSel = item.id === curBoy;
      return `
        <div class="theme-card ${isSel ? 'theme-card--selected' : ''}" onclick="selectBoyTheme('${item.id}')"
          style="background: ${isSel ? 'rgba(56, 189, 248, 0.22)' : 'rgba(3, 7, 18, 0.6)'}; border: 1.5px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.1)'}; box-shadow: ${isSel ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none'}; border-radius: 14px; padding: 14px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:14px; font-weight:900; color:#fff;">${item.name}</span><span style="font-size:10px; font-weight:800; background:rgba(255,255,255,0.1); color:#7dd3fc; padding:2px 6px; border-radius:10px;">${item.tag}</span>
            </div>
            <p style="font-size:11.5px; color:#94a3b8; line-height:1.4; margin-bottom:10px;">${item.desc}</p>
          </div>
          <div style="font-size:11.5px; font-weight:800; color:${isSel ? '#38bdf8' : '#64748b'}; text-align:right;">${isSel ? '✓ 当前选定' : '点击选定'}</div>
        </div>
      `;
    }).join("");
  }

  if (girlBox) {
    girlBox.innerHTML = presets.girl.map(item => {
      const isSel = item.id === curGirl;
      return `
        <div class="theme-card ${isSel ? 'theme-card--selected' : ''}" onclick="selectGirlTheme('${item.id}')"
          style="background: ${isSel ? 'rgba(244, 114, 182, 0.22)' : 'rgba(3, 7, 18, 0.6)'}; border: 1.5px solid ${isSel ? '#f472b6' : 'rgba(255,255,255,0.1)'}; box-shadow: ${isSel ? '0 0 16px rgba(244, 114, 182, 0.35)' : 'none'}; border-radius: 14px; padding: 14px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:14px; font-weight:900; color:#fff;">${item.name}</span><span style="font-size:10px; font-weight:800; background:rgba(255,255,255,0.1); color:#fbcfe8; padding:2px 6px; border-radius:10px;">${item.tag}</span>
            </div>
            <p style="font-size:11.5px; color:#94a3b8; line-height:1.4; margin-bottom:10px;">${item.desc}</p>
          </div>
          <div style="font-size:11.5px; font-weight:800; color:${isSel ? '#f472b6' : '#64748b'}; text-align:right;">${isSel ? '✓ 当前选定' : '点击选定'}</div>
        </div>
      `;
    }).join("");
  }

  if (document.getElementById("theme_customBgUrlBoy")) document.getElementById("theme_customBgUrlBoy").value = currentConfig.theme?.customBgUrlBoy || currentConfig.theme?.customBgUrl || "";
  if (document.getElementById("theme_customBgUrlGirl")) document.getElementById("theme_customBgUrlGirl").value = currentConfig.theme?.customBgUrlGirl || "";
}

function selectBoyTheme(themeId) { if (!currentConfig.theme) currentConfig.theme = {}; currentConfig.theme.currentThemeBoy = themeId; currentConfig.theme.currentTheme = themeId; renderThemeShowroom(); showToast(`✓ 已选定男生视角主题【${themeId}】`); }
function selectGirlTheme(themeId) { if (!currentConfig.theme) currentConfig.theme = {}; currentConfig.theme.currentThemeGirl = themeId; renderThemeShowroom(); showToast(`✓ 已选定女生视角主题【${themeId}】`); }

// 清理 R2 孤立文件
async function cleanOrphanR2Cache() {
  if (!confirm("⚠️ 确定要清理孤立文件吗？")) return;
  showToast("⏳ 扫描清理中...");
  try {
    const res = await fetch(`/api/love/cleanup?auth=${encodeURIComponent(getAuthToken())}`, { method: "POST", headers: { "x-admin-auth": getAuthToken() }});
    const data = await res.json();
    if (data.success) alert(`✨ ${data.message}`); else alert("❌ 清理失败: " + (data.error || "接口异常"));
  } catch (err) { alert("❌ 请求异常: " + err.message); }
}

// 时光轴渲染
function renderTimelineList() {
  const container = document.getElementById("timelineListContainer");
  if (!container) return;
  container.innerHTML = "";
  (currentConfig.timeline || []).forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header"><span class="item-card-title">节点 #${idx + 1} - ${escapeHtml(item.title || "未命名")}</span><button class="btn-del" onclick="deleteTimelineNode(${idx})">🗑️ 删除</button></div>
      <div class="form-grid">
        <div class="form-group"><label>日期</label><input type="text" class="admin-input" id="tl_date_${idx}" value="${escapeHtml(item.date || "")}"></div>
        <div class="form-group"><label>标签</label><input type="text" class="admin-input" id="tl_tag_${idx}" value="${escapeHtml(item.tag || "")}"></div>
        <div class="form-group"><label>故事标题</label><input type="text" class="admin-input" id="tl_title_${idx}" value="${escapeHtml(item.title || "")}"></div>
        <div class="form-group"><label>地点</label><input type="text" class="admin-input" id="tl_loc_${idx}" value="${escapeHtml(item.location || "")}"></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>正面描述</label><textarea class="admin-textarea" id="tl_desc_${idx}" rows="2">${escapeHtml(item.desc || "")}</textarea></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>背面留言</label><textarea class="admin-textarea" id="tl_back_${idx}" rows="2">${escapeHtml(item.backText || "")}</textarea></div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label style="color:#fbcfe8; font-weight:800;">🎙️ 背面专属录音/语音直链 (60秒以内美好声音记录)</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="tl_voice_${idx}" value="${escapeHtml(item.voiceAudio || "")}" placeholder="输入音频直链或点击右侧上传 MP3/M4A 录音..." oninput="if(currentConfig.timeline[${idx}]) currentConfig.timeline[${idx}].voiceAudio=this.value">
            <button class="btn-upload" style="background:linear-gradient(135deg, #f43f5e 0%, #be123c 100%); color:#fff; border-color:rgba(255,255,255,0.3);" onclick="triggerDirectUpload('tl_voice_${idx}', 'audio/*', (url)=>{ if(currentConfig.timeline[${idx}]) currentConfig.timeline[${idx}].voiceAudio=url; })">🎙️ 上传录音</button>
          </div>
        </div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>正面照片直链</label><div class="upload-input-group"><input type="text" class="admin-input" id="tl_img_${idx}" value="${escapeHtml(item.frontImg || "")}"><button class="btn-upload" onclick="triggerDirectUpload('tl_img_${idx}', 'image/*')">🖼️ 上传照片</button></div></div>
      </div>
    `;
    container.appendChild(card);
  });
}
function addTimelineNode() { if (!currentConfig.timeline) currentConfig.timeline = []; currentConfig.timeline.push({ id: "node_" + Date.now(), date: "2026.05.20", tag: "甜蜜日常", title: "新美好瞬间", desc: "记录下这一天的感动...", location: "📍 幸福角落", frontImg: "assets/images/photo_01.jpg", backText: "翻转看到的独家留言...", voiceAudio: "" }); renderTimelineList(); }
function deleteTimelineNode(idx) { if (confirm("确定删除该时光节点吗？")) { currentConfig.timeline.splice(idx, 1); renderTimelineList(); } }

// 100 件事渲染
function renderChecklist() {
  const container = document.getElementById("checklistItemsContainer");
  if (!container) return;
  container.innerHTML = "";
  (currentConfig.checklist100 || []).forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header"><span class="item-card-title">小事 #${item.id || (idx + 1)}</span><button class="btn-del" onclick="deleteChecklistItem(${idx})">🗑️ 删除</button></div>
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1 / 3;"><label>名称</label><input type="text" class="admin-input" value="${escapeHtml(item.title || "")}" oninput="currentConfig.checklist100[${idx}].title=this.value"></div>
        <div class="form-group"><label>阶段</label><select class="admin-select" onchange="currentConfig.checklist100[${idx}].phase=parseInt(this.value,10)"><option value="1" ${item.phase===1?'selected':''}>🌿 恋爱期</option><option value="2" ${item.phase===2?'selected':''}>💍 订婚期</option><option value="3" ${item.phase===3?'selected':''}>🏠 结婚期</option></select></div>
        <div class="form-group"><label>状态</label><select class="admin-select" onchange="currentConfig.checklist100[${idx}].completed=(this.value==='true')"><option value="false" ${!item.completed?'selected':''}>未完成</option><option value="true" ${item.completed?'selected':''}>已完成</option></select></div>
      </div>
    `;
    container.appendChild(card);
  });
}
function addChecklistItem() { if (!currentConfig.checklist100) currentConfig.checklist100 = []; currentConfig.checklist100.push({ id: currentConfig.checklist100.length + 1, phase: 1, title: "一起去做一件浪漫的事", completed: false }); renderChecklist(); }
function deleteChecklistItem(idx) { currentConfig.checklist100.splice(idx, 1); renderChecklist(); }

// 刮刮乐渲染
function renderScratchCards() {
  const container = document.getElementById("scratchCardsContainer");
  if (!container) return;
  container.innerHTML = "";
  (currentConfig.scratchCards || []).forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header"><span class="item-card-title">${escapeHtml(item.icon||"🎁")} ${escapeHtml(item.title||"特权券")}</span><button class="btn-del" onclick="deleteScratchCard(${idx})">🗑️</button></div>
      <div class="form-grid">
        <div class="form-group"><label>图标</label><input type="text" class="admin-input" value="${escapeHtml(item.icon||"🎁")}" oninput="currentConfig.scratchCards[${idx}].icon=this.value"></div>
        <div class="form-group"><label>名称</label><input type="text" class="admin-input" value="${escapeHtml(item.title||"")}" oninput="currentConfig.scratchCards[${idx}].title=this.value"></div>
        <div class="form-group"><label>阶段</label><select class="admin-select" onchange="currentConfig.scratchCards[${idx}].phase=parseInt(this.value,10)"><option value="1" ${item.phase===1?'selected':''}>🌿 恋爱期</option><option value="2" ${item.phase===2?'selected':''}>💍 订婚期</option><option value="3" ${item.phase===3?'selected':''}>🏠 结婚期</option></select></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>说明</label><textarea class="admin-textarea" rows="2" oninput="currentConfig.scratchCards[${idx}].content=this.value">${escapeHtml(item.content||"")}</textarea></div>
      </div>
    `;
    container.appendChild(card);
  });
}
function addScratchCard() { if (!currentConfig.scratchCards) currentConfig.scratchCards = []; currentConfig.scratchCards.push({ id: "card_" + Date.now(), phase: 1, title: "专属心愿卡", content: "无条件兑现一次！", icon: "✨", scratched: false, used: false, usedTime: "" }); renderScratchCards(); }
function deleteScratchCard(idx) { currentConfig.scratchCards.splice(idx, 1); renderScratchCards(); }

// 全局通用上传调度器
let activeUploadCallback = null;
let activeUploadInputId = null;

function triggerDirectUpload(targetInputId, acceptType, callback) {
  activeUploadInputId = targetInputId;
  activeUploadCallback = callback;
  const uploader = document.getElementById("globalUploader");
  uploader.accept = acceptType || "*/*";
  uploader.click();
}

document.getElementById("globalUploader").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const maxBytes = 15 * 1024 * 1024;
  if (file.size > maxBytes) {
    e.target.value = "";
    return alert(`⚠️ 文件体积过大 (${(file.size / (1024 * 1024)).toFixed(1)} MB)！\n为了保证移动端秒开与存储负载，单个文件请限制在 15 MB 以内。`);
  }

  showToast("⏳ 正在极速上传到独立空间...");
  const formData = new FormData();
  formData.append("file", file);

  try {
    const token = getAuthToken();
    const res = await fetch(`/api/love/upload?auth=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "x-admin-auth": token, "Authorization": `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success && data.url) {
      if (activeUploadInputId) {
        const targetInput = document.getElementById(activeUploadInputId);
        if (targetInput) {
          targetInput.value = data.url;
          targetInput.dispatchEvent(new Event("input"));
        }
      }
      if (activeUploadCallback) {
        activeUploadCallback(data.url, file);
      }
      if (activeUploadInputId === "theme_customBgUrlBoy" && currentConfig) {
        if (!currentConfig.theme) currentConfig.theme = {};
        currentConfig.theme.customBgUrlBoy = data.url;
      }
      if (activeUploadInputId === "theme_customBgUrlGirl" && currentConfig) {
        if (!currentConfig.theme) currentConfig.theme = {};
        currentConfig.theme.customBgUrlGirl = data.url;
      }
      showToast("✓ 上传成功！直链已自动同步");
    } else {
      alert("❌ 上传失败: " + (data.error || "服务端拒绝接收"));
    }
  } catch (err) {
    alert("❌ 上传异常: " + err.message);
  } finally {
    e.target.value = "";
  }
});

// 发布全量配置到云端 (全模块无损持久化)
async function saveAllConfigToCloud() {
  if (!currentConfig) return;
  const customPwd = (document.getElementById("admin_customPassword")?.value || "521").trim();
  currentConfig.adminSecurity = {
    password: customPwd || "521",
    updatedAt: new Date().toISOString()
  };
  currentConfig.lifecycle = { currentPhase: document.getElementById("lifecycle_phase").value };
  currentConfig.meta = {
    boyName: document.getElementById("meta_boyName").value.trim(),
    girlName: document.getElementById("meta_girlName").value.trim(),
    startDate: document.getElementById("meta_startDate").value.trim(),
    nextMilestoneTitle: document.getElementById("meta_nextMilestoneTitle").value.trim(),
    nextMilestoneDate: document.getElementById("meta_nextMilestoneDate").value.trim(),
    siteTitle: document.getElementById("meta_siteTitle").value.trim(),
    siteSubtitle: document.getElementById("meta_siteSubtitle").value.trim()
  };
  const errorTipsRaw = document.getElementById("gatekeeper_errorTips").value.split("\n").map(s => s.trim()).filter(Boolean);
  currentConfig.gatekeeper = {
    enabled: document.getElementById("gatekeeper_enabled").value === "true",
    title: document.getElementById("gatekeeper_title").value.trim(),
    question: document.getElementById("gatekeeper_question").value.trim(),
    hint: document.getElementById("gatekeeper_hint").value.trim(),
    correctAnswer: document.getElementById("gatekeeper_correctAnswer").value.trim(),
    voiceVows: document.getElementById("gatekeeper_voiceVows").value.trim(),
    errorTips: errorTipsRaw.length > 0 ? errorTipsRaw : ["没关系，慢慢想。"]
  };
  currentConfig.letter = {
    title: document.getElementById("letter_title").value.trim(),
    signDate: document.getElementById("letter_signDate").value.trim(),
    signature: document.getElementById("letter_signature").value.trim(),
    content: document.getElementById("letter_content").value.trim()
  };
  currentConfig.easterEggs = [
    { id: "egg_1", selector: "#egg-star", message: document.getElementById("egg_1_message").value.trim() },
    { id: "egg_2", selector: "#egg-paw", message: document.getElementById("egg_2_message").value.trim() }
  ];
  currentConfig.theme = {
    ...(currentConfig.theme || {}),
    currentThemeBoy: currentConfig.theme?.currentThemeBoy || "sunset-twilight",
    currentThemeGirl: currentConfig.theme?.currentThemeGirl || "french-cream",
    customBgUrlBoy: document.getElementById("theme_customBgUrlBoy")?.value.trim() || "",
    customBgUrlGirl: document.getElementById("theme_customBgUrlGirl")?.value.trim() || ""
  };

  // 1. 同步时光轴节点
  (currentConfig.timeline || []).forEach((node, idx) => {
    node.date = document.getElementById(`tl_date_${idx}`)?.value || "";
    node.tag = document.getElementById(`tl_tag_${idx}`)?.value || "";
    node.title = document.getElementById(`tl_title_${idx}`)?.value || "";
    node.location = document.getElementById(`tl_loc_${idx}`)?.value || "";
    node.desc = document.getElementById(`tl_desc_${idx}`)?.value || "";
    node.backText = document.getElementById(`tl_back_${idx}`)?.value || "";
    node.voiceAudio = document.getElementById(`tl_voice_${idx}`)?.value?.trim() || "";
    node.frontImg = document.getElementById(`tl_img_${idx}`)?.value || "";
  });

  // 2. 同步纪念日全量数据
  (currentConfig.anniversaries || []).forEach((item, idx) => {
    item.title = document.getElementById(`anni_title_${idx}`)?.value.trim() || item.title || "契约纪念日";
    item.icon = document.getElementById(`anni_icon_${idx}`)?.value.trim() || item.icon || "💖";
    item.tag = document.getElementById(`anni_tag_${idx}`)?.value.trim() || item.tag || "";
    item.type = document.getElementById(`anni_type_${idx}`)?.value || item.type || "countdown";
    item.isLunar = document.getElementById(`anni_islunar_${idx}`)?.value === "true";
    item.isLeapMonth = document.getElementById(`anni_isleap_${idx}`)?.value === "true";
    item.date = document.getElementById(`anni_date_${idx}`)?.value.trim() || item.date || "2026-05-20";
    item.memo = document.getElementById(`anni_memo_${idx}`)?.value.trim() || item.memo || "";
    item.bgImg = document.getElementById(`anni_bg_${idx}`)?.value.trim() || item.bgImg || "";
    item.voiceAudio = document.getElementById(`anni_voice_${idx}`)?.value.trim() || item.voiceAudio || "";
  });

  // 3. 🌟 同步破冰与情感信号箱配置
  const ibCooldownVal = parseInt(document.getElementById("icebreaker_cooldownMinutes")?.value, 10) || 15;
  currentConfig.icebreaker = {
    enabled: document.getElementById("icebreaker_enabled")?.value === "true",
    cooldownMinutes: ibCooldownVal,
    soundEnabled: document.getElementById("icebreaker_soundEnabled")?.value === "true",
    actions: currentConfig.icebreaker?.actions || window.LOVE_CONFIG?.icebreaker?.actions || {}
  };

  // 4. 同步播放列表
  const playlistToSave = (currentConfig.audio?.playlist || []).map((song, idx) => ({
    id: song.id || ("song_" + idx),
    title: document.getElementById(`pl_title_${idx}`)?.value.trim() || song.title || "背景音乐",
    artist: document.getElementById(`pl_artist_${idx}`)?.value.trim() || song.artist || "精选歌手",
    url: document.getElementById(`pl_url_${idx}`)?.value.trim() || song.url || "",
    cover: document.getElementById(`pl_cover_${idx}`)?.value.trim() || song.cover || ""
  }));

  currentConfig.audio = {
    ...(currentConfig.audio || {}),
    bgmAutoPlay: document.getElementById("audio_bgmAutoPlay").value === "true",
    playMode: document.getElementById("audio_playMode").value || "list-loop",
    bgmTitle: document.getElementById("audio_bgmTitle").value.trim(),
    bgmArtist: document.getElementById("audio_bgmArtist").value.trim(),
    bgmUrl: document.getElementById("audio_bgmUrl").value.trim(),
    vinylCover: document.getElementById("audio_vinylCover").value.trim(),
    playlist: playlistToSave
  };

  showToast("⏳ 正在发布到独立存储空间...");
  const token = getAuthToken();
  try {
    const res = await fetch(`/api/love/config?auth=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-auth": token, "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ config: currentConfig })
    });
    const data = await res.json();
    if (data.success) {
      currentAdminToken = customPwd;
      localStorage.setItem("love_admin_token", customPwd);
      showToast("✨ 全部配置、新管理密码与破冰信号箱已成功发布！");
    } else {
      alert("❌ 保存失败: " + (data.error || "未授权"));
    }
  } catch (err) {
    alert("❌ 保存失败: " + err.message);
  }
}

// 导出与导入备份
function exportBackupJSON() {
  if (!currentConfig) return;
  const a = document.createElement("a");
  a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentConfig, null, 2));
  a.download = `雅歌契约配置备份_${Date.now()}.json`;
  a.click();
}

function importConfigJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      currentConfig = JSON.parse(event.target.result);
      renderAllForms();
      showToast("✓ 成功载入");
    } catch (_) {
      alert("❌ 格式损坏");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Tab 切换驱动
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab)?.classList.add("active");
  });
});

// 初始化鉴权会话
document.addEventListener("DOMContentLoaded", () => {
  const cached = localStorage.getItem("love_admin_token");
  if (cached) {
    currentAdminToken = cached;
    fetchConfigFromCloud(cached).then(success => {
      if (success) {
        const modal = document.getElementById("authModal");
        const layout = document.getElementById("adminLayout");
        if (modal) modal.style.display = "none";
        if (layout) layout.style.display = "block";
      } else {
        localStorage.removeItem("love_admin_token");
        currentAdminToken = "";
        const input = document.getElementById("adminPwdInput");
        if (input) input.value = "";
      }
    });
  }
});
