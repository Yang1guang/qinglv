/**
 * 众水不灭 · 雅歌之印 (Love Universe) 控制中心主控
 * 文件名: js/admin.js
 */

let currentConfig = null;
let currentAdminToken = "";
let currentDomainHost = "";

function getAuthToken() {
  return (currentAdminToken || localStorage.getItem("love_admin_token") || "521").trim();
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

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

async function verifyAdminLogin() {
  const pwdInput = document.getElementById("adminPwdInput");
  const pwd = pwdInput ? pwdInput.value.trim() : "";
  const tokenToVerify = pwd || getAuthToken();
  currentAdminToken = tokenToVerify;

  const success = await fetchConfigFromCloud(tokenToVerify);
  if (success) {
    localStorage.setItem("love_admin_token", tokenToVerify);
    const modal = document.getElementById("authModal");
    const layout = document.getElementById("adminLayout");
    if (modal) modal.style.display = "none";
    if (layout) layout.style.display = "block";
    showToast("✓ 验证成功，已连接独立云端存储");
  } else {
    localStorage.removeItem("love_admin_token");
    alert("❌ 口令错误或未授权！请输入正确的管理员密码 (默认 521)");
  }
}

async function fetchConfigFromCloud(tokenOverride) {
  const token = (tokenOverride || getAuthToken()).trim();
  try {
    const res = await fetch(`/api/love/config?auth=${encodeURIComponent(token)}`, {
      headers: { "x-admin-auth": token, "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return false;
    const data = await res.json();

    if (data.success && data.isAdmin) {
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
    return false;
  }
}

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

function resetToCodePresets() {
  if (!confirm("⚠️ 确定要载入最新预设吗？\n点击右上角【💾 立即发布生效】即可同步写入云端！")) return;
  if (window.LOVE_CONFIG) {
    const existingLicense = currentConfig?._license;
    currentConfig = JSON.parse(JSON.stringify(window.LOVE_CONFIG));
    if (existingLicense) currentConfig._license = existingLicense;
    renderAllForms();
    showToast("✓ 已载入最新预设，请保存！");
  }
}

function quickSearchTag(tagText) {
  document.getElementById("musicSearchKeyword").value = tagText;
  executeOnlineMusicSearch();
}

async function executeOnlineMusicSearch() {
  const kw = document.getElementById("musicSearchKeyword").value.trim();
  const listContainer = document.getElementById("onlineSearchResultList");
  if (!kw) return alert("请输入要搜索的歌名或歌手！");

  listContainer.innerHTML = `<div style="color:#fde68a; font-size:12px; padding:10px; text-align:center;">⏳ 正在检索酷狗直连音频流...</div>`;

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
            <button class="btn-tool" style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color:#fff; padding:5px 12px; font-size:11.5px;" onclick="setAsSingleBGM('${escapeHtml(song.title)}', '${escapeHtml(song.artist)}', '${song.url}')">✓ 设为背景音乐</button>
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

function setAsSingleBGM(title, artist, url) {
  document.getElementById("audio_bgmTitle").value = title;
  document.getElementById("audio_bgmArtist").value = artist;
  document.getElementById("audio_bgmUrl").value = url;
  showToast(`✓ 已将《${title}》设为BGM，请点击右上角【💾 立即发布生效】！`);
}

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
    alert(`⚠️ 《${songTitle || "该歌曲"}》因平台 VIP 版权风控无法在线解析。\n\n💡 完美解决方案：\n请使用下方【📤 上传MP3】按钮，直接上传您本地下载好的原版 MP3 文件，100% 永久稳定可播！`);
  });

  previewAudioObj.onended = () => {
    if (currentBtn) currentBtn.textContent = "🎧 试听";
  };
}

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

async function cleanOrphanR2Cache() {
  if (!confirm("⚠️ 确定要清理孤立文件吗？")) return;
  showToast("⏳ 扫描清理中...");
  try {
    const res = await fetch(`/api/love/cleanup?auth=${encodeURIComponent(getAuthToken())}`, { method: "POST", headers: { "x-admin-auth": getAuthToken() }});
    const data = await res.json();
    if (data.success) alert(`✨ ${data.message}`); else alert("❌ 清理失败: " + (data.error || "接口异常"));
  } catch (err) { alert("❌ 请求异常: " + err.message); }
}

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
        <div class="form-group"><label>正面照片直链</label><div class="upload-input-group"><input type="text" class="admin-input" id="tl_img_${idx}" value="${escapeHtml(item.frontImg || "")}"><button class="btn-upload" onclick="triggerDirectUpload('tl_img_${idx}', 'image/*')">🖼️</button></div></div>
      </div>
    `;
    container.appendChild(card);
  });
}
function addTimelineNode() { if (!currentConfig.timeline) currentConfig.timeline = []; currentConfig.timeline.push({ id: "node_" + Date.now(), date: "2026.05.20", tag: "甜蜜日常", title: "新美好瞬间", desc: "记录下这一天的感动...", location: "📍 幸福角落", frontImg: "assets/images/photo_01.jpg", backText: "翻转看到的独家留言...", voiceAudio: "" }); renderTimelineList(); }
function deleteTimelineNode(idx) { if (confirm("确定删除该时光节点吗？")) { currentConfig.timeline.splice(idx, 1); renderTimelineList(); } }

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

let activeUploadCallback = null;
let activeUploadInputId = null;
function triggerDirectUpload(targetInputId, acceptType, callback) { activeUploadInputId = targetInputId; activeUploadCallback = callback; const uploader = document.getElementById("globalUploader"); uploader.accept = acceptType || "*/*"; uploader.click(); }

document.getElementById("globalUploader").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  showToast("⏳ 正在极速上传到空间里...");
  const formData = new FormData(); formData.append("file", file);
  try {
    const token = getAuthToken();
    const res = await fetch(`/api/love/upload?auth=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "x-admin-auth": token, "Authorization": `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success && data.url) {
      const targetInput = document.getElementById(activeUploadInputId);
      if (targetInput) {
        targetInput.value = data.url;
        targetInput.dispatchEvent(new Event("input"));
      }
      if (activeUploadCallback) activeUploadCallback(data.url);
      if (activeUploadInputId === "theme_customBgUrlBoy" && currentConfig) {
        if (!currentConfig.theme) currentConfig.theme = {};
        currentConfig.theme.customBgUrlBoy = data.url;
      }
      if (activeUploadInputId === "theme_customBgUrlGirl" && currentConfig) {
        if (!currentConfig.theme) currentConfig.theme = {};
        currentConfig.theme.customBgUrlGirl = data.url;
      }
      showToast("✓ 上传成功！直链已自动填入");
    } else {
      alert("❌ 上传失败");
    }
  } catch (err) {
    alert("❌ 上传异常: " + err.message);
  } finally {
    e.target.value = "";
  }
});

async function saveAllConfigToCloud() {
  if (!currentConfig) return;
  currentConfig.adminSecurity = {
    password: document.getElementById("admin_customPassword").value.trim() || "521",
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

  (currentConfig.timeline || []).forEach((node, idx) => {
    node.date = document.getElementById(`tl_date_${idx}`)?.value;
    node.tag = document.getElementById(`tl_tag_${idx}`)?.value;
    node.title = document.getElementById(`tl_title_${idx}`)?.value;
    node.location = document.getElementById(`tl_loc_${idx}`)?.value;
    node.desc = document.getElementById(`tl_desc_${idx}`)?.value;
    node.backText = document.getElementById(`tl_back_${idx}`)?.value;
    node.frontImg = document.getElementById(`tl_img_${idx}`)?.value;
  });

  currentConfig.audio = {
    bgmAutoPlay: document.getElementById("audio_bgmAutoPlay").value === "true",
    bgmTitle: document.getElementById("audio_bgmTitle").value.trim(),
    bgmArtist: document.getElementById("audio_bgmArtist").value.trim(),
    bgmUrl: document.getElementById("audio_bgmUrl").value.trim(),
    vinylCover: document.getElementById("audio_vinylCover").value.trim()
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
      localStorage.setItem("love_admin_token", currentConfig.adminSecurity.password);
      showToast("✨ 全部配置与单曲 BGM 已成功发布！");
    } else {
      alert("❌ 保存失败: " + (data.error || "未授权"));
    }
  } catch (err) {
    alert("❌ 保存失败: " + err.message);
  }
}

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

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab)?.classList.add("active");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const cached = localStorage.getItem("love_admin_token");
  if (cached) {
    document.getElementById("adminPwdInput").value = cached;
    currentAdminToken = cached;
    verifyAdminLogin();
  }
});
