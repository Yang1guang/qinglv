/**
 * 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: _worker.js
 * 作用: R2 数据持久化、流媒体断点续传、无用孤立缓存清理 (/api/love/cleanup)、在线音乐搜索
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

      // 4. 🧹 核心：R2 孤立无用历史缓存自动检测与清理 (/api/love/cleanup)
      if (url.pathname === "/api/love/cleanup" && request.method === "POST") {
        if (!bucket) return jsonResponse({ success: false, error: "未检测到 R2 存储桶" }, 500);
        if (!checkAuth(request)) return jsonResponse({ success: false, error: "未授权" }, 401);

        // A. 获取当前正在使用中的配置文件
        let activeKeys = new Set();
        try {
          const cfgObj = await bucket.get(CONFIG_R2_KEY);
          if (cfgObj) {
            const rawText = await cfgObj.text();
            // 正则提取所有正在引用的 /raw/ 文件名
            const matches = rawText.match(/\/raw\/([a-zA-Z0-9_\-\.\/]+)/g) || [];
            matches.forEach(m => {
              activeKeys.add(decodeURIComponent(m.replace(/^\/raw\//, "")));
            });
          }
        } catch (_) {}

        // B. 扫描 R2 assets 目录下的所有文件
        let deletedCount = 0;
        let freedBytes = 0;
        const listed = await bucket.list({ prefix: "_love_universe/assets/" });

        for (const obj of listed.objects) {
          // 如果该文件没有在任何板块中被使用，且上传时间超过 10 分钟（防止误删正在保存的草稿）
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

      // 5. 🔍 在线云端音乐即时搜索接口 (/api/love/music-search)
      if (url.pathname === "/api/love/music-search" && request.method === "GET") {
        const keyword = url.searchParams.get("keyword") || "浪漫钢琴";
        try {
          const searchApi = `https://music.163.com/api/search/get/web?csrf_token=&=true&type=1&offset=0&total=true&limit=8&s=${encodeURIComponent(keyword)}`;
          const res = await fetch(searchApi, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              "Referer": "https://music.163.com"
            }
          });
          const data = await res.json();
          const songs = (data.result?.songs || []).map(s => ({
            id: s.id,
            title: s.name,
            artist: (s.artists || []).map(a => a.name).join(" / "),
            url: `https://music.163.com/song/media/outer/url?id=${s.id}.mp3`
          }));
          return jsonResponse({ success: true, songs });
        } catch (e) {
          return jsonResponse({ success: false, error: "云端曲库搜索超时，请直接选用推荐列表" });
        }
      }

      // 6. 直链访问与流媒体分发 (/raw/:key)
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

    // 静态文件回退
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
