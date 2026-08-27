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
      headers: {
        "x-admin-auth": token,
        "Authorization": `Bearer ${token}`
      }
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
  document.getElementById("gatekeeper_voiceVows").value = gate.voiceVows || "众水不能熄灭, 我愿一生包容你, 永远爱你, 240520";
  document.getElementById("gatekeeper_errorTips").value = (gate.errorTips || []).join("\n");

  const letter = currentConfig.letter || {};
  document.getElementById("letter_title").value = letter.title || "";
  document.getElementById("letter_signDate").value = letter.signDate || "";
  document.getElementById("letter_signature").value = letter.signature || "";
  document.getElementById("letter_content").value = letter.content || "";

  renderTimelineList();
  renderChecklist();
  renderScratchCards();
  renderPlaylist();

  const audio = currentConfig.audio || {};
  document.getElementById("audio_bgmAutoPlay").value = String(audio.bgmAutoPlay !== false);

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

function renderPlaylist() {
  const container = document.getElementById("playlistContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!currentConfig.audio) currentConfig.audio = {};
  if (!Array.isArray(currentConfig.audio.playlist) || currentConfig.audio.playlist.length === 0) {
    currentConfig.audio.playlist = [
      {
        title: "告白气球 (浪漫钢琴版)",
        artist: "周杰伦 / 纯音乐",
        url: "https://music.163.com/song/media/outer/url?id=440208476.mp3",
        cover: ""
      },
      {
        title: "晴天 (唯美吉他版)",
        artist: "周杰伦 / 纯音乐",
        url: "https://music.163.com/song/media/outer/url?id=461520146.mp3",
        cover: ""
      }
    ];
  }

  currentConfig.audio.playlist.forEach((track, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header">
        <span class="item-card-title">🎵 曲目 #${idx + 1} - ${escapeHtml(track.title || "未命名歌曲")}</span>
        <button class="btn-del" onclick="deletePlaylistItem(${idx})">🗑️ 删除</button>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>歌曲名称</label><input type="text" class="admin-input" id="pl_title_${idx}" value="${escapeHtml(track.title || "")}" oninput="currentConfig.audio.playlist[${idx}].title=this.value"></div>
        <div class="form-group"><label>演唱歌手 / 艺术家</label><input type="text" class="admin-input" id="pl_artist_${idx}" value="${escapeHtml(track.artist || "")}" oninput="currentConfig.audio.playlist[${idx}].artist=this.value"></div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label>音频直链地址</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="audio_track_url_${idx}" value="${escapeHtml(track.url || "")}" oninput="currentConfig.audio.playlist[${idx}].url=this.value">
            <button class="btn-upload" onclick="triggerDirectUpload('audio_track_url_${idx}', 'audio/*', (url)=>{ currentConfig.audio.playlist[${idx}].url=url; })">📤 上传MP3</button>
          </div>
        </div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label>黑胶中心封面图片链接 (可选 · 留空显示 ❤️)</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="audio_track_cov_${idx}" value="${escapeHtml(track.cover || "")}" oninput="currentConfig.audio.playlist[${idx}].cover=this.value">
            <button class="btn-upload" onclick="triggerDirectUpload('audio_track_cov_${idx}', 'image/*', (url)=>{ currentConfig.audio.playlist[${idx}].cover=url; })">🖼️ 上传封面</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addPlaylistItem() {
  if (!currentConfig.audio) currentConfig.audio = {};
  if (!Array.isArray(currentConfig.audio.playlist)) currentConfig.audio.playlist = [];

  currentConfig.audio.playlist.push({
    title: "告白气球 (浪漫钢琴版)",
    artist: "周杰伦 / 纯音乐",
    url: "https://music.163.com/song/media/outer/url?id=440208476.mp3",
    cover: ""
  });
  renderPlaylist();
}

function deletePlaylistItem(idx) {
  if (currentConfig.audio.playlist.length <= 1) {
    return alert("⚠️ 歌单中请至少保留一首背景音乐！");
  }
  if (confirm("确定从黑胶歌单中删除该曲目吗？")) {
    currentConfig.audio.playlist.splice(idx, 1);
    renderPlaylist();
  }
}

function addSongToPlaylist(title, artist, url) {
  if (!currentConfig.audio) currentConfig.audio = {};
  if (!Array.isArray(currentConfig.audio.playlist)) currentConfig.audio.playlist = [];

  currentConfig.audio.playlist.push({
    title: title || "浪漫心动曲",
    artist: artist || "群星",
    url: url || "https://music.163.com/song/media/outer/url?id=440208476.mp3",
    cover: ""
  });
  renderPlaylist();
  showToast(`✓ 已将【${title}】加入歌单，请点击右上角【💾 立即发布生效】！`);
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
        <div 
          class="theme-card ${isSel ? 'theme-card--selected' : ''}" 
          onclick="selectBoyTheme('${item.id}')"
          style="
            background: ${isSel ? 'rgba(56, 189, 248, 0.22)' : 'rgba(3, 7, 18, 0.6)'};
            border: 1.5px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.1)'};
            box-shadow: ${isSel ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none'};
            border-radius: 14px; padding: 14px; cursor: pointer; transition: all 0.2s;
            display: flex; flex-direction: column; justify-content: space-between;
          "
        >
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:14px; font-weight:900; color:#fff;">${item.name}</span>
              <span style="font-size:10px; font-weight:800; background:rgba(255,255,255,0.1); color:#7dd3fc; padding:2px 6px; border-radius:10px;">${item.tag}</span>
            </div>
            <p style="font-size:11.5px; color:#94a3b8; line-height:1.4; margin-bottom:10px;">${item.desc}</p>
          </div>
          <div style="font-size:11.5px; font-weight:800; color:${isSel ? '#38bdf8' : '#64748b'}; text-align:right;">
            ${isSel ? '✓ 当前选定' : '点击选定'}
          </div>
        </div>
      `;
    }).join("");
  }

  if (girlBox) {
    girlBox.innerHTML = presets.girl.map(item => {
      const isSel = item.id === curGirl;
      return `
        <div 
          class="theme-card ${isSel ? 'theme-card--selected' : ''}" 
          onclick="selectGirlTheme('${item.id}')"
          style="
            background: ${isSel ? 'rgba(244, 114, 182, 0.22)' : 'rgba(3, 7, 18, 0.6)'};
            border: 1.5px solid ${isSel ? '#f472b6' : 'rgba(255,255,255,0.1)'};
            box-shadow: ${isSel ? '0 0 16px rgba(244, 114, 182, 0.35)' : 'none'};
            border-radius: 14px; padding: 14px; cursor: pointer; transition: all 0.2s;
            display: flex; flex-direction: column; justify-content: space-between;
          "
        >
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:14px; font-weight:900; color:#fff;">${item.name}</span>
              <span style="font-size:10px; font-weight:800; background:rgba(255,255,255,0.1); color:#fbcfe8; padding:2px 6px; border-radius:10px;">${item.tag}</span>
            </div>
            <p style="font-size:11.5px; color:#94a3b8; line-height:1.4; margin-bottom:10px;">${item.desc}</p>
          </div>
          <div style="font-size:11.5px; font-weight:800; color:${isSel ? '#f472b6' : '#64748b'}; text-align:right;">
            ${isSel ? '✓ 当前选定' : '点击选定'}
          </div>
        </div>
      `;
    }).join("");
  }

  const bgBoyInput = document.getElementById("theme_customBgUrlBoy");
  const bgGirlInput = document.getElementById("theme_customBgUrlGirl");
  if (bgBoyInput) bgBoyInput.value = currentConfig.theme?.customBgUrlBoy || currentConfig.theme?.customBgUrl || "";
  if (bgGirlInput) bgGirlInput.value = currentConfig.theme?.customBgUrlGirl || "";
}

function selectBoyTheme(themeId) {
  if (!currentConfig.theme) currentConfig.theme = {};
  currentConfig.theme.currentThemeBoy = themeId;
  currentConfig.theme.currentTheme = themeId;
  renderThemeShowroom();
  showToast(`✓ 已选定男生视角主题【${themeId}】`);
}

function selectGirlTheme(themeId) {
  if (!currentConfig.theme) currentConfig.theme = {};
  currentConfig.theme.currentThemeGirl = themeId;
  renderThemeShowroom();
  showToast(`✓ 已选定女生视角主题【${themeId}】`);
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
            <button class="btn-tool" style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color:#fff; padding:5px 12px; font-size:11.5px;" onclick="addSongToPlaylist('${escapeHtml(song.title)}', '${escapeHtml(song.artist)}', '${song.url}')">➕ 加入歌单</button>
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

// 试听引擎（同步直出，绝不弹窗拦截）
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

  currentPreviewBtnId = btnId;
  if (currentBtn) currentBtn.textContent = "⏳ 播放中";

  previewAudioObj = new Audio(url);
  previewAudioObj.play().then(() => {
    if (currentBtn) currentBtn.textContent = "⏸️ 暂停";
    showToast("🎵 正在流畅试听曲目...");
  }).catch(() => {
    // 自动无感降级备用源播放
    previewAudioObj.src = "https://music.163.com/song/media/outer/url?id=440208476.mp3";
    previewAudioObj.play().then(() => {
      if (currentBtn) currentBtn.textContent = "⏸️ 暂停";
      showToast("🎵 正在播放浪漫钢琴版试听");
    }).catch(() => {
      if (currentBtn) currentBtn.textContent = "🎧 试听";
    });
  });

  previewAudioObj.onended = () => {
    if (currentBtn) currentBtn.textContent = "🎧 试听";
  };
}

async function cleanOrphanR2Cache() {
  if (!confirm("⚠️ 确定要清理当前站点存储中未引用的废弃照片与音频吗？")) return;
  showToast("⏳ 正在扫描并清理当前域名孤立文件...");

  const token = getAuthToken();
  try {
    const res = await fetch(`/api/love/cleanup?auth=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: {
        "x-admin-auth": token,
        "Authorization": `Bearer ${token}`
      }
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
  if (!container) return;
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
        <div class="form-group"><label>日期 (如: 2024.05.20)</label><input type="text" class="admin-input" id="tl_date_${idx}" value="${escapeHtml(item.date || "")}" oninput="currentConfig.timeline[${idx}].date=this.value"></div>
        <div class="form-group"><label>标签 (如: 初遇心动)</label><input type="text" class="admin-input" id="tl_tag_${idx}" value="${escapeHtml(item.tag || "")}" oninput="currentConfig.timeline[${idx}].tag=this.value"></div>
        <div class="form-group"><label>故事标题</label><input type="text" class="admin-input" id="tl_title_${idx}" value="${escapeHtml(item.title || "")}" oninput="currentConfig.timeline[${idx}].title=this.value"></div>
        <div class="form-group"><label>地点 (如: 📍 晴天咖啡馆)</label><input type="text" class="admin-input" id="tl_loc_${idx}" value="${escapeHtml(item.location || "")}" oninput="currentConfig.timeline[${idx}].location=this.value"></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>正面故事描述</label><textarea class="admin-textarea" id="tl_desc_${idx}" rows="2" oninput="currentConfig.timeline[${idx}].desc=this.value">${escapeHtml(item.desc || "")}</textarea></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>背面私语留言</label><textarea class="admin-textarea" id="tl_back_${idx}" rows="2" oninput="currentConfig.timeline[${idx}].backText=this.value">${escapeHtml(item.backText || "")}</textarea></div>
        <div class="form-group">
          <label>拍立得正面照片链接</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="tl_img_${idx}" value="${escapeHtml(item.frontImg || "")}" oninput="currentConfig.timeline[${idx}].frontImg=this.value">
            <button class="btn-upload" onclick="triggerDirectUpload('tl_img_${idx}', 'image/*', (url)=>{ currentConfig.timeline[${idx}].frontImg=url; })">🖼️ 上传照片</button>
          </div>
        </div>
        <div class="form-group">
          <label>专属录音音频链接 (可选)</label>
          <div class="upload-input-group">
            <input type="text" class="admin-input" id="tl_voice_${idx}" value="${escapeHtml(item.voiceAudio || "")}" oninput="currentConfig.timeline[${idx}].voiceAudio=this.value">
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
  if (!container) return;
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
          <input type="text" class="admin-input" value="${escapeHtml(item.title || "")}" oninput="currentConfig.checklist100[${idx}].title=this.value">
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
  if (!container) return;
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
          <input type="text" class="admin-input" value="${escapeHtml(item.icon || "🎁")}" oninput="currentConfig.scratchCards[${idx}].icon=this.value">
        </div>
        <div class="form-group">
          <label>特权券名称</label>
          <input type="text" class="admin-input" value="${escapeHtml(item.title || "")}" oninput="currentConfig.scratchCards[${idx}].title=this.value">
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
          <textarea class="admin-textarea" rows="2" oninput="currentConfig.scratchCards[${idx}].content=this.value">${escapeHtml(item.content || "")}</textarea>
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

  showToast("⏳ 正在极速上传到空间里...");
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();

  try {
    const res = await fetch(`/api/love/upload?auth=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: {
        "x-admin-auth": token,
        "Authorization": `Bearer ${token}`
      },
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
        activeUploadCallback(data.url);
      }
      if (activeUploadInputId === "theme_customBgUrlBoy" && currentConfig) {
        if (!currentConfig.theme) currentConfig.theme = {};
        currentConfig.theme.customBgUrlBoy = data.url;
      }
      if (activeUploadInputId === "theme_customBgUrlGirl" && currentConfig) {
        if (!currentConfig.theme) currentConfig.theme = {};
        currentConfig.theme.customBgUrlGirl = data.url;
      }
      showToast("✓ 上传成功！直链已自动填入，请记得点击右上角【💾 立即发布生效】保存");
    } else {
      alert("❌ 上传失败: " + (data.error || "未授权或接口异常"));
    }
  } catch (err) {
    alert("❌ 上传异常: " + err.message);
  } finally {
    e.target.value = "";
  }
});

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
    voiceVows: document.getElementById("gatekeeper_voiceVows").value.trim() || "众水不能熄灭, 我愿一生包容你, 永远爱你, 240520",
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
    playlist: currentConfig.audio?.playlist || []
  };

  currentConfig.easterEggs = [
    { id: "egg_1", selector: "#egg-star", message: document.getElementById("egg_1_message").value.trim() },
    { id: "egg_2", selector: "#egg-paw", message: document.getElementById("egg_2_message").value.trim() }
  ];

  currentConfig.theme = {
    ...(currentConfig.theme || {}),
    currentThemeBoy: currentConfig.theme?.currentThemeBoy || currentConfig.theme?.currentTheme || "sunset-twilight",
    currentThemeGirl: currentConfig.theme?.currentThemeGirl || "french-cream",
    customBgUrlBoy: document.getElementById("theme_customBgUrlBoy") ? document.getElementById("theme_customBgUrlBoy").value.trim() : "",
    customBgUrlGirl: document.getElementById("theme_customBgUrlGirl") ? document.getElementById("theme_customBgUrlGirl").value.trim() : ""
  };

  const timelineNodes = currentConfig.timeline || [];
  timelineNodes.forEach((node, idx) => {
    const d = document.getElementById(`tl_date_${idx}`);
    const t = document.getElementById(`tl_tag_${idx}`);
    const tit = document.getElementById(`tl_title_${idx}`);
    const loc = document.getElementById(`tl_loc_${idx}`);
    const de = document.getElementById(`tl_desc_${idx}`);
    const bk = document.getElementById(`tl_back_${idx}`);
    const img = document.getElementById(`tl_img_${idx}`);
    const voi = document.getElementById(`tl_voice_${idx}`);

    if (d) node.date = d.value;
    if (t) node.tag = t.value;
    if (tit) node.title = tit.value;
    if (loc) node.location = loc.value;
    if (de) node.desc = de.value;
    if (bk) node.backText = bk.value;
    if (img) node.frontImg = img.value;
    if (voi) node.voiceAudio = voi.value;
  });

  const playlistTracks = currentConfig.audio.playlist || [];
  playlistTracks.forEach((track, idx) => {
    const pt = document.getElementById(`pl_title_${idx}`);
    const pa = document.getElementById(`pl_artist_${idx}`);
    const pu = document.getElementById(`audio_track_url_${idx}`);
    const pc = document.getElementById(`audio_track_cov_${idx}`);

    if (pt) track.title = pt.value;
    if (pa) track.artist = pa.value;
    if (pu) track.url = pu.value;
    if (pc) track.cover = pc.value;
  });

  showToast("⏳ 正在发布到独立存储空间...");
  const token = getAuthToken();

  try {
    const res = await fetch(`/api/love/config?auth=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-auth": token,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ config: currentConfig })
    });
    const data = await res.json();

    if (data.success) {
      currentAdminToken = customPwd || "521";
      localStorage.setItem("love_admin_token", currentAdminToken);
      showToast("✨ 全部配置、照片与黑胶歌单已成功持久化发布！");
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
    const input = document.getElementById("adminPwdInput");
    if (input) input.value = cached;
    currentAdminToken = cached;
    verifyAdminLogin();
  }
});
