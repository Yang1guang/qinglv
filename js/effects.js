/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/effects.js
 * 作用: 动效中枢、高稳定单曲/多曲目列表播放引擎、隐藏列表抽屉与黑胶唱针联动
 */

class EffectsEngine {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.bgmAudio = null;
    this.isPlaying = false;
    this.playlist = [];
    this.currentIndex = 0;
    this.playMode = "list-loop"; // "list-loop" | "single-loop" | "random"
    this.isDrawerOpen = false;

    this.fireworksCanvas = document.getElementById("fireworks-canvas");
    this.fwCtx = this.fireworksCanvas ? this.fireworksCanvas.getContext("2d") : null;
    this.fireworks = [];
    this.confettiParticles = [];

    this.init();
  }

  loadPlaylistFromConfig() {
    const audioCfg = this.config.audio || {};
    this.playMode = audioCfg.playMode || "list-loop";

    // 默认单曲统一设为二珂版《告白气球》
    const defaultSingleTitle = audioCfg.bgmTitle || "告白气球";
    const defaultSingleArtist = audioCfg.bgmArtist || "二珂";
    const defaultSingleUrl = audioCfg.bgmUrl || "/api/love/music-stream?hash=F4726605D01122AD14206E4EBFD3D2E1&album_id=0&title=%E5%91%8A%E7%99%BD%E6%B0%94%E7%90%83&artist=%E4%BA%8C%E7%8F%82";
    const defaultCover = audioCfg.vinylCover || "";

    if (Array.isArray(audioCfg.playlist) && audioCfg.playlist.length > 0) {
      this.playlist = audioCfg.playlist.filter(item => item && (item.url || item.title)).map(item => ({
        id: item.id || ("song_" + Math.random().toString(36).substring(2, 7)),
        title: item.title || defaultSingleTitle,
        artist: item.artist || defaultSingleArtist,
        url: item.url || `/api/love/music-stream?title=${encodeURIComponent(item.title)}&artist=${encodeURIComponent(item.artist)}`,
        cover: item.cover || defaultCover
      }));
    } else {
      // 列表为空时，统一构建单曲播放条目
      this.playlist = [{
        id: "default_single",
        title: defaultSingleTitle,
        artist: defaultSingleArtist,
        url: defaultSingleUrl,
        cover: defaultCover
      }];
    }

    if (this.currentIndex >= this.playlist.length) {
      this.currentIndex = 0;
    }
  }

  getCurrentTrack() {
    if (this.playlist.length === 0) {
      return {
        title: "告白气球",
        artist: "二珂",
        url: "/api/love/music-stream?hash=F4726605D01122AD14206E4EBFD3D2E1&album_id=0&title=%E5%91%8A%E7%99%BD%E6%B0%94%E7%90%83&artist=%E4%BA%8C%E7%8F%82",
        cover: ""
      };
    }
    return this.playlist[this.currentIndex] || this.playlist[0];
  }

  init() {
    this.loadPlaylistFromConfig();
    this.initAudioPlayer();
    this.initCanvasSize();
    this.initEventListeners();
    this.updateTrackInfoDisplay();
    this.renderDrawerPlaylist();

    // 交互唤醒手势，解除所有浏览器的静音拦截
    const unlockAudio = () => {
      if (this.config.audio && this.config.audio.bgmAutoPlay !== false && !this.isPlaying) {
        this.playBgm();
      }
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });

    window.addEventListener("resize", () => this.initCanvasSize());
    this.startAnimationLoop();
  }

  updateConfig(newConfig) {
    this.config = newConfig || {};
    this.loadPlaylistFromConfig();
    const currentTrack = this.getCurrentTrack();

    if (this.bgmAudio && currentTrack.url && this.bgmAudio.src !== currentTrack.url) {
      this.bgmAudio.src = currentTrack.url;
      this.bgmAudio.load();
    }
    this.updateTrackInfoDisplay();
    this.renderDrawerPlaylist();
  }

  initCanvasSize() {
    if (this.fireworksCanvas) {
      this.fireworksCanvas.width = window.innerWidth;
      this.fireworksCanvas.height = window.innerHeight;
    }
  }

  initAudioPlayer() {
    if (!this.bgmAudio) {
      const currentTrack = this.getCurrentTrack();
      this.bgmAudio = new Audio(currentTrack.url);
      this.bgmAudio.preload = "auto";
      this.bgmAudio.loop = false; // 采用列表/事件驱动循环

      this.bgmAudio.addEventListener("play", () => {
        this.isPlaying = true;
        this.setVinylVisualPlaying(true);
        this.renderDrawerPlaylist();
      });

      this.bgmAudio.addEventListener("pause", () => {
        this.isPlaying = false;
        this.setVinylVisualPlaying(false);
        this.renderDrawerPlaylist();
      });

      // 歌曲播放完毕，触发自动连播管线
      this.bgmAudio.addEventListener("ended", () => {
        this.handleTrackEnded();
      });

      // 精准拦截音频加载失败，平稳隔离
      this.bgmAudio.addEventListener("error", () => {
        this.isPlaying = false;
        this.setVinylVisualPlaying(false);
        console.warn(`[音频系统] 当前曲目《${this.getCurrentTrack().title}》加载受阻，尝试检测下一首...`);
        if (this.playlist.length > 1) {
          setTimeout(() => {
            this.playNext(true);
          }, 1500);
        }
      });
    }
  }

  handleTrackEnded() {
    if (this.playMode === "single-loop" || this.playlist.length === 1) {
      this.bgmAudio.currentTime = 0;
      this.playBgm();
    } else if (this.playMode === "random") {
      let nextIdx = Math.floor(Math.random() * this.playlist.length);
      if (nextIdx === this.currentIndex) {
        nextIdx = (nextIdx + 1) % this.playlist.length;
      }
      this.playIndex(nextIdx);
    } else {
      this.playNext(true);
    }
  }

  playIndex(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIndex = index;
    const track = this.getCurrentTrack();

    if (!this.bgmAudio) {
      this.initAudioPlayer();
    }

    this.bgmAudio.src = track.url;
    this.bgmAudio.load();
    this.updateTrackInfoDisplay();
    this.renderDrawerPlaylist();
    this.playBgm();
    this.showMiniToast(`🎵 正在播放: ${track.title} - ${track.artist}`);
  }

  playNext(autoPlay = true) {
    if (this.playlist.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    const track = this.getCurrentTrack();

    if (this.bgmAudio) {
      this.bgmAudio.src = track.url;
      this.bgmAudio.load();
    }
    this.updateTrackInfoDisplay();
    this.renderDrawerPlaylist();
    if (autoPlay) {
      this.playBgm();
    }
    this.showMiniToast(`⏭️ 下一首: ${track.title}`);
  }

  playPrev(autoPlay = true) {
    if (this.playlist.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    const track = this.getCurrentTrack();

    if (this.bgmAudio) {
      this.bgmAudio.src = track.url;
      this.bgmAudio.load();
    }
    this.updateTrackInfoDisplay();
    this.renderDrawerPlaylist();
    if (autoPlay) {
      this.playBgm();
    }
    this.showMiniToast(`⏮️ 上一首: ${track.title}`);
  }

  playBgm() {
    if (!this.bgmAudio || !this.bgmAudio.src) return;

    if (this.bgmAudio.error) {
      this.isPlaying = false;
      this.setVinylVisualPlaying(false);
      return;
    }

    this.bgmAudio.play().then(() => {
      this.isPlaying = true;
      this.setVinylVisualPlaying(true);
    }).catch((err) => {
      this.isPlaying = false;
      this.setVinylVisualPlaying(false);
      if (err.name !== "NotAllowedError") {
        console.warn("播放受阻 (已平稳隔离):", err.message);
      }
    });
  }

  pauseBgm() {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
    this.isPlaying = false;
    this.setVinylVisualPlaying(false);
  }

  toggleBgm() {
    if (this.isPlaying) {
      this.pauseBgm();
    } else {
      this.playBgm();
    }
  }

  // 展开 / 收起隐藏歌曲列表抽屉
  togglePlaylistDrawer() {
    const drawer = document.getElementById("playlist-drawer");
    if (!drawer) return;
    this.isDrawerOpen = !this.isDrawerOpen;
    if (this.isDrawerOpen) {
      this.renderDrawerPlaylist();
      drawer.classList.add("show");
    } else {
      drawer.classList.remove("show");
    }
  }

  closePlaylistDrawer() {
    const drawer = document.getElementById("playlist-drawer");
    if (drawer) {
      this.isDrawerOpen = false;
      drawer.classList.remove("show");
    }
  }

  renderDrawerPlaylist() {
    const listContainer = document.getElementById("playlist-drawer-list");
    if (!listContainer) return;

    if (!this.playlist || this.playlist.length === 0) {
      listContainer.innerHTML = `<div class="playlist-drawer__empty">🍃 暂无自定义歌曲<br>当前默认播放《告白气球》</div>`;
      return;
    }

    listContainer.innerHTML = this.playlist.map((song, idx) => {
      const isCur = idx === this.currentIndex;
      return `
        <div class="playlist-drawer__item ${isCur ? 'active' : ''}" onclick="window.Effects.playIndex(${idx})">
          <div class="playlist-drawer__item-info">
            <div class="playlist-drawer__item-title">${idx + 1}. ${this.escape(song.title)}</div>
            <div class="playlist-drawer__item-artist">${this.escape(song.artist)}</div>
          </div>
          <div class="playlist-drawer__item-icon">
            ${isCur ? (this.isPlaying ? '🔊' : '⏸️') : '▶'}
          </div>
        </div>
      `;
    }).join("");
  }

  setVinylVisualPlaying(playing) {
    const disc = document.getElementById("vinyl-disc");
    const toggleBtn = document.getElementById("audio-toggle-btn");

    if (disc) {
      if (playing) {
        disc.classList.add("vinyl-disc--playing");
      } else {
        disc.classList.remove("vinyl-disc--playing");
      }
    }
    if (toggleBtn) {
      toggleBtn.textContent = playing ? "⏸️" : "🎵";
    }
    this.setNeedleState(playing);
  }

  setNeedleState(onDisc) {
    const needle = document.getElementById("vinyl-needle");
    if (needle) {
      if (onDisc) {
        needle.classList.add("vinyl-needle--play");
      } else {
        needle.classList.remove("vinyl-needle--play");
      }
    }
  }

  updateTrackInfoDisplay() {
    const track = this.getCurrentTrack();
    const coverImg = document.getElementById("vinyl-cover");
    const defaultHeart = document.querySelector(".vinyl-player__default-heart");

    if (coverImg) {
      if (track.cover) {
        coverImg.src = track.cover;
        coverImg.style.display = "block";
        if (defaultHeart) defaultHeart.style.display = "none";
      } else {
        coverImg.style.display = "none";
        if (defaultHeart) defaultHeart.style.display = "block";
      }
    }

    const titleEl = document.getElementById("vinyl-title-display") || document.querySelector(".vinyl-song-title");
    const artistEl = document.getElementById("vinyl-artist-display") || document.querySelector(".vinyl-song-artist");
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
  }

  showMiniToast(text) {
    const toast = document.getElementById("toast") || document.createElement("div");
    toast.className = "admin-toast show";
    toast.textContent = text;
    if (!document.body.contains(toast)) document.body.appendChild(toast);
    setTimeout(() => toast.classList.remove("show"), 2800);
  }

  initEventListeners() {
    const disc = document.getElementById("vinyl-disc");
    const toggleBtn = document.getElementById("audio-toggle-btn");
    const listBtn = document.getElementById("audio-list-btn");
    const closeDrawerBtn = document.getElementById("playlist-drawer-close");

    if (disc) disc.onclick = () => this.toggleBgm();
    if (toggleBtn) toggleBtn.onclick = () => this.toggleBgm();
    
    // 精准修复：绑定歌单按钮点击事件，阻断冒泡并呼出抽屉
    if (listBtn) {
      listBtn.onclick = (e) => {
        e.stopPropagation();
        this.togglePlaylistDrawer();
      };
    }
    
    if (closeDrawerBtn) {
      closeDrawerBtn.onclick = (e) => {
        e.stopPropagation();
        this.closePlaylistDrawer();
      };
    }

    // 点击外部区域自动收起抽屉
    document.addEventListener("click", (e) => {
      const drawer = document.getElementById("playlist-drawer");
      const vinylPlayer = document.getElementById("vinyl-player");
      if (this.isDrawerOpen && drawer && !drawer.contains(e.target) && !vinylPlayer.contains(e.target)) {
        this.closePlaylistDrawer();
      }
    });
  }

  playAudio(soundName) {
    const soundMap = {
      gatekeeperPass: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
      gatekeeperError: "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3",
      stamp: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      scratch: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
      flip: "https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3"
    };

    const url = soundMap[soundName];
    if (url) {
      try {
        const snd = new Audio(url);
        snd.volume = 0.6;
        snd.play().catch(() => {});
      } catch (_) {}
    }
  }

  fireFireworks() {
    if (!this.fwCtx) return;
    const colors = ["#f43f5e", "#f59e0b", "#38bdf8", "#a855f7", "#ec4899", "#ffffff"];
    for (let f = 0; f < 5; f++) {
      setTimeout(() => {
        const x = window.innerWidth * (0.2 + Math.random() * 0.6);
        const y = window.innerHeight * (0.2 + Math.random() * 0.4);
        for (let i = 0; i < 45; i++) {
          const angle = (Math.PI * 2 * i) / 45;
          const speed = Math.random() * 5 + 2;
          this.fireworks.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            radius: Math.random() * 2.5 + 1.2
          });
        }
      }, f * 180);
    }
  }

  fireConfetti() {
    if (!this.fwCtx) return;
    const colors = ["#fb7185", "#fde68a", "#a7f3d0", "#bae6fd", "#fbcfe8"];
    for (let i = 0; i < 70; i++) {
      this.confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }
  }

  startAnimationLoop() {
    const loop = () => {
      if (this.fwCtx) {
        this.fwCtx.clearRect(0, 0, this.fireworksCanvas.width, this.fireworksCanvas.height);

        for (let i = this.fireworks.length - 1; i >= 0; i--) {
          const p = this.fireworks[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.alpha -= 0.015;

          if (p.alpha <= 0) {
            this.fireworks.splice(i, 1);
          } else {
            this.fwCtx.beginPath();
            this.fwCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.fwCtx.fillStyle = p.color;
            this.fwCtx.globalAlpha = p.alpha;
            this.fwCtx.shadowColor = p.color;
            this.fwCtx.shadowBlur = 8;
            this.fwCtx.fill();
            this.fwCtx.shadowBlur = 0;
          }
        }

        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
          const c = this.confettiParticles[i];
          c.x += c.vx;
          c.y += c.vy;
          c.rotation += c.rotSpeed;
          c.alpha -= 0.008;

          if (c.y > window.innerHeight || c.alpha <= 0) {
            this.confettiParticles.splice(i, 1);
          } else {
            this.fwCtx.save();
            this.fwCtx.translate(c.x, c.y);
            this.fwCtx.rotate((c.rotation * Math.PI) / 180);
            this.fwCtx.fillStyle = c.color;
            this.fwCtx.globalAlpha = c.alpha;
            this.fwCtx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
            this.fwCtx.restore();
          }
        }
        this.fwCtx.globalAlpha = 1;
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  escape(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

window.Effects = new EffectsEngine();
