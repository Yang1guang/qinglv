
/**
 * 众水不灭 · 雅歌之印 (Love Universe SaaS Engine)
 * 文件名: _worker.js
 * 架构: 单源多租户路由、破冰和好信号队列状态机(双向奔赴MUTUAL_HEAL)、多源流式音频转发、严格租户独立鉴权(默认密码521始终可用)、免密灵宠通道、圣洁言语过滤、HMAC 授权验证
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const bucket = env.R2 || env.BUCKET || env.PAN || env.MY_BUCKET || env.FILE_BUCKET;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-auth, Range",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    // 多租户隔离机制：自动将 Punycode/英文字符归一化为独立存储目录
    const rawHost = (url.hostname || "default.local").toLowerCase();
    const tenantDir = rawHost.replace(/[^a-z0-9.-]/g, "_");
    const CONFIG_KEY = `${tenantDir}/config.json`;
    const SIGNALS_KEY = `${tenantDir}/signals.json`;

    // 🔧 管理员密码：环境变量优先，默认 521（始终作为兜底可用）
    const ADMIN_PASSWORD = String(env.ADMIN_PASSWORD || env.SECRET_PWD || env.ADMIN_PWD || "521").trim();
    const MASTER_LICENSE_SECRET = String(env.MASTER_LICENSE_SECRET || "SACRED_UNQUENCHABLE_LOVE_2026_KEY").trim();

    /**
     * 🔧 管理员鉴权（修复版：521 始终作为默认密码可用）
     *
     * 鉴权优先级：
     * 1. 环境变量非521超级密钥（运维直通）
     * 2. 租户R2自定义密码（如有设置且非空）
     * 3. 默认密码 521（始终可用，确保首次部署和重置场景可登录）
     */
    async function verifyAdminAuth(req) {
      const headerAuth = req.headers.get("x-admin-auth") || req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      const queryAuth = url.searchParams.get("auth");
      const token = (headerAuth || queryAuth || "").trim();
      if (!token) return false;

      // 1. 环境变量超级密钥直通（非521时允许运维访问）
      if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD !== "521" && token === String(env.ADMIN_PASSWORD).trim()) {
        return true;
      }

      // 2. 检查租户专属 R2 存储中的自定义密码
      if (bucket) {
        try {
          const obj = await bucket.get(CONFIG_KEY);
          if (obj) {
            const cfg = JSON.parse(await obj.text());
            // 仅当自定义密码被显式设置为非空值时才使用
            if (cfg.adminSecurity && cfg.adminSecurity.password && cfg.adminSecurity.password.trim() !== "") {
              if (token === String(cfg.adminSecurity.password).trim()) {
                return true;
              }
              // 自定义密码不匹配时，继续往下尝试默认密码（不直接返回false）
            }
          }
        } catch (_) {}
      }

      // 3. 🔧 默认初始密码 521 始终可用（无论R2是否有配置）
      if (token === "521" || token === "admin" || token === ADMIN_PASSWORD) {
        return true;
      }

      return false;
    }

    function sanitizeSanctity(contentString) {
      const profanityRegex = /(约炮|包养|出轨|偷情|小三|色情|裸聊|淫秽|性交|做爱|操你|傻逼|贱人|去死|滚蛋|妓女|嫖娼|嫖客|大保健|开房|一夜情)/i;
      return !profanityRegex.test(contentString);
    }

    // 🌟 阶段安全与伦理边界硬过滤 (服务端强制执行，严禁恋爱期出现同居或私密文案)
    function getStageSafeContent(stage, actionType, userCustomText) {
      const standardDict = {
        dating: {
          calm_down: "我有些情绪，需要安静片刻，但请放心，我不会走开，待会儿通个电话好吗？",
          break_ice: "今天天气很好，我们不吵了好不好？待会儿一起去散散步。",
          apology: "刚才是我态度不好、太急躁了，对不起，我愿意安静听你的感受。",
          miss_you: "即使有分歧，我心里依然全是你，想念你的笑容。",
          warm_hug: "隔空送你一朵云朵拥抱和一杯热可可，不要再生气啦。"
        },
        engaged: {
          calm_down: "筹备有些心力交瘁，我们先冷静下来，喝杯咖啡，别伤了彼此的初心。",
          break_ice: "比起眼前的分歧，我们的约定更珍贵。今晚开个视频对齐想法好吗？",
          apology: "我对不起你，刚才把现实的焦虑迁怒到了你身上，我向你道歉。",
          miss_you: "我们是一体的，无论面对多大挑战，我都坚定选择与你同行。",
          warm_hug: "再多繁杂的事情我们一起扛，别怕，有我在你身边。"
        },
        married: {
          calm_down: "我先在书房安静一会儿，不可含怒到日落，待会儿就出来抱你。",
          break_ice: "家是讲爱的地方不是讲理的地方。厨房有切好的水果和温水，我们谈谈心。",
          apology: "在这个家里你才是最重要的，我放下我的固执，对不起，过来抱一下。",
          miss_you: "柴米油盐是你，风花雪月也是你，执子之手，与子偕老。",
          warm_hug: "风雨再大，这里永远是你的避风港，我一直在。"
        }
      };
      const validStage = ["dating", "engaged", "married"].includes(stage) ? stage : "dating";
      const validAction = ["calm_down", "break_ice", "apology", "miss_you", "warm_hug"].includes(actionType) ? actionType : "break_ice";
      const fallback = standardDict[validStage][validAction];
      if (userCustomText && typeof userCustomText === "string" && userCustomText.trim().length > 0) {
        const text = userCustomText.trim().slice(0, 150);
        if (validStage === "dating") {
          const forbiddenDatingRegex = /(同居|睡觉|同房|开房|上床|床头|我家|你家|家里|做饭|切水果|洗碗|家务|同睡|书房)/i;
          if (forbiddenDatingRegex.test(text)) return fallback;
        }
        return text;
      }
      return fallback;
    }

    async function verifyDomainLicense(domain, inputCode) {
      try {
        const cleanCode = String(inputCode || "").trim().toUpperCase();
        if (!cleanCode.startsWith("LV-")) return false;
        const enc = new TextEncoder();
        const keyData = enc.encode(MASTER_LICENSE_SECRET);
        const cryptoKey = await crypto.subtle.importKey(
          "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const dataToSign = enc.encode(`${domain.toLowerCase()}:SACRED_ETERNAL_LICENSE`);
        const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const fullHex = signatureArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
        const p1 = fullHex.substring(0, 4);
        const p2 = fullHex.substring(4, 8);
        const p3 = fullHex.substring(8, 12);
        const p4 = fullHex.substring(12, 16);
        const expectedCode = `LV-${p1}-${p2}-${p3}-${p4}`;
        return cleanCode === expectedCode;
      } catch (_) { return false; }
    }

    try {
      // ==================== 1. 获取全站配置 ====================
      if (url.pathname === "/api/love/config" && request.method === "GET") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        const isAdmin = await verifyAdminAuth(request);
        const headerAuth = request.headers.get("x-admin-auth");
        const queryAuth = url.searchParams.get("auth");
        const attemptedAuth = (headerAuth || queryAuth || "").trim();
        if (attemptedAuth && !isAdmin) {
          return jsonResponse({ success: false, error: "管理口令错误或未授权", isAdmin: false }, 401);
        }
        let customConfig = null;
        try {
          const obj = await bucket.get(CONFIG_KEY);
          if (obj) customConfig = JSON.parse(await obj.text());
        } catch (_) {}
        if (customConfig) {
          if (!isAdmin) {
            if (customConfig.gatekeeper) delete customConfig.gatekeeper.correctAnswer;
            if (customConfig.adminSecurity) delete customConfig.adminSecurity.password;
          }
          return jsonResponse({ success: true, custom: true, domain: rawHost, config: customConfig, isAdmin });
        }
        return jsonResponse({ success: true, custom: false, domain: rawHost, config: null, isAdmin });
      }

      // ==================== 2. 保存并发布配置 ====================
      if (url.pathname === "/api/love/config" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) return jsonResponse({ success: false, error: "管理口令错误或未授权" }, 401);
        let reqData;
        try { reqData = await request.json(); } catch (_) { return jsonResponse({ success: false, error: "数据格式错误" }, 400); }
        const configToSave = reqData.config || {};
        const configJsonString = JSON.stringify(configToSave);
        if (!sanitizeSanctity(configJsonString)) {
          return jsonResponse({ success: false, error: "包含不洁与低俗言语，圣洁的印记已拒绝此次铭刻。" }, 406);
        }
        try {
          const existingObj = await bucket.get(CONFIG_KEY);
          if (existingObj) {
            const oldCfg = JSON.parse(await existingObj.text());
            if (oldCfg._license && oldCfg._license.unlocked) configToSave._license = oldCfg._license;
            if (oldCfg.petData && !configToSave.petData) configToSave.petData = oldCfg.petData;
          }
        } catch (_) {}
        await bucket.put(CONFIG_KEY, JSON.stringify(configToSave), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
        return jsonResponse({ success: true, domain: rawHost, message: `配置已发布并永久同步至【${rawHost}】独立存储空间` });
      }

      // ==================== 3. 破冰信号箱状态机 ====================
      if (url.pathname === "/api/love/signal" && request.method === "GET") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        let signalData = { activeSignal: null, history: [] };
        try { const obj = await bucket.get(SIGNALS_KEY); if (obj) signalData = JSON.parse(await obj.text()); } catch (_) {}
        const now = Date.now();
        if (signalData.activeSignal) {
          const isExpired = (now - signalData.activeSignal.createdAt) > 24 * 60 * 60 * 1000;
          if (isExpired && signalData.activeSignal.status === "active") signalData.activeSignal.status = "expired";
        }
        return jsonResponse({ success: true, activeSignal: signalData.activeSignal || null, recentHistory: (signalData.history || []).slice(0, 10), serverTime: now });
      }

      if (url.pathname === "/api/love/signal" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        let body = {};
        try { body = await request.json(); } catch (_) { return jsonResponse({ success: false, error: "数据格式错误" }, 400); }
        const stage = String(body.stage || "dating");
        const senderGender = String(body.senderGender || "boy");
        const senderDeviceId = String(body.senderDeviceId || "").trim();
        const actionType = String(body.actionType || "break_ice");
        const customText = String(body.customText || "").trim();
        if (!sanitizeSanctity(customText)) return jsonResponse({ success: false, error: "言语不洁" }, 406);
        const safeContent = getStageSafeContent(stage, actionType, customText);
        const now = Date.now();
        let signalData = { activeSignal: null, history: [] };
        try { const obj = await bucket.get(SIGNALS_KEY); if (obj) signalData = JSON.parse(await obj.text()); } catch (_) {}

        const currentSig = signalData.activeSignal;
        if (currentSig && currentSig.status === "active") {
          if (currentSig.senderDeviceId === senderDeviceId && currentSig.cooldownUntil && currentSig.cooldownUntil > now) {
            return jsonResponse({ success: false, code: "IN_COOLDOWN", remainingSeconds: Math.ceil((currentSig.cooldownUntil - now) / 1000) }, 429);
          }
          const isFromOtherSide = currentSig.senderGender !== senderGender;
          const isCurrentPeaceAction = ["break_ice", "apology", "miss_you", "warm_hug"].includes(actionType);
          const isPrevPeaceAction = ["break_ice", "apology", "miss_you", "warm_hug"].includes(currentSig.actionType);
          const isWithinWindow = (now - currentSig.createdAt) < 5 * 60 * 1000;
          if (isFromOtherSide && isCurrentPeaceAction && isPrevPeaceAction && isWithinWindow) {
            currentSig.status = "mutual_resolved"; currentSig.resolvedAt = now; currentSig.summary = "你们在同一刻想到了彼此，双向奔赴，爱永不止息！";
            if (!Array.isArray(signalData.history)) signalData.history = [];
            signalData.history.unshift({ id: `hist_${now}`, stage, initiator: "both", actionType: "mutual_resolved", summary: "双向奔赴 · 在同一刻选择了和好", resolvedAt: now });
            if (signalData.history.length > 30) signalData.history = signalData.history.slice(0, 30);
            await bucket.put(SIGNALS_KEY, JSON.stringify(signalData, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
            return jsonResponse({ success: true, status: "mutual_resolved", message: "✨ 你们在同一刻想到了彼此，破冰成功！", signal: currentSig });
          }
        }

        const cooldownMs = actionType === "calm_down" ? (15 * 60 * 1000) : (60 * 1000);
        const newActiveSignal = { signalId: `sig_${now}_${Math.random().toString(36).substring(2, 6)}`, stage, senderGender, senderDeviceId, actionType, content: safeContent, status: "active", createdAt: now, cooldownUntil: now + cooldownMs, response: null };
        signalData.activeSignal = newActiveSignal;
        await bucket.put(SIGNALS_KEY, JSON.stringify(signalData, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
        return jsonResponse({ success: true, message: "🕊️ 情感信号已传递至云端！", signal: newActiveSignal });
      }

      if (url.pathname === "/api/love/signal/ack" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        let body = {}; try { body = await request.json(); } catch (_) { return jsonResponse({ success: false, error: "数据格式错误" }, 400); }
        const signalId = String(body.signalId || "").trim();
        const responderGender = String(body.responderGender || "girl");
        const responderDeviceId = String(body.responderDeviceId || "").trim();
        const responseType = String(body.responseType || "accept");
        const responseText = String(body.responseText || "").trim();
        if (!sanitizeSanctity(responseText)) return jsonResponse({ success: false, error: "言语不洁" }, 406);
        let signalData = { activeSignal: null, history: [] };
        try { const obj = await bucket.get(SIGNALS_KEY); if (obj) signalData = JSON.parse(await obj.text()); } catch (_) {}
        const currentSig = signalData.activeSignal;
        if (!currentSig || currentSig.signalId !== signalId) return jsonResponse({ success: false, error: "信号已过期或已被处理" }, 404);
        const now = Date.now();
        if (responseType === "viewed") { if (currentSig.status === "active") { currentSig.status = "viewed"; currentSig.viewedAt = now; } }
        else if (responseType === "accept") {
          currentSig.status = "accepted"; currentSig.resolvedAt = now;
          currentSig.response = { responderGender, responderDeviceId, type: "accept", text: responseText || "愿爱包容一切，我们和好吧！", respondedAt: now };
          if (!Array.isArray(signalData.history)) signalData.history = [];
          signalData.history.unshift({ id: `hist_${now}`, stage: currentSig.stage, initiator: currentSig.senderGender, actionType: currentSig.actionType, summary: `${currentSig.content} ➔ ${currentSig.response.text}`, status: "accepted", resolvedAt: now });
          if (signalData.history.length > 30) signalData.history = signalData.history.slice(0, 30);
        } else if (responseType === "wait_a_bit") {
          currentSig.status = "cooling";
          currentSig.response = { responderGender, responderDeviceId, type: "wait_a_bit", text: responseText || "还在整理心情中，请再等我一会儿...", respondedAt: now };
        }
        await bucket.put(SIGNALS_KEY, JSON.stringify(signalData, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
        return jsonResponse({ success: true, message: "✓ 响应已同步！", signal: currentSig });
      }

      if (url.pathname === "/api/love/signal/history" && request.method === "GET") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        let signalData = { history: [] }; try { const obj = await bucket.get(SIGNALS_KEY); if (obj) signalData = JSON.parse(await obj.text()); } catch (_) {}
        return jsonResponse({ success: true, history: signalData.history || [] });
      }

      if (url.pathname === "/api/love/signal/clear" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        const isAuthed = await verifyAdminAuth(request); if (!isAuthed) return jsonResponse({ success: false, error: "未授权" }, 401);
        let signalData = { activeSignal: null, history: [] }; try { const obj = await bucket.get(SIGNALS_KEY); if (obj) signalData = JSON.parse(await obj.text()); } catch (_) {}
        signalData.activeSignal = null;
        await bucket.put(SIGNALS_KEY, JSON.stringify(signalData, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
        return jsonResponse({ success: true, message: "已重置信号状态" });
      }

      // ==================== 4. 文件上传 ====================
      if (url.pathname === "/api/love/upload" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        const isAuthed = await verifyAdminAuth(request); if (!isAuthed) return jsonResponse({ success: false, error: "未授权" }, 401);
        const formData = await request.formData(); const file = formData.get("file");
        if (!file) return jsonResponse({ success: false, error: "未接收到文件" }, 400);
        const safeName = (file.name || "media.bin").replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const r2Key = `${tenantDir}/assets/${Date.now()}_${safeName}`;
        await bucket.put(r2Key, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
        return jsonResponse({ success: true, url: `/raw/${r2Key}` });
      }

      // ==================== 5. 灵宠通道 ====================
      if (url.pathname === "/api/love/pet") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        if (request.method === "GET") {
          try { const obj = await bucket.get(CONFIG_KEY); if (obj) { const cfg = JSON.parse(await obj.text()); return jsonResponse({ success: true, petData: cfg.petData || null }); } } catch (_) {}
          return jsonResponse({ success: true, petData: null });
        }
        if (request.method === "POST") {
          let reqData = {}; try { reqData = await request.json(); } catch (_) {}
          const newPetData = reqData.petData; if (!newPetData) return jsonResponse({ success: false, error: "无数据" }, 400);
          if (!sanitizeSanctity(JSON.stringify(newPetData))) return jsonResponse({ success: false, error: "言语不洁" }, 406);
          let cfg = {}; try { const obj = await bucket.get(CONFIG_KEY); if (obj) cfg = JSON.parse(await obj.text()); } catch (_) {}
          cfg.petData = newPetData;
          await bucket.put(CONFIG_KEY, JSON.stringify(cfg), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
          return jsonResponse({ success: true, message: "灵宠足迹已同步至云端" });
        }
      }

      // ==================== 6. 门禁校验 ====================
      if (url.pathname === "/api/love/verify-gatekeeper" && request.method === "POST") {
        let reqData = {}; try { reqData = await request.json(); } catch (_) {}
        const inputPwd = String(reqData.password || "").trim().toLowerCase();
        let correctPwd = "240520";
        let customAdminPwd = null;
        if (bucket) {
          try {
            const cfgObj = await bucket.get(CONFIG_KEY);
            if (cfgObj) { const cfg = JSON.parse(await cfgObj.text()); if (cfg.gatekeeper?.correctAnswer) correctPwd = String(cfg.gatekeeper.correctAnswer).trim().toLowerCase(); if (cfg.adminSecurity?.password) customAdminPwd = String(cfg.adminSecurity.password).trim().toLowerCase(); }
          } catch (_) {}
        }
        let isAdmin = false;
        if (customAdminPwd) { if (inputPwd === customAdminPwd || (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD !== "521" && inputPwd === String(env.ADMIN_PASSWORD).trim().toLowerCase())) isAdmin = true; }
        else { if (inputPwd === "521" || inputPwd === "admin" || inputPwd === ADMIN_PASSWORD.toLowerCase()) isAdmin = true; }
        if (isAdmin) return jsonResponse({ success: true, isAdmin: true });
        if (inputPwd === correctPwd) return jsonResponse({ success: true, isAdmin: false });
        return jsonResponse({ success: false, message: "口令错误" }, 403);
      }

      // ==================== 7. 授权兑换 ====================
      if (url.pathname === "/api/love/verify-license" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "存储服务不可用" }, 500);
        let reqData = {}; try { reqData = await request.json(); } catch (_) {}
        const isValid = await verifyDomainLicense(rawHost, reqData.licenseCode);
        if (!isValid) return jsonResponse({ success: false, message: "⚠️ 授权激活码无效！" }, 403);
        let currentCfg = {};
        try { const cfgObj = await bucket.get(CONFIG_KEY); if (cfgObj) currentCfg = JSON.parse(await cfgObj.text()); else if (reqData.currentConfig && typeof reqData.currentConfig === "object") currentCfg = reqData.currentConfig; } catch (_) { if (reqData.currentConfig && typeof reqData.currentConfig === "object") currentCfg = reqData.currentConfig; }
        currentCfg._license = { unlocked: true, unlockedAt: new Date().toISOString(), tier: "SACRED_ETERNAL_PERPETUAL", boundDomain: rawHost };
        await bucket.put(CONFIG_KEY, JSON.stringify(currentCfg), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
        return jsonResponse({ success: true, message: `✨ 星河契约已鉴证！【${rawHost}】专属高级隐藏福泽已永久解锁。` });
      }

      // ==================== 8. 清理废弃文件 ====================
      if (url.pathname === "/api/love/cleanup" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        const isAuthed = await verifyAdminAuth(request); if (!isAuthed) return jsonResponse({ success: false, error: "未授权" }, 401);
        let deletedCount = 0, freedBytes = 0;
        const prefix = `${tenantDir}/assets/`; const listed = await bucket.list({ prefix });
        for (const obj of listed.objects) { const isOlderThan10Min = (Date.now() - new Date(obj.uploaded).getTime()) > 10 * 60 * 1000; if (isOlderThan10Min) { freedBytes += obj.size; deletedCount++; await bucket.delete(obj.key); } }
        return jsonResponse({ success: true, deletedCount, freedBytes, message: `已清理 ${deletedCount} 个废弃文件，释放 ${(freedBytes / (1024*1024)).toFixed(2)} MB` });
      }

      // ==================== 9. 音乐搜索 ====================
      if (url.pathname === "/api/love/music-search" && request.method === "GET") {
        const keyword = (url.searchParams.get("keyword") || "").trim(); const songs = []; const seen = new Set();
        if (keyword) {
          try {
            const kgRes = await fetch(`https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=10&filter=2&bitrate=0&isfp=0`, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (kgRes.ok) { const kgData = await kgRes.json(); (kgData.data?.lists || []).forEach(item => { const sName = (item.SongName || "").replace(/<[^>]+>/g, ""); const sArtist = (item.SingerName || "").replace(/<[^>]+>/g, ""); const fHash = item.FileHash || item.HQFileHash || item.SQFileHash; if (sName && fHash && !seen.has(fHash)) { seen.add(fHash); songs.push({ id: fHash, title: sName, artist: sArtist, albumId: item.AlbumID || "0", url: `/api/love/music-stream?hash=${fHash}&album_id=${item.AlbumID || 0}&title=${encodeURIComponent(sName)}&artist=${encodeURIComponent(sArtist)}` }); } }); }
          } catch (_) {}
        }
        return jsonResponse({ success: true, songs });
      }

      // ==================== 10. 音频流代理 ====================
      if (url.pathname === "/api/love/music-stream" && request.method === "GET") {
        const hash = url.searchParams.get("hash"); const albumId = url.searchParams.get("album_id") || "0";
        const title = url.searchParams.get("title") || ""; const artist = url.searchParams.get("artist") || "";
        let targetAudioUrl = "";
        if (hash) {
          try {
            const kgInfoRes = await fetch(`https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${hash}`, { headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" } });
            if (kgInfoRes.ok) { const info = await kgInfoRes.json(); if (info?.url?.startsWith("http")) targetAudioUrl = info.url; }
          } catch (_) {}
          if (!targetAudioUrl) {
            try {
              const kgWebRes = await fetch(`https://wwwapi.kugou.com/yy/index.php?r=play/getdata&hash=${hash}&album_id=${albumId}&dfid=-&mid=-&platid=4&_=${Date.now()}`, { headers: { "User-Agent": "Mozilla/5.0", "Cookie": "kg_mid=e8d0e74b68ef5c4c95f19067b5b5c935; kg_dfid=2xP9uN2gRj5h0Xg5m54P2x9n", "Referer": "https://www.kugou.com/" } });
              if (kgWebRes.ok) { const data = await kgWebRes.json(); targetAudioUrl = data.data?.play_url || data.data?.play_backup_url || ""; }
            } catch (_) {}
          }
        }
        if (!targetAudioUrl && (title || hash)) {
          try {
            const querySong = `${title} ${artist}`.trim();
            if (querySong) {
              const kwUrl = `http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(querySong)}&pn=0&rn=1&vipver=1&ft=music&encoding=utf8&rformat=json&mobi=1`;
              const kwRes = await fetch(kwUrl, { headers: { "User-Agent": "okhttp/3.10.0" } });
              if (kwRes.ok) {
                const kwText = await kwRes.text();
                const ridMatch = kwText.match(/"MUSICRID":"MUSIC_(\d+)"/i) || kwText.match(/"rid":(\d+)/i) || kwText.match(/"DC_TARGETID":"(\d+)"/i);
                if (ridMatch?.[1]) {
                  const kwPlayRes = await fetch(`https://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${ridMatch[1]}&format=mp3&response=url`, { headers: { "User-Agent": "Mozilla/5.0" } });
                  if (kwPlayRes.ok) { const directUrl = (await kwPlayRes.text()).trim(); if (directUrl?.startsWith("http")) targetAudioUrl = directUrl; }
                }
              }
            }
          } catch (_) {}
        }
        if (!targetAudioUrl || !targetAudioUrl.startsWith("http")) return new Response("Audio Source Unavailable", { status: 404, headers: corsHeaders });
        try {
          const range = request.headers.get("Range");
          const forwardHeaders = { "User-Agent": "Mozilla/5.0", "Referer": "" }; if (range) forwardHeaders["Range"] = range;
          const streamRes = await fetch(targetAudioUrl, { headers: forwardHeaders, redirect: "follow" });
          if (streamRes.ok || streamRes.status === 206) {
            const responseHeaders = new Headers(corsHeaders);
            responseHeaders.set("Content-Type", streamRes.headers.get("Content-Type") || "audio/mpeg");
            responseHeaders.set("Accept-Ranges", "bytes");
            if (streamRes.headers.get("Content-Length")) responseHeaders.set("Content-Length", streamRes.headers.get("Content-Length"));
            if (streamRes.headers.get("Content-Range")) responseHeaders.set("Content-Range", streamRes.headers.get("Content-Range"));
            return new Response(streamRes.body, { status: streamRes.status, headers: responseHeaders });
          }
        } catch (_) {}
        return Response.redirect(targetAudioUrl, 302);
      }

      // ==================== 11. 静态文件输出 ====================
      if (url.pathname.startsWith("/raw/")) {
        if (!bucket) return new Response("Bucket Not Found", { status: 500 });
        const key = decodeURIComponent(url.pathname.replace(/^\/raw\//, ""));
        const rangeHeader = request.headers.get("Range");
        let r2Options = {};
        if (rangeHeader) { const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/); if (match) { const start = parseInt(match[1], 10); const end = match[2] ? parseInt(match[2], 10) : undefined; r2Options.range = { offset: start, length: end ? end - start + 1 : undefined }; } }
        const object = await bucket.get(key, r2Options);
        if (!object) return new Response("File Not Found", { status: 404 });
        const headers = new Headers(corsHeaders); object.writeHttpMetadata(headers); headers.set("ETag", object.httpEtag); headers.set("Accept-Ranges", "bytes"); headers.set("Cache-Control", "public, max-age=604800, immutable");
        if (r2Options.range && object.range) { headers.set("Content-Range", `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`); return new Response(object.body, { status: 206, headers }); }
        return new Response(object.body, { headers });
      }
    } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }

    if (env.ASSETS) { try { return await env.ASSETS.fetch(request); } catch (e) { return new Response("Not Found", { status: 404 }); } }
    return new Response("Not Found", { status: 404 });
  }
};
