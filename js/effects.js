/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/effects.js
 * 作用: 动效中枢、多曲目黑胶播放列表控制器、歌单删除管理、烟花与粒子音效
 */

class EffectsEngine {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.bgmAudio = null;
    this.isPlaying = false;
    this.currentTrackIndex = 0;
    this.playlist = this.getNormalizedPlaylist();

    this.fireworksCanvas = document.getElementById("fireworks-canvas");
    this.fwCtx = this.fireworksCanvas ? this.fireworksCanvas.getContext("2d") : null;
    this.fireworks = [];
    this.confettiParticles = [];

    this.init();
  }

  getNormalizedPlaylist() {
    const audioCfg = this.config.audio || {};
    if (Array.isArray(audioCfg.playlist) && audioCfg.playlist.length > 0) {
      return audioCfg.playlist;
    }
    if (audioCfg.bgmUrl) {
      return [{
        title: audioCfg.bgmTitle || "告白气球 (浪漫钢琴版)",
        artist: audioCfg.bgmArtist || "周杰伦",
        url: audioCfg.bgmUrl,
        cover: audioCfg.vinylCover || ""
      }];
    }
    return [
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
      },
      {
        title: "Sweet Memories 浪漫钢琴",
        artist: "松田圣子 / 纯音乐",
        url: "https://music.163.com/song/media/outer/url?id=441116287.mp3",
        cover: ""
      }
    ];
  }

  init() {
    this.initAudioPlayer();
    this.initCanvasSize();
    this.initEventListeners();
    this.renderPlaylistPopup();
    this.updateTrackInfoDisplay();

    // 首次交互手势唤醒，解除桌面端浏览器自动静音限制
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
    this.playlist = this.getNormalizedPlaylist();
    this.renderPlaylistPopup();
    this.updateTrackInfoDisplay();
  }

  initCanvasSize() {
    if (this.fireworksCanvas) {
      this.fireworksCanvas.width = window.innerWidth;
      this.fireworksCanvas.height = window.innerHeight;
    }
  }

  initAudioPlayer() {
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio();
      this.bgmAudio.preload = "auto";

      this.bgmAudio.addEventListener("ended", () => {
        this.nextTrack();
      });

      this.bgmAudio.addEventListener("play", () => {
        this.isPlaying = true;
        this.setVinylVisualPlaying(true);
      });

      this.bgmAudio.addEventListener("pause", () => {
        this.isPlaying = false;
        this.setVinylVisualPlaying(false);
      });

      this.bgmAudio.addEventListener("error", () => {
        console.warn("当前曲目播放异常，自动跳入下一首...");
        setTimeout(() => this.nextTrack(), 500);
      });
    }

    this.loadTrack(this.currentTrackIndex, false);
  }

  loadTrack(index, autoPlay = true) {
    if (this.playlist.length === 0) return;
    if (index < 0) index = this.playlist.length - 1;
    if (index >= this.playlist.length) index = 0;

    this.currentTrackIndex = index;
    const track = this.playlist[this.currentTrackIndex];

    this.bgmAudio.src = track.url;
    this.updateTrackInfoDisplay();
    this.highlightActivePlaylistItem();

    if (autoPlay) {
      this.playBgm();
    }
  }

  playBgm() {
    if (!this.bgmAudio) return;
    this.bgmAudio.play().then(() => {
      this.isPlaying = true;
      this.setVinylVisualPlaying(true);
      const track = this.playlist[this.currentTrackIndex];
      this.showMiniToast(`🎶 正在播放: ${track.title} - ${track.artist}`);
    }).catch(() => {
      this.isPlaying = false;
      this.setVinylVisualPlaying(false);
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

  nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadTrack(nextIdx, true);
  }

  prevTrack() {
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(prevIdx, true);
  }

  selectTrack(index) {
    this.loadTrack(index, true);
  }

  // 🌟 前台歌单直接删除单曲
  deleteTrackFromPopup(e, index) {
    e.stopPropagation();
    if (this.playlist.length <= 1) {
      alert("⚠️ 歌单中请至少保留一首背景音乐！");
      return;
    }
    if (!confirm(`确定要从当前歌单中移除《${this.playlist[index].title}》吗？`)) return;

    const isCurrentPlaying = (this.currentTrackIndex === index);
    this.playlist.splice(index, 1);

    if (isCurrentPlaying) {
      if (this.currentTrackIndex >= this.playlist.length) {
        this.currentTrackIndex = 0;
      }
      this.loadTrack(this.currentTrackIndex, this.isPlaying);
    } else if (this.currentTrackIndex > index) {
      this.currentTrackIndex--;
    }

    this.renderPlaylistPopup();
    this.showMiniToast("✓ 已从歌单中移除该歌曲");
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
    if (this.playlist.length === 0) return;
    const track = this.playlist[this.currentTrackIndex];
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
  }

  renderPlaylistPopup() {
    const container = document.getElementById("vinyl-playlist-items");
    if (!container) return;

    container.innerHTML = this.playlist.map((track, idx) => `
      <div class="vinyl-playlist-item ${idx === this.currentTrackIndex ? 'active' : ''}" onclick="window.Effects.selectTrack(${idx})">
        <div class="vinyl-playlist-item-idx">${idx + 1}</div>
        <div class="vinyl-playlist-item-info">
          <div class="vinyl-playlist-item-title">${this.escape(track.title)}</div>
          <div class="vinyl-playlist-item-artist">${this.escape(track.artist)}</div>
        </div>
        <div class="vinyl-playlist-item-status">${idx === this.currentTrackIndex ? '▶' : ''}</div>
        <button class="vinyl-playlist-item-del" title="从歌单删除" onclick="window.Effects.deleteTrackFromPopup(event, ${idx})" style="background:none; border:none; color:#94a3b8; font-size:13px; cursor:pointer; padding:2px 6px;">🗑️</button>
      </div>
    `).join("");
  }

  highlightActivePlaylistItem() {
    document.querySelectorAll(".vinyl-playlist-item").forEach((el, idx) => {
      if (idx === this.currentTrackIndex) {
        el.classList.add("active");
        const status = el.querySelector(".vinyl-playlist-item-status");
        if (status) status.textContent = "▶";
      } else {
        el.classList.remove("active");
        const status = el.querySelector(".vinyl-playlist-item-status");
        if (status) status.textContent = "";
      }
    });
  }

  togglePlaylistPopup() {
    const popup = document.getElementById("vinyl-playlist-popup");
    if (!popup) return;
    const isVisible = popup.style.display === "block";
    popup.style.display = isVisible ? "none" : "block";
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
    const prevBtn = document.getElementById("audio-prev-btn");
    const nextBtn = document.getElementById("audio-next-btn");
    const playlistBtn = document.getElementById("audio-playlist-btn");
    const playlistClose = document.getElementById("vinyl-playlist-close");

    if (disc) disc.onclick = () => this.toggleBgm();
    if (toggleBtn) toggleBtn.onclick = () => this.toggleBgm();
    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); this.prevTrack(); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); this.nextTrack(); };
    if (playlistBtn) playlistBtn.onclick = (e) => { e.stopPropagation(); this.togglePlaylistPopup(); };
    if (playlistClose) playlistClose.onclick = () => {
      const popup = document.getElementById("vinyl-playlist-popup");
      if (popup) popup.style.display = "none";
    };
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
