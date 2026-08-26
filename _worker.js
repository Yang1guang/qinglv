/**
 * 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: _worker.js
 * 作用: R2 数据持久化、流媒体断点续传、无用缓存清理、高可用音乐搜索引擎与动态音频流解析
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

      // 5. 🔍 在线音乐云端搜索引擎
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

        // 默认精选兜底歌单
        if (songs.length === 0) {
          const PRESET_LIST = [
            { title: "告白气球", artist: "周杰伦", hash: "E3A199727B40A5B73C4CE15CEE5FA41E", albumId: "1794711" },
            { title: "晴天", artist: "周杰伦", hash: "A0A164B62580DA8E5BCEBDEB4F69B829", albumId: "960395" },
            { title: "简单爱", artist: "周杰伦", hash: "8078BA5188E67E7DE28D08F086ED3FDE", albumId: "959958" },
            { title: "甜甜的", artist: "周杰伦", hash: "B42D1577E4A8367A6BC9FF98205C90A8", albumId: "960398" },
            { title: "Sweet Memories (浪漫钢琴)", artist: "Romantic", hash: "FB9F762351A22C54F11CFBCE4B1A0413", albumId: "0" }
          ];
          PRESET_LIST.forEach(item => {
            songs.push({
              id: item.hash,
              title: item.title,
              artist: item.artist,
              albumId: item.albumId,
              url: `/api/love/music-stream?hash=${item.hash}&album_id=${item.albumId}`
            });
          });
        }

        return jsonResponse({ success: true, songs });
      }

      // 6. 🎵 核心：动态音频流解析中继 (获取无限制真实 MP3 直链并重定向)
      if (url.pathname === "/api/love/music-stream" && request.method === "GET") {
        const hash = url.searchParams.get("hash");
        const albumId = url.searchParams.get("album_id") || "0";

        if (hash) {
          try {
            // 通过接口换取实时可播 MP3 直链
            const kgInfoRes = await fetch(`https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${hash}`, {
              headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" }
            });
            if (kgInfoRes.ok) {
              const info = await kgInfoRes.json();
              if (info.url && info.url.startsWith("http")) {
                return Response.redirect(info.url, 302);
              }
            }

            // 备用通道
            const kgPcRes = await fetch(`https://www.kugou.com/yy/index.php?r=play/getdata&hash=${hash}&album_id=${albumId}&dfid=-&mid=-&platid=4`, {
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Cookie": "kg_mid=10086" }
            });
            if (kgPcRes.ok) {
              const pcData = await kgPcRes.json();
              const realUrl = pcData.data?.play_url || pcData.data?.play_backup_url;
              if (realUrl && realUrl.startsWith("http")) {
                return Response.redirect(realUrl, 302);
              }
            }
          } catch (_) {}
        }

        // 终极高可用兜底
        return Response.redirect("https://music.163.com/song/media/outer/url?id=1827600686.mp3", 302);
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
