/**
 * 众水不灭 · 雅歌之印 (Love Universe) 控制中心主控
 * 文件名: js/admin.js
 */

let currentConfig = null;
let currentAdminToken = "";
let currentDomainHost = "";

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// 辅助函数：深度合并本地与云端配置
function mergeWithDefaultConfig(cloudCfg) {
  const base = JSON.parse(JSON.stringify(window.LOVE_CONFIG || {}));
  if (!cloudCfg || typeof cloudCfg !== "object") return base;

  return {
    ...base,
    ...cloudCfg,
    meta: { ...(base.meta || {}), ...(cloudCfg.meta || {}) },
    gatekeeper: { ...(base.gatekeeper || {}), ...(cloudCfg.gatekeeper || {}) },
    letter: { ...(base.letter || {}), ...(cloudCfg.letter || {}) },
    audio: { ...(base.audio || {}), ...(cloudCfg.audio || {}) },
    theme: { ...(base.theme || {}), ...(cloudCfg.theme || {}) },
    lifecycle: { ...(base.lifecycle || {}), ...(cloudCfg.lifecycle || {}) },
    timeline: (Array.isArray(cloudCfg.timeline) && cloudCfg.timeline.length > 0) ? cloudCfg.timeline : (base.timeline || []),
    checklist100: (Array.isArray(cloudCfg.checklist100) && cloudCfg.checklist100.length > 0) ? cloudCfg.checklist100 : (base.checklist100 || []),
    scratchCards: (Array.isArray(cloudCfg.scratchCards) && cloudCfg.scratchCards.length > 0) ? cloudCfg.scratchCards : (base.scratchCards || []),
    easterEggs: (Array.isArray(cloudCfg.easterEggs) && cloudCfg.easterEggs.length > 0) ? cloudCfg.easterEggs : (base.easterEggs || []),
    _license: cloudCfg._license || base._license || null,
    adminSecurity: cloudCfg.adminSecurity || base.adminSecurity || null
  };
}

// 1. 验证管理员口令
async function verifyAdminLogin() {
  const pwdInput = document.getElementById("adminPwdInput");
  const pwd = pwdInput.value.trim();
  if (!pwd) return alert("请输入管理员口令！");

  currentAdminToken = pwd;
  localStorage.setItem("love_admin_token", pwd);

  const success = await fetchConfigFromCloud();
  if (success) {
    document.getElementById("authModal").style.display = "none";
    document.getElementById("adminLayout").style.display = "block";
    showToast("✓ 验证成功，已加载当前域名独立配置");
  } else {
    alert("❌ 口令错误或无法连接云端！");
  }
}

// 2. 从 R2 拉取配置
async function fetchConfigFromCloud() {
  try {
    const res = await fetch("/api/love/config", {
      headers: { "x-admin-auth": currentAdminToken }
    });
    const data = await res.json();

    if (data.success) {
      currentDomainHost = data.domain || window.location.hostname;
      const domainBadge = document.getElementById("adminDomainBadge");
      if (domainBadge) domainBadge.textContent = `当前租户节点: ${currentDomainHost}`;

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
    currentConfig = JSON.parse(JSON.stringify(window.LOVE_CONFIG || {}));
    renderAllForms();
    return true;
  }
}

// 3. 渲染所有表单
function renderAllForms() {
  if (!currentConfig) return;

  const sec = currentConfig.adminSecurity || {};
  const pwdInput = document.getElementById("admin_customPassword");
  if (pwdInput) pwdInput.value = sec.password || "521";

  const lifecycle = currentConfig.lifecycle || {};
  const phaseSelect = document.getElementById("lifecycle_phase");
  if (phaseSelect) phaseSelect.value = lifecycle.currentPhase || "dating";

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
  document.getElementById("gatekeeper_errorTips").value = (gate.errorTips || []).join("\n");

  const letter = currentConfig.letter || {};
  document.getElementById("letter_title").value = letter.title || "";
  document.getElementById("letter_signDate").value = letter.signDate || "";
  document.getElementById("letter_signature").value = letter.signature || "";
  document.getElementById("letter_content").value = letter.content || "";

  renderTimelineList();
  renderChecklist();
  renderScratchCards();

  const audio = currentConfig.audio || {};
  document.getElementById("audio_bgmAutoPlay").value = String(audio.bgmAutoPlay !== false);
  document.getElementById("audio_bgmTitle").value = audio.bgmTitle || "";
  document.getElementById("audio_bgmArtist").value = audio.bgmArtist || "";
  document.getElementById("audio_bgmUrl").value = audio.bgmUrl || "";
  document.getElementById("audio_vinylCover").value = audio.vinylCover || "";

  const eggs = currentConfig.easterEggs || [];
  document.getElementById("egg_1_message").value = eggs[0]?.message || "";
  document.getElementById("egg_2_message").value = eggs[1]?.message || "";

  renderThemeShowroom();
  renderLicenseStatus();
}

function renderLicenseStatus() {
  const badge = document.getElementById("licenseStatusBadge");
  if (!badge) return;

  if (currentConfig._license && currentConfig._license.unlocked) {
    badge.innerHTML = `<span style="color:#34d399;">✨ 已永久激活【${currentConfig._license.tier || "全功能版本"}】 (绑定域名: ${currentConfig._license.boundDomain || currentDomainHost})</span>`;
  } else {
    badge.innerHTML = `<span style="color:#f59e0b;">⏳ 基础免费版 (未输入专属激活码)</span>`;
  }
}

async function submitDomainLicense() {
  const codeInput = document.getElementById("inputLicenseCode");
  const code = codeInput.value.trim();
  if (!code) return alert("请输入授权兑换码！");

  showToast("⏳ 正在验证域名授权...");

  try {
    const res = await fetch("/api/love/verify-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        licenseCode: code,
        currentConfig: currentConfig
      })
    });
    const data = await res.json();

    if (data.success) {
      alert(`🎉 ${data.message}`);
      await fetchConfigFromCloud();
    } else {
      alert(`❌ 激活失败: ${data.message || "授权码与当前域名不匹配"}`);
    }
  } catch (err) {
    alert("❌ 请求异常: " + err.message);
  }
}

function resetToCodePresets() {
  if (!confirm("⚠️ 确定要载入代码里的最新预设吗？\n这将载入包含全情绪图谱的 48 项小事与 12 张特权刮刮乐，随后点击右上角【💾 立即发布生效】即可同步写入云端！")) return;

  if (window.LOVE_CONFIG) {
    const existingLicense = currentConfig?._license;
    currentConfig = JSON.parse(JSON.stringify(window.LOVE_CONFIG));
    if (existingLicense) currentConfig._license = existingLicense;

    renderAllForms();
    showToast("✓ 已载入最新预设，请点击右上角【立即发布生效】！");
  } else {
    alert("❌ 未读取到本地 config.js 预设数据");
  }
}

function renderThemeShowroom() {
  const container = document.getElementById("themeShowroomContainer");
  if (!container) return;

  const currentSelected = currentConfig.theme?.currentTheme || "sunset-twilight";
  const defaultThemes = {
    "sunset-twilight": { id: "sunset-twilight", name: "🌌 暮色星河", tag: "浪漫 / 温暖", desc: "落日余晖与闪烁星空交织，带尾迹的流星雨穿梭" },
    "sakura-romance": { id: "sakura-romance", name: "🌸 初雪樱花", tag: "温柔 / 唯美", desc: "3D 翻转花瓣受微风吹拂徐徐飘落，触碰指尖随风舞动" },
    "cyber-space": { id: "cyber-space", name: "⚡ 赛博漫游", tag: "科技 / 帅气", desc: "霓虹光束与全息矩阵粒子穿梭，极具未来科幻质感" },
    "firefly-forest": { id: "firefly-forest", name: "🌲 萤火森林", tag: "治愈 / 深邃", desc: "幽绿森林夜空中的发光萤火虫，忽明忽暗灵动飞舞" },
    "warm-ember": { id: "warm-ember", name: "🔥 炽热余烬", tag: "热情 / 爱意", desc: "如壁炉般缓缓升腾的火星余烬，温暖深沉而热烈" },
    "sweet-dream": { id: "sweet-dream", name: "🍬 奶油甜梦", tag: "可爱 / 治愈", desc: "梦幻半透明糖果气泡缓缓升起，伴随微光折射动效" }
  };

  const themes = (window.ThemeEngine && window.ThemeEngine.registry) ? window.ThemeEngine.registry : defaultThemes;

  container.innerHTML = Object.keys(themes).map(key => {
    const item = themes[key];
    const isSelected = item.id === currentSelected;
    return `
      <div 
        class="theme-card ${isSelected ? 'theme-card--selected' : ''}" 
        onclick="selectThemeCard('${item.id}')"
        style="
          background: ${isSelected ? 'rgba(244, 63, 94, 0.18)' : 'rgba(3, 7, 18, 0.6)'};
          border: 1.5px solid ${isSelected ? '#f43f5e' : 'rgba(255,255,255,0.1)'};
          box-shadow: ${isSelected ? '0 0 20px rgba(244, 63, 94, 0.3)' : 'none'};
          border-radius: 16px; padding: 16px; cursor: pointer; transition: all 0.2s;
          display: flex; flex-direction: column; justify-content: space-between;
        "
      >
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:15px; font-weight:900; color:#fff;">${item.name}</span>
            <span style="font-size:10.5px; font-weight:800; background:rgba(255,255,255,0.1); color:#fde68a; padding:2px 8px; border-radius:12px;">${item.tag}</span>
          </div>
          <p style="font-size:12px; color:#94a3b8; line-height:1.5; margin-bottom:12px;">${item.desc}</p>
        </div>
        <div style="font-size:12px; font-weight:800; color:${isSelected ? '#f43f5e' : '#64748b'}; text-align:right;">
          ${isSelected ? '✓ 当前应用中' : '点击切换'}
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("theme_customBgUrl").value = currentConfig.theme?.customBgUrl || "";
}

function selectThemeCard(themeId) {
  if (!currentConfig.theme) currentConfig.theme = {};
  currentConfig.theme.currentTheme = themeId;
  renderThemeShowroom();
  showToast(`✓ 已选择主题【${themeId}】，请点击右上角保存发布！`);
}

function quickSearchTag(tagText) {
  document.getElementById("musicSearchKeyword").value = tagText;
  executeOnlineMusicSearch();
}

async function executeOnlineMusicSearch() {
  const kw = document.getElementById("musicSearchKeyword").value.trim();
  const listContainer = document.getElementById("onlineSearchResultList");
  if (!kw) return alert("请输入要搜索的歌名或歌手！");

  listContainer.innerHTML = `<div style="color:#fde68a; font-size:12px; padding:10px; text-align:center;">⏳ 正在检索【${escapeHtml(kw)}】直连音频流...</div>`;

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
            <button class="btn-tool preview-play-btn" id="prev_btn_${idx}" style="padding:5px 10px; font-size:11.5px;" onclick="testPreviewAudio('${song.url}', 'prev_btn_${idx}')">🎧 试听</button>
            <button class="btn-tool" style="background:var(--gold); color:#fff; padding:5px 12px; font-size:11.5px;" onclick="selectCloudMusic('${escapeHtml(song.title)}', '${escapeHtml(song.artist)}', '${song.url}')">✓ 设为BGM</button>
          </div>
        </div>
      `).join("");
    } else {
      listContainer.innerHTML = `<div style="color:#fca5a5; font-size:12px; padding:10px; text-align:center;">🍃 未找到歌曲，请尝试更简短的关键词</div>`;
    }
  } catch (_) {
    listContainer.innerHTML = `<div style="color:#fca5a5; font-size:12px; padding:10px; text-align:center;">❌ 检索超时，请检查网络后重试</div>`;
  }
}

let previewAudioObj = null;
let currentPreviewBtnId = null;

function testPreviewAudio(url, btnId) {
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

  previewAudioObj = new Audio(url);
  currentPreviewBtnId = btnId;
  if (currentBtn) currentBtn.textContent = "⏳ 缓冲中...";

  previewAudioObj.play()
    .then(() => {
      if (currentBtn) currentBtn.textContent = "⏸️ 暂停";
      showToast("🎵 正在流畅试听曲目...");
    })
    .catch(() => {
      if (currentBtn) currentBtn.textContent = "🎧 试听";
      showToast("⚠️ 正在调取备用音频流...");
    });

  previewAudioObj.onended = () => {
    if (currentBtn) currentBtn.textContent = "🎧 试听";
  };
}

function selectCloudMusic(title, artist, url) {
  document.getElementById("audio_bgmTitle").value = title;
  document.getElementById("audio_bgmArtist").value = artist;
  document.getElementById("audio_bgmUrl").value = url;

  if (previewAudioObj) {
    previewAudioObj.pause();
    previewAudioObj = null;
    document.querySelectorAll(".preview-play-btn").forEach(b => b.textContent = "🎧 试听");
  }

  showToast(`✓ 已成功将【${title}】填入配置，请点击右上角保存！`);
}

async function cleanOrphanR2Cache() {
  if (!confirm("⚠️ 确定要清理当前站点存储中未引用的废弃照片与音频吗？")) return;
  showToast("⏳ 正在扫描并清理当前域名孤立文件...");

  try {
    const res = await fetch("/api/love/cleanup", {
      method: "POST",
      headers: { "x-admin-auth": currentAdminToken }
    });
    const data = await res.json();
    if (data.success) {
      alert(`✨ ${data.message}`);
    } else {
      alert("❌ 清理失败: " + (data.error || "接口异常"));
    }
  } catch (err) {
    alert("❌ 请求异常: " + err.message);
  }
}

function renderTimelineList() {
  const container = document.getElementById("timelineListContainer");
  container.innerHTML = "";
  const list = currentConfig.timeline || [];

  list.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header">
        <span class="item-card-title">节点 #${idx + 1} - ${escapeHtml(item.title || "未命名")}</span>
        <button class="btn-del" onclick="deleteTimelineNode(${idx})">🗑️ 删除</button>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>日期 (如: 2024.05.20)</label><input type="text" class="admin-input" value="${escapeHtml(item.date || "")}" onchange="currentConfig.timeline[${idx}].date=this.value"></div>
        <div class="form-group"><label>标签 (如: 初遇心动)</label><input type="text" class="admin-input" value="${escapeHtml(item.tag || "")}" onchange="currentConfig.timeline[${idx}].tag=this.value"></div>
        <div class="form-group"><label>故事标题</label><input type="text" class="admin-input" value="${escapeHtml(item.title || "")}" onchange="currentConfig.timeline[${idx}].title=this.value"></div>
        <div class="form-group"><label>地点 (如: 📍 晴天咖啡馆)</label><input type="text" class="admin-input" value="${escapeHtml(item.location || "")}" onchange="currentConfig.timeline[${idx}].location=this.value"></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>正面故事描述</label><textarea class="admin-textarea" rows="2" onchange="currentConfig.timeline[${idx}].desc=this.value">${escapeHtml(item.desc || "")}</textarea></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>背面私语留言</label><textarea class="admin-textarea" rows="2" onchange="currentConfig.timeline[${idx}].backText=this.value">${escapeHtml(item.backText || "")}</textarea></div>
        <div class="form-group">
          <label>拍立得正面照片链接</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="tl_img_${idx}" value="${escapeHtml(item.frontImg || "")}" onchange="currentConfig.timeline[${idx}].frontImg=this.value">
            <button class="btn-upload" onclick="triggerDirectUpload('tl_img_${idx}', 'image/*', (url)=>{ currentConfig.timeline[${idx}].frontImg=url; })">🖼️ 上传照片</button>
          </div>
        </div>
        <div class="form-group">
          <label>专属录音音频链接 (可选)</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="tl_voice_${idx}" value="${escapeHtml(item.voiceAudio || "")}" onchange="currentConfig.timeline[${idx}].voiceAudio=this.value">
            <button class="btn-upload" onclick="triggerDirectUpload('tl_voice_${idx}', 'audio/*', (url)=>{ currentConfig.timeline[${idx}].voiceAudio=url; })">🎙️ 上传录音</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addTimelineNode() {
  if (!currentConfig.timeline) currentConfig.timeline = [];
  currentConfig.timeline.push({
    id: "node_" + Date.now(),
    date: "2026.05.20",
    tag: "甜蜜日常",
    title: "新美好瞬间",
    desc: "记录下这一天的感动...",
    location: "📍 幸福角落",
    frontImg: "assets/images/photo_01.jpg",
    backText: "翻转看到的独家留言...",
    voiceAudio: ""
  });
  renderTimelineList();
}

function deleteTimelineNode(idx) {
  if (confirm("确定删除该时光节点吗？")) {
    currentConfig.timeline.splice(idx, 1);
    renderTimelineList();
  }
}

function renderChecklist() {
  const container = document.getElementById("checklistItemsContainer");
  container.innerHTML = "";
  const list = currentConfig.checklist100 || [];

  list.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header">
        <span class="item-card-title">小事 #${item.id || (idx + 1)}</span>
        <button class="btn-del" onclick="deleteChecklistItem(${idx})">🗑️ 删除</button>
      </div>
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1 / 3;">
          <label>小事名称</label>
          <input type="text" class="admin-input" value="${escapeHtml(item.title || "")}" onchange="currentConfig.checklist100[${idx}].title=this.value">
        </div>
        <div class="form-group">
          <label>所属阶段</label>
          <select class="admin-select" onchange="currentConfig.checklist100[${idx}].phase=parseInt(this.value,10)">
            <option value="1" ${item.phase === 1 ? 'selected' : ''}>🌿 Phase 1 恋爱期</option>
            <option value="2" ${item.phase === 2 ? 'selected' : ''}>💍 Phase 2 订婚期</option>
            <option value="3" ${item.phase === 3 ? 'selected' : ''}>🏠 Phase 3 结婚期</option>
          </select>
        </div>
        <div class="form-group">
          <label>完成状态</label>
          <select class="admin-select" onchange="currentConfig.checklist100[${idx}].completed=(this.value==='true')">
            <option value="false" ${!item.completed ? 'selected' : ''}>未完成</option>
            <option value="true" ${item.completed ? 'selected' : ''}>已完成 (打勾)</option>
          </select>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addChecklistItem() {
  if (!currentConfig.checklist100) currentConfig.checklist100 = [];
  const nextId = currentConfig.checklist100.length + 1;
  currentConfig.checklist100.push({ id: nextId, phase: 1, title: "一起去做一件浪漫的事", completed: false });
  renderChecklist();
}

function deleteChecklistItem(idx) {
  currentConfig.checklist100.splice(idx, 1);
  renderChecklist();
}

function renderScratchCards() {
  const container = document.getElementById("scratchCardsContainer");
  container.innerHTML = "";
  const list = currentConfig.scratchCards || [];

  list.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header">
        <span class="item-card-title">${escapeHtml(item.icon || "🎁")} ${escapeHtml(item.title || "特权券")}</span>
        <button class="btn-del" onclick="deleteScratchCard(${idx})">🗑️ 删除</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>卡券图标 (Emoji)</label>
          <input type="text" class="admin-input" value="${escapeHtml(item.icon || "🎁")}" onchange="currentConfig.scratchCards[${idx}].icon=this.value">
        </div>
        <div class="form-group">
          <label>特权券名称</label>
          <input type="text" class="admin-input" value="${escapeHtml(item.title || "")}" onchange="currentConfig.scratchCards[${idx}].title=this.value">
        </div>
        <div class="form-group">
          <label>所属阶段</label>
          <select class="admin-select" onchange="currentConfig.scratchCards[${idx}].phase=parseInt(this.value,10)">
            <option value="1" ${item.phase === 1 ? 'selected' : ''}>🌿 Phase 1 恋爱期</option>
            <option value="2" ${item.phase === 2 ? 'selected' : ''}>💍 Phase 2 订婚期</option>
            <option value="3" ${item.phase === 3 ? 'selected' : ''}>🏠 Phase 3 结婚期</option>
          </select>
        </div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label>特权详细说明</label>
          <textarea class="admin-textarea" rows="2" onchange="currentConfig.scratchCards[${idx}].content=this.value">${escapeHtml(item.content || "")}</textarea>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addScratchCard() {
  if (!currentConfig.scratchCards) currentConfig.scratchCards = [];
  currentConfig.scratchCards.push({
    id: "card_" + Date.now(),
    phase: 1,
    title: "专属心愿特权卡",
    content: "持此卡可无条件兑现一次专属温柔举动！",
    icon: "✨",
    scratched: false,
    used: false,
    usedTime: ""
  });
  renderScratchCards();
}

function deleteScratchCard(idx) {
  currentConfig.scratchCards.splice(idx, 1);
  renderScratchCards();
}

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

  showToast("⏳ 正在流式上传到当前域名 R2 空间...");
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/love/upload", {
      method: "POST",
      headers: { "x-admin-auth": currentAdminToken },
      body: formData
    });
    const data = await res.json();

    if (data.success && data.url) {
      if (activeUploadInputId) {
        document.getElementById(activeUploadInputId).value = data.url;
      }
      if (activeUploadCallback) {
        activeUploadCallback(data.url);
      }
      showToast("✓ 上传成功并已填入直链");
    } else {
      alert("❌ 上传失败: " + (data.error || "接口异常"));
    }
  } catch (err) {
    alert("❌ 上传异常: " + err.message);
  } finally {
    e.target.value = "";
  }
});

// ================= 保存全量配置 =================
async function saveAllConfigToCloud() {
  if (!currentConfig) return;

  const customPwd = (document.getElementById("admin_customPassword")?.value || "521").trim();
  currentConfig.adminSecurity = {
    password: customPwd || "521",
    updatedAt: new Date().toISOString()
  };

  currentConfig.lifecycle = {
    currentPhase: document.getElementById("lifecycle_phase").value
  };

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
    errorTips: errorTipsRaw.length > 0 ? errorTipsRaw : ["没关系，慢慢想，我一直都在这里等你。"]
  };

  currentConfig.letter = {
    title: document.getElementById("letter_title").value.trim(),
    signDate: document.getElementById("letter_signDate").value.trim(),
    signature: document.getElementById("letter_signature").value.trim(),
    content: document.getElementById("letter_content").value.trim()
  };

  currentConfig.audio = {
    ...(currentConfig.audio || {}),
    bgmAutoPlay: document.getElementById("audio_bgmAutoPlay").value === "true",
    bgmTitle: document.getElementById("audio_bgmTitle").value.trim(),
    bgmArtist: document.getElementById("audio_bgmArtist").value.trim(),
    bgmUrl: document.getElementById("audio_bgmUrl").value.trim(),
    vinylCover: document.getElementById("audio_vinylCover").value.trim()
  };

  currentConfig.easterEggs = [
    { id: "egg_1", selector: "#egg-star", message: document.getElementById("egg_1_message").value.trim() },
    { id: "egg_2", selector: "#egg-paw", message: document.getElementById("egg_2_message").value.trim() }
  ];

  currentConfig.theme = {
    currentTheme: currentConfig.theme?.currentTheme || "sunset-twilight",
    customBgUrl: document.getElementById("theme_customBgUrl") ? document.getElementById("theme_customBgUrl").value.trim() : ""
  };

  showToast("⏳ 正在发布到 R2 云端...");

  try {
    const res = await fetch("/api/love/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-auth": currentAdminToken
      },
      body: JSON.stringify({ config: currentConfig })
    });
    const data = await res.json();

    if (data.success) {
      currentAdminToken = customPwd || "521";
      localStorage.setItem("love_admin_token", currentAdminToken);
      showToast("✨ 全部配置已成功发布！管理密码与内容即时生效");
    } else {
      alert("❌ 保存失败: " + (data.error || "未授权"));
    }
  } catch (err) {
    alert("❌ 保存失败: " + err.message);
  }
}

function exportBackupJSON() {
  if (!currentConfig) return;
  const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentConfig, null, 2));
  const a = document.createElement("a");
  a.href = str;
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
      showToast("✓ 成功载入备份配置，请点击右上角保存");
    } catch (_) {
      alert("❌ JSON 格式损坏，导入失败");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add("active");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const cached = localStorage.getItem("love_admin_token");
  if (cached) {
    document.getElementById("adminPwdInput").value = cached;
  }
});
