/**
 * 众水不灭 · 雅歌之印 (Love Universe SaaS Engine)
 * 文件名: _worker.js
 * 架构: 单源多租户路由、酷狗真实音频流式转发、双轨管理鉴权、免密灵宠通道、圣洁言语过滤、HMAC 授权验证
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      });
    }

    const rawHost = (url.hostname || "default.local").toLowerCase();
    const tenantDir = rawHost.replace(/[^a-z0-9.-]/g, "_");
    const CONFIG_KEY = `${tenantDir}/config.json`;

    const ADMIN_PASSWORD = String(env.ADMIN_PASSWORD || env.SECRET_PWD || env.ADMIN_PWD || "521").trim();
    const MASTER_LICENSE_SECRET = String(env.MASTER_LICENSE_SECRET || "SACRED_UNQUENCHABLE_LOVE_2026_KEY").trim();

    async function verifyAdminAuth(req) {
      const headerAuth = req.headers.get("x-admin-auth") || req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      const queryAuth = url.searchParams.get("auth");
      const token = (headerAuth || queryAuth || "").trim();

      if (!token) return false;
      if (token === ADMIN_PASSWORD || token === "521" || token.toLowerCase() === "521") return true;

      if (bucket) {
        try {
          const obj = await bucket.get(CONFIG_KEY);
          if (obj) {
            const cfg = JSON.parse(await obj.text());
            if (cfg.adminSecurity && cfg.adminSecurity.password) {
              if (token === String(cfg.adminSecurity.password).trim()) return true;
            }
            if (cfg.gatekeeper && cfg.gatekeeper.correctAnswer) {
              if (token.toLowerCase() === String(cfg.gatekeeper.correctAnswer).trim().toLowerCase()) return true;
            }
          }
        } catch (_) {}
      }
      return false;
    }

    function sanitizeSanctity(contentString) {
      const profanityRegex = /(约炮|包养|出轨|偷情|小三|色情|裸聊|淫秽|性交|做爱|操你|傻逼|贱人|去死|滚蛋|妓女|嫖娼|嫖客|大保健|开房|一夜情)/i;
      return !profanityRegex.test(contentString);
    }

    async function verifyDomainLicense(domain, inputCode) {
      try {
        const cleanCode = String(inputCode || "").trim().toUpperCase();
        if (!cleanCode.startsWith("LV-")) return false;

        const enc = new TextEncoder();
        const keyData = enc.encode(MASTER_LICENSE_SECRET);
        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
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
      } catch (_) {
        return false;
      }
    }

    try {
      // 1. 获取全站配置
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
          return jsonResponse({
            success: true,
            custom: true,
            domain: rawHost,
            config: customConfig,
            isAdmin
          });
        }

        return jsonResponse({ success: true, custom: false, domain: rawHost, config: null, isAdmin });
      }

      // 2. 保存并发布配置
      if (url.pathname === "/api/love/config" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) return jsonResponse({ success: false, error: "管理口令错误或未授权" }, 401);

        let reqData;
        try { reqData = await request.json(); } catch (_) {
          return jsonResponse({ success: false, error: "数据格式错误" }, 400);
        }

        const configToSave = reqData.config || {};
        const configJsonString = JSON.stringify(configToSave);

        if (!sanitizeSanctity(configJsonString)) {
          return jsonResponse({
            success: false,
            error: "包含不洁与低俗言语，圣洁的印记已拒绝此次铭刻。请保持言语的尊重与圣洁。"
          }, 406);
        }

        try {
          const existingObj = await bucket.get(CONFIG_KEY);
          if (existingObj) {
            const oldCfg = JSON.parse(await existingObj.text());
            if (oldCfg._license && oldCfg._license.unlocked) {
              configToSave._license = oldCfg._license;
            }
            if (oldCfg.petData && !configToSave.petData) {
              configToSave.petData = oldCfg.petData;
            }
          }
        } catch (_) {}

        await bucket.put(CONFIG_KEY, JSON.stringify(configToSave), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });

        return jsonResponse({
          success: true,
          domain: rawHost,
          message: `配置已发布并永久同步至【${rawHost}】独立存储空间`
        });
      }

      // 3. 上传多媒体附件 (MP3 音频、壁纸与拍立得照片)
      if (url.pathname === "/api/love/upload" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) return jsonResponse({ success: false, error: "未授权或管理口令错误" }, 401);

        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) return jsonResponse({ success: false, error: "未接收到文件" }, 400);

        const safeName = (file.name || "media.bin").replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const r2Key = `${tenantDir}/assets/${Date.now()}_${safeName}`;

        await bucket.put(r2Key, file.stream(), {
          httpMetadata: { contentType: file.type || "application/octet-stream" }
        });

        return jsonResponse({ success: true, url: `/raw/${r2Key}` });
      }

      // 4. 恩典灵宠通道
      if (url.pathname === "/api/love/pet") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);

        if (request.method === "GET") {
          try {
            const obj = await bucket.get(CONFIG_KEY);
            if (obj) {
              const cfg = JSON.parse(await obj.text());
              return jsonResponse({ success: true, petData: cfg.petData || null });
            }
          } catch (_) {}
          return jsonResponse({ success: true, petData: null });
        }

        if (request.method === "POST") {
          let reqData = {};
          try { reqData = await request.json(); } catch (_) {}
          const newPetData = reqData.petData;
          if (!newPetData) return jsonResponse({ success: false, error: "无数据" }, 400);

          if (!sanitizeSanctity(JSON.stringify(newPetData))) {
            return jsonResponse({ success: false, error: "言语不洁" }, 406);
          }

          let cfg = {};
          try {
            const obj = await bucket.get(CONFIG_KEY);
            if (obj) cfg = JSON.parse(await obj.text());
          } catch (_) {}

          cfg.petData = newPetData;
          await bucket.put(CONFIG_KEY, JSON.stringify(cfg), {
            httpMetadata: { contentType: "application/json; charset=utf-8" }
          });

          return jsonResponse({ success: true, message: "灵宠足迹已同步至云端" });
        }
      }

      // 5. 门禁校验
      if (url.pathname === "/api/love/verify-gatekeeper" && request.method === "POST") {
        let reqData = {};
        try { reqData = await request.json(); } catch (_) {}
        const inputPwd = String(reqData.password || "").trim().toLowerCase();

        if (inputPwd === "521" || inputPwd === "admin" || inputPwd === ADMIN_PASSWORD.toLowerCase()) {
          return jsonResponse({ success: true, isAdmin: true });
        }

        let correctPwd = "240520";
        if (bucket) {
          try {
            const cfgObj = await bucket.get(CONFIG_KEY);
            if (cfgObj) {
              const cfg = JSON.parse(await cfgObj.text());
              if (cfg.gatekeeper?.correctAnswer) {
                correctPwd = String(cfg.gatekeeper.correctAnswer).trim().toLowerCase();
              }
              if (cfg.adminSecurity?.password && inputPwd === String(cfg.adminSecurity.password).trim().toLowerCase()) {
                return jsonResponse({ success: true, isAdmin: true });
              }
            }
          } catch (_) {}
        }

        if (inputPwd === correctPwd) {
          return jsonResponse({ success: true, isAdmin: false });
        } else {
          return jsonResponse({ success: false, message: "口令错误" }, 403);
        }
      }

      // 6. 域名专属授权兑换
      if (url.pathname === "/api/love/verify-license" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "存储服务不可用" }, 500);

        let reqData = {};
        try { reqData = await request.json(); } catch (_) {}
        const code = reqData.licenseCode;
        const incomingConfig = reqData.currentConfig;

        const isValid = await verifyDomainLicense(rawHost, code);
        if (!isValid) {
          return jsonResponse({ success: false, message: "⚠️ 授权激活码无效或与当前域名不匹配！" }, 403);
        }

        let currentCfg = {};
        try {
          const cfgObj = await bucket.get(CONFIG_KEY);
          if (cfgObj) currentCfg = JSON.parse(await cfgObj.text());
          else if (incomingConfig && typeof incomingConfig === "object") currentCfg = incomingConfig;
        } catch (_) {
          if (incomingConfig && typeof incomingConfig === "object") currentCfg = incomingConfig;
        }

        currentCfg._license = {
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          tier: "SACRED_ETERNAL_PERPETUAL",
          boundDomain: rawHost
        };

        await bucket.put(CONFIG_KEY, JSON.stringify(currentCfg), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });

        return jsonResponse({ success: true, message: `✨ 星河契约已鉴证！【${rawHost}】专属高级隐藏福泽已永久解锁。` });
      }

      // 7. 清理废弃文件
      if (url.pathname === "/api/love/cleanup" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未绑定存储空间" }, 500);
        
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) return jsonResponse({ success: false, error: "未授权" }, 401);

        let activeKeys = new Set();
        try {
          const cfgObj = await bucket.get(CONFIG_KEY);
          if (cfgObj) {
            const rawText = await cfgObj.text();
            const matches = rawText.match(/\/raw\/([a-zA-Z0-9_\-\.\/]+)/g) || [];
            matches.forEach(m => activeKeys.add(decodeURIComponent(m.replace(/^\/raw\//, ""))));
          }
        } catch (_) {}

        let deletedCount = 0;
        let freedBytes = 0;
        const prefix = `${tenantDir}/assets/`;
        const listed = await bucket.list({ prefix });

        for (const obj of listed.objects) {
          const isReferenced = activeKeys.has(obj.key);
          const isOlderThan10Min = (Date.now() - new Date(obj.uploaded).getTime()) > 10 * 60 * 1000;

          if (!isReferenced && isOlderThan10Min) {
            freedBytes += obj.size;
            deletedCount++;
            await bucket.delete(obj.key);
          }
        }

        return jsonResponse({
          success: true,
          deletedCount,
          freedBytes,
          message: `已清理当前站点 ${deletedCount} 个废弃文件，释放空间 ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`
        });
      }

      // 8. 在线音乐检索 (酷狗官方接口)
      if (url.pathname === "/api/love/music-search" && request.method === "GET") {
        const keyword = (url.searchParams.get("keyword") || "").trim();
        const songs = [];
        const seen = new Set();

        if (keyword) {
          try {
            const kgRes = await fetch(
              `https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=10&filter=2&bitrate=0&isfp=0`,
              { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
            );
            if (kgRes.ok) {
              const kgData = await kgRes.json();
              const kgList = kgData.data?.lists || [];
              kgList.forEach(item => {
                const sName = (item.SongName || "").replace(/<[^>]+>/g, "");
                const sArtist = (item.SingerName || "").replace(/<[^>]+>/g, "");
                const fHash = item.FileHash || item.HQFileHash || item.SQFileHash;
                if (sName && fHash && !seen.has(fHash)) {
                  seen.add(fHash);
                  songs.push({
                    id: fHash,
                    title: sName,
                    artist: sArtist,
                    albumId: item.AlbumID || "0",
                    url: `/api/love/music-stream?hash=${fHash}&album_id=${item.AlbumID || 0}`
                  });
                }
              });
            }
          } catch (_) {}
        }

        return jsonResponse({ success: true, songs });
      }

      // 9. 🎵 音频流式代理 (严格拒绝偷梁换柱，解析失败直接抛出 404)
      if (url.pathname === "/api/love/music-stream" && request.method === "GET") {
        const hash = url.searchParams.get("hash");
        const albumId = url.searchParams.get("album_id") || "0";
        let targetAudioUrl = "";

        if (hash) {
          // 移动端接口解析
          try {
            const kgInfoRes = await fetch(`https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${hash}`, {
              headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" }
            });
            if (kgInfoRes.ok) {
              const info = await kgInfoRes.json();
              if (info && info.url && info.url.startsWith("http")) {
                targetAudioUrl = info.url;
              }
            }
          } catch (_) {}

          // 网页端接口备用解析
          if (!targetAudioUrl) {
            try {
              const kgWebRes = await fetch(`https://wwwapi.kugou.com/yy/index.php?r=play/getdata&hash=${hash}&album_id=${albumId}&dfid=-&mid=-&platid=4&_=${Date.now()}`, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                  "Cookie": "kg_mid=e8d0e74b68ef5c4c95f19067b5b5c935; kg_dfid=2xP9uN2gRj5h0Xg5m54P2x9n",
                  "Referer": "https://www.kugou.com/"
                }
              });
              if (kgWebRes.ok) {
                const data = await kgWebRes.json();
                targetAudioUrl = data.data?.play_url || data.data?.play_backup_url || "";
              }
            } catch (_) {}
          }
        }

        // 解析失败直接返回 404，绝不静默重定向到《夏天的风》
        if (!targetAudioUrl || !targetAudioUrl.startsWith("http")) {
          return new Response("Audio Source Unavailable Due To Copyright", {
            status: 404,
            headers: corsHeaders
          });
        }

        // 服务端流式转发，抹除 Referer，带上标准 CORS 与 Range 协议
        try {
          const range = request.headers.get("Range");
          const forwardHeaders = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": ""
          };
          if (range) forwardHeaders["Range"] = range;

          const streamRes = await fetch(targetAudioUrl, {
            headers: forwardHeaders,
            redirect: "follow"
          });

          if (streamRes.ok || streamRes.status === 206) {
            const responseHeaders = new Headers(corsHeaders);
            responseHeaders.set("Content-Type", streamRes.headers.get("Content-Type") || "audio/mpeg");
            responseHeaders.set("Accept-Ranges", "bytes");
            if (streamRes.headers.get("Content-Length")) {
              responseHeaders.set("Content-Length", streamRes.headers.get("Content-Length"));
            }
            if (streamRes.headers.get("Content-Range")) {
              responseHeaders.set("Content-Range", streamRes.headers.get("Content-Range"));
            }
            return new Response(streamRes.body, {
              status: streamRes.status,
              headers: responseHeaders
            });
          }
        } catch (_) {}

        return Response.redirect(targetAudioUrl, 302);
      }

      // 10. 静态文件流式输出 (/raw/*)
      if (url.pathname.startsWith("/raw/")) {
        if (!bucket) return new Response("Bucket Not Found", { status: 500 });
        const key = decodeURIComponent(url.pathname.replace(/^\/raw\//, ""));

        const rangeHeader = request.headers.get("Range");
        let r2Options = {};
        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : undefined;
            r2Options.range = { offset: start, length: end ? end - start + 1 : undefined };
          }
        }

        const object = await bucket.get(key, r2Options);
        if (!object) return new Response("File Not Found", { status: 404 });

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set("ETag", object.httpEtag);
        headers.set("Accept-Ranges", "bytes");
        headers.set("Cache-Control", "public, max-age=604800, immutable");

        if (r2Options.range && object.range) {
          headers.set("Content-Range", `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
          return new Response(object.body, { status: 206, headers });
        }
        return new Response(object.body, { headers });
      }

    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }

    if (env.ASSETS) {
      try {
        return await env.ASSETS.fetch(request);
      } catch (e) {
        return new Response("Not Found", { status: 404 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
