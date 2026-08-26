/**
 * 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: _worker.js
 * 作用: R2 数据持久化、流媒体断点续传、无用缓存清理、多源聚合在线音乐搜索引擎
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

      // 5. 🔍 在线音乐云端搜索引擎 (热门情歌索引库 + 多源实时穿透)
      if (url.pathname === "/api/love/music-search" && request.method === "GET") {
        const keyword = (url.searchParams.get("keyword") || "").trim();
        const songs = [];
        const seen = new Set();

        // 核心高频情歌常驻索引库 (秒出结果)
        const PRESET_MUSIC_LIBRARY = [
          { id: "436514312", title: "告白气球", artist: "周杰伦" },
          { id: "186016", title: "晴天", artist: "周杰伦" },
          { id: "186004", title: "简单爱", artist: "周杰伦" },
          { id: "185925", title: "稻香", artist: "周杰伦" },
          { id: "185965", title: "七里香", artist: "周杰伦" },
          { id: "185882", title: "甜甜的", artist: "周杰伦" },
          { id: "185896", title: "蒲公英的约定", artist: "周杰伦" },
          { id: "185929", title: "花海", artist: "周杰伦" },
          { id: "185975", title: "园游会", artist: "周杰伦" },
          { id: "185906", title: "浪漫手机", artist: "周杰伦" },
          { id: "186001", title: "开不了口", artist: "周杰伦" },
          { id: "185809", title: "安静", artist: "周杰伦" },
          { id: "2005476140", title: "乌梅子酱", artist: "李荣浩" },
          { id: "541498454", title: "慢慢喜欢你", artist: "莫文蔚" },
          { id: "287035", title: "遇见", artist: "孙燕姿" },
          { id: "326738", title: "一直很安静", artist: "阿桑" },
          { id: "1827600686", title: "Sweet Memories (唯美钢琴曲)", artist: "Romantic Ensemble" },
          { id: "139774", title: "遇见的奇迹 (纯音吉他)", artist: "Acoustic Melody" },
          { id: "441552", title: "风居住的街道", artist: "矶村由纪子" },
          { id: "1844919379", title: "蒲公英的约定 (八音盒版)", artist: "Music Box Love" }
        ];

        // 1. 优先本地库极速匹配
        if (keyword) {
          const kwLower = keyword.toLowerCase();
          PRESET_MUSIC_LIBRARY.forEach(item => {
            if (
              item.title.toLowerCase().includes(kwLower) ||
              item.artist.toLowerCase().includes(kwLower) ||
              kwLower.includes(item.title.toLowerCase()) ||
              kwLower.includes(item.artist.toLowerCase())
            ) {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                songs.push({
                  id: item.id,
                  title: item.title,
                  artist: item.artist,
                  url: `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`
                });
              }
            }
          });
        }

        // 2. 线上开放源检索穿透
        if (songs.length < 8 && keyword) {
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
                if (sName && !seen.has(sName)) {
                  seen.add(sName);
                  songs.push({
                    id: String(item.Audioid || item.FileHash || Date.now()),
                    title: sName,
                    artist: sArtist,
                    url: `https://music.163.com/song/media/outer/url?id=${item.Audioid || 436514312}.mp3`
                  });
                }
              });
            }
          } catch (_) {}
        }

        // 3. 空结果兜底展示热门推荐
        if (songs.length === 0) {
          PRESET_MUSIC_LIBRARY.slice(0, 10).forEach(item => {
            songs.push({
              id: item.id,
              title: item.title,
              artist: item.artist,
              url: `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`
            });
          });
        }

        return jsonResponse({ success: true, songs });
      }

      // 6. 🎵 音频流媒体直接重定向 (保障播放无阻)
      if (url.pathname === "/api/love/music-stream" && request.method === "GET") {
        const songId = url.searchParams.get("id") || "436514312";
        return Response.redirect(`https://music.163.com/song/media/outer/url?id=${songId}.mp3`, 302);
      }

      // 7. R2 静态直链分发 (/raw/:key)
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
