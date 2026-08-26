/**
 * 太阳 ios-IP · 漫游宇宙控制中心驱动逻辑
 * 文件名: js/admin.js
 */

let currentConfig = null;
let currentAdminToken = "";

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// 1. 验证管理员口令
async function verifyAdminLogin() {
  const pwdInput = document.getElementById("adminPwdInput");
  const pwd = pwdInput.value.trim();
  if (!pwd) return alert("请输入管理员口令！");

  currentAdminToken = pwd;
  localStorage.setItem("love_admin_token", pwd);

  // 尝试拉取配置
  const success = await fetchConfigFromCloud();
  if (success) {
    document.getElementById("authModal").style.display = "none";
    document.getElementById("adminLayout").style.display = "block";
    showToast("✓ 验证成功，已加载配置");
  } else {
    alert("❌ 口令错误或无法连接云端！");
  }
}

// 2. 从 R2 云端拉取配置 (若无则使用本地默认配置)
async function fetchConfigFromCloud() {
  try {
    const res = await fetch("/api/love/config", {
      headers: { "x-admin-auth": currentAdminToken }
    });
    const data = await res.json();

    if (data.success) {
      if (data.custom && data.config) {
        currentConfig = data.config;
      } else {
        // 使用 window.LOVE_CONFIG 兜底
        currentConfig = JSON.parse(JSON.stringify(window.LOVE_CONFIG || {}));
      }
      renderAllForms();
      return true;
    }
    return false;
  } catch (e) {
    currentConfig = JSON.parse(JSON.stringify(window.LOVE_CONFIG || {}));
    renderAllForms();
    return true;
  }
}

// 3. 渲染所有 8 大模块表单数据
function renderAllForms() {
  if (!currentConfig) return;

  // 1. 基础档案
  const meta = currentConfig.meta || {};
  document.getElementById("meta_boyName").value = meta.boyName || "";
  document.getElementById("meta_girlName").value = meta.girlName || "";
  document.getElementById("meta_startDate").value = meta.startDate || "";
  document.getElementById("meta_nextMilestoneTitle").value = meta.nextMilestoneTitle || "";
  document.getElementById("meta_nextMilestoneDate").value = meta.nextMilestoneDate || "";
  document.getElementById("meta_siteTitle").value = meta.siteTitle || "";
  document.getElementById("meta_siteSubtitle").value = meta.siteSubtitle || "";

  // 2. 门禁
  const gate = currentConfig.gatekeeper || {};
  document.getElementById("gatekeeper_enabled").value = String(gate.enabled !== false);
  document.getElementById("gatekeeper_title").value = gate.title || "";
  document.getElementById("gatekeeper_question").value = gate.question || "";
  document.getElementById("gatekeeper_hint").value = gate.hint || "";
  document.getElementById("gatekeeper_correctAnswer").value = gate.correctAnswer || "";
  document.getElementById("gatekeeper_errorTips").value = (gate.errorTips || []).join("\n");

  // 3. 告白信
  const letter = currentConfig.letter || {};
  document.getElementById("letter_title").value = letter.title || "";
  document.getElementById("letter_signDate").value = letter.signDate || "";
  document.getElementById("letter_signature").value = letter.signature || "";
  document.getElementById("letter_content").value = letter.content || "";

  // 4. 时光轴
  renderTimelineList();

  // 5. 100 件事
  renderChecklist();

  // 6. 刮刮乐
  renderScratchCards();

  // 7. 音乐
  const audio = currentConfig.audio || {};
  document.getElementById("audio_bgmAutoPlay").value = String(audio.bgmAutoPlay === true);
  document.getElementById("audio_bgmTitle").value = audio.bgmTitle || "";
  document.getElementById("audio_bgmArtist").value = audio.bgmArtist || "";
  document.getElementById("audio_bgmUrl").value = audio.bgmUrl || "";
  document.getElementById("audio_vinylCover").value = audio.vinylCover || "";

  // 8. 彩蛋
  const eggs = currentConfig.easterEggs || [];
  document.getElementById("egg_1_message").value = eggs[0]?.message || "";
  document.getElementById("egg_2_message").value = eggs[1]?.message || "";
}

// ================= 动态列表渲染与操作 =================

// 4. 时光轴渲染
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
        <div class="form-group"><label>日期 (如: 2024.05.20)</label><input type="text" class="admin-input tl-date" value="${escapeHtml(item.date || "")}" onchange="currentConfig.timeline[${idx}].date=this.value"></div>
        <div class="form-group"><label>标签 (如: 初遇心动)</label><input type="text" class="admin-input tl-tag" value="${escapeHtml(item.tag || "")}" onchange="currentConfig.timeline[${idx}].tag=this.value"></div>
        <div class="form-group"><label>故事标题</label><input type="text" class="admin-input tl-title" value="${escapeHtml(item.title || "")}" onchange="currentConfig.timeline[${idx}].title=this.value"></div>
        <div class="form-group"><label>地点 (如: 📍 晴天咖啡馆)</label><input type="text" class="admin-input tl-loc" value="${escapeHtml(item.location || "")}" onchange="currentConfig.timeline[${idx}].location=this.value"></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>正面描述故事</label><textarea class="admin-textarea tl-desc" rows="2" onchange="currentConfig.timeline[${idx}].desc=this.value">${escapeHtml(item.desc || "")}</textarea></div>
        <div class="form-group" style="grid-column: 1 / -1;"><label>背面手写私语留言</label><textarea class="admin-textarea tl-backText" rows="2" onchange="currentConfig.timeline[${idx}].backText=this.value">${escapeHtml(item.backText || "")}</textarea></div>
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

// 5. 恋爱 100 件事渲染
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
          <label>默认完成状态</label>
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
  currentConfig.checklist100.push({ id: nextId, title: "一起去做一件浪漫的事", completed: false });
  renderChecklist();
}

function deleteChecklistItem(idx) {
  currentConfig.checklist100.splice(idx, 1);
  renderChecklist();
}

// 6. 刮刮乐卡券渲染
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
          <label>特权卡券名称</label>
          <input type="text" class="admin-input" value="${escapeHtml(item.title || "")}" onchange="currentConfig.scratchCards[${idx}].title=this.value">
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
    title: "专属心愿特权卡",
    content: "持此卡可无条件兑换一次专属愿望！",
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

// ================= 文件直传 R2 引擎 =================
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

  showToast("⏳ 正在流式上传到 R2 存储桶...");

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
      showToast("✓ 上传成功并已填入链接");
    } else {
      alert("❌ 上传失败: " + (data.error || "接口异常"));
    }
  } catch (err) {
    alert("❌ 上传异常: " + err.message);
  } finally {
    e.target.value = "";
  }
});

// ================= 收集并保存全站配置 =================
async function saveAllConfigToCloud() {
  if (!currentConfig) return;

  // 1. 收集 Meta
  currentConfig.meta = {
    boyName: document.getElementById("meta_boyName").value.trim(),
    girlName: document.getElementById("meta_girlName").value.trim(),
    startDate: document.getElementById("meta_startDate").value.trim(),
    nextMilestoneTitle: document.getElementById("meta_nextMilestoneTitle").value.trim(),
    nextMilestoneDate: document.getElementById("meta_nextMilestoneDate").value.trim(),
    siteTitle: document.getElementById("meta_siteTitle").value.trim(),
    siteSubtitle: document.getElementById("meta_siteSubtitle").value.trim()
  };

  // 2. 收集 Gatekeeper
  const errorTipsRaw = document.getElementById("gatekeeper_errorTips").value.split("\n").map(s => s.trim()).filter(Boolean);
  currentConfig.gatekeeper = {
    enabled: document.getElementById("gatekeeper_enabled").value === "true",
    title: document.getElementById("gatekeeper_title").value.trim(),
    question: document.getElementById("gatekeeper_question").value.trim(),
    hint: document.getElementById("gatekeeper_hint").value.trim(),
    correctAnswer: document.getElementById("gatekeeper_correctAnswer").value.trim(),
    errorTips: errorTipsRaw.length > 0 ? errorTipsRaw : ["不对哦，再想想！"]
  };

  // 3. 收集 Letter
  currentConfig.letter = {
    title: document.getElementById("letter_title").value.trim(),
    signDate: document.getElementById("letter_signDate").value.trim(),
    signature: document.getElementById("letter_signature").value.trim(),
    content: document.getElementById("letter_content").value.trim()
  };

  // 4. 收集 Audio
  currentConfig.audio = {
    ...(currentConfig.audio || {}),
    bgmAutoPlay: document.getElementById("audio_bgmAutoPlay").value === "true",
    bgmTitle: document.getElementById("audio_bgmTitle").value.trim(),
    bgmArtist: document.getElementById("audio_bgmArtist").value.trim(),
    bgmUrl: document.getElementById("audio_bgmUrl").value.trim(),
    vinylCover: document.getElementById("audio_vinylCover").value.trim()
  };

  // 5. 收集 Easter Eggs
  currentConfig.easterEggs = [
    { id: "egg_1", selector: "#egg-star", message: document.getElementById("egg_1_message").value.trim() },
    { id: "egg_2", selector: "#egg-paw", message: document.getElementById("egg_2_message").value.trim() }
  ];

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
      showToast("✨ 全部配置已成功发布！前台已即时生效");
    } else {
      alert("❌ 保存失败: " + (data.error || "未授权"));
    }
  } catch (err) {
    alert("❌ 保存失败: " + err.message);
  }
}

// 备份与导入
function exportBackupJSON() {
  if (!currentConfig) return;
  const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentConfig, null, 2));
  const a = document.createElement("a");
  a.href = str;
  a.download = `漫游宇宙配置备份_${Date.now()}.json`;
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

// 选项卡切换
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add("active");
  });
});

// 自动检测本地缓存口令
document.addEventListener("DOMContentLoaded", () => {
  const cached = localStorage.getItem("love_admin_token");
  if (cached) {
    document.getElementById("adminPwdInput").value = cached;
  }
});
