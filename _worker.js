/**
 * 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: _worker.js
 * 作用: R2 数据持久化、流媒体断点续传、无用缓存清理、双源在线音乐搜索引擎
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 智能获取绑定的 R2 存储桶
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
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    const ADMIN_PASSWORD = String(env.ADMIN_PASSWORD || env.SECRET_PWD || env.ADMIN_PWD || "521");

    function checkAuth(req) {
      const headerAuth = req.headers.get("x-admin-auth") || req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      const queryAuth = url.searchParams.get("auth");
      const token = headerAuth || queryAuth;
      return token === ADMIN_PASSWORD;
    }

    const CONFIG_R2_KEY = "_love_universe/config.json";

    try {
      // 1. 获取全站配置
      if (url.pathname === "/api/love/config" && request.method === "GET") {
        if (!bucket) return jsonResponse({ success: false, error: "未检测到 R2 存储桶" }, 500);
        try {
          const obj = await bucket.get(CONFIG_R2_KEY);
          if (obj) {
            const text = await obj.text();
            return jsonResponse({ success: true, custom: true, config: JSON.parse(text) });
          }
        } catch (_) {}
        return jsonResponse({ success: true, custom: false, config: null });
      }

      // 2. 保存并发布配置
      if (url.pathname === "/api/love/config" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未检测到 R2 存储桶" }, 500);
        if (!checkAuth(request)) return jsonResponse({ success: false, error: "管理口令错误或未授权" }, 401);

        let reqData;
        try {
          reqData = await request.json();
        } catch (_) {
          return jsonResponse({ success: false, error: "数据格式错误" }, 400);
        }

        await bucket.put(CONFIG_R2_KEY, JSON.stringify(reqData.config || {}), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });

        return jsonResponse({ success: true, message: "配置已发布并永久同步至 R2 云端" });
      }

      // 3. 上传多媒体附件
      if (url.pathname === "/api/love/upload" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未检测到 R2 存储桶" }, 500);
        if (!checkAuth(request)) return jsonResponse({ success: false, error: "未授权" }, 401);

        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) return jsonResponse({ success: false, error: "未接收到文件" }, 400);

        const safeName = (file.name || "media.bin").replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const r2Key = `_love_universe/assets/${Date.now()}_${safeName}`;

        await bucket.put(r2Key, file.stream(), {
          httpMetadata: { contentType: file.type || "application/octet-stream" }
        });

        return jsonResponse({ success: true, url: `/raw/${r2Key}` });
      }

      // 4. 清理孤立废弃缓存
      if (url.pathname === "/api/love/cleanup" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未检测到 R2 存储桶" }, 500);
        if (!checkAuth(request)) return jsonResponse({ success: false, error: "未授权" }, 401);

        let activeKeys = new Set();
        try {
          const cfgObj = await bucket.get(CONFIG_R2_KEY);
          if (cfgObj) {
            const rawText = await cfgObj.text();
            const matches = rawText.match(/\/raw\/([a-zA-Z0-9_\-\.\/]+)/g) || [];
            matches.forEach(m => activeKeys.add(decodeURIComponent(m.replace(/^\/raw\//, ""))));
          }
        } catch (_) {}

        let deletedCount = 0;
        let freedBytes = 0;
        const listed = await bucket.list({ prefix: "_love_universe/assets/" });

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
          message: `已自动清理 ${deletedCount} 个过期废弃文件，释放空间 ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`
        });
      }

      // 5. 🔍 在线音乐云端搜索引擎 (POST 规范传输 + 双源灾备)
      if (url.pathname === "/api/love/music-search" && request.method === "GET") {
        const keyword = (url.searchParams.get("keyword") || "浪漫钢琴").trim();
        const songs = [];
        const seen = new Set();

        // 策略 A: 网易云标准 POST 搜索通道
        try {
          const postBody = new URLSearchParams({
            s: keyword,
            type: "1",
            offset: "0",
            total: "true",
            limit: "12"
          }).toString();

          const res = await fetch("https://music.163.com/api/search/get/web", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              "Referer": "https://music.163.com",
              "Cookie": "os=pc"
            },
            body: postBody
          });

          if (res.ok) {
            const data = await res.json();
            const list = data.result?.songs || [];
            list.forEach(s => {
              if (s.id && s.name && !seen.has(String(s.id))) {
                seen.add(String(s.id));
                songs.push({
                  id: String(s.id),
                  title: s.name,
                  artist: (s.artists || []).map(a => a.name).join(" / "),
                  url: `https://music.163.com/song/media/outer/url?id=${s.id}.mp3`
                });
              }
            });
          }
        } catch (_) {}

        // 策略 B: 酷狗开放检索补充通道 (若 A 结果少于 3 首)
        if (songs.length < 3) {
          try {
            const kgRes = await fetch(`https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=10&filter=2&bitrate=0&isfp=0`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              }
            });
            if (kgRes.ok) {
              const kgData = await kgRes.json();
              const kgList = kgData.data?.lists || [];
              kgList.forEach(item => {
                const sName = (item.SongName || "").replace(/<[^>]+>/g, "");
                const sArtist = (item.SingerName || "").replace(/<[^>]+>/g, "");
                const sId = String(item.Audioid || item.FileHash || Date.now());
                if (sName && !seen.has(sId)) {
                  seen.add(sId);
                  songs.push({
                    id: sId,
                    title: sName,
                    artist: sArtist,
                    url: `https://music.163.com/song/media/outer/url?id=${item.Audioid || 1827600686}.mp3`
                  });
                }
              });
            }
          } catch (_) {}
        }

        return jsonResponse({ success: true, songs });
      }

      // 6. 直链访问与断点续传
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
