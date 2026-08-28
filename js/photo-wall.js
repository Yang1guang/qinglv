/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/photo-wall.js
 * 作用: 「时光留白」自由视差照片墙渲染与全页面流式视差滚动计算
 */

class PhotoWallManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.itemsData = [];
    this.ticking = false;
  }

  init() {
    const container = document.getElementById("parallax-photo-wall");
    if (!container) return;

    // 收集时光轴中的真实照片直链，无照片时不产生无意义的假节点
    const timeline = this.config.timeline || [];
    const photos = timeline.map(item => item.frontImg).filter(Boolean);

    if (photos.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = "";
    this.itemsData = [];

    // 延迟执行以确保主页面 DOM 渲染完成，获取真实完整的文档高度
    const layoutPhotos = () => {
      const mainContainer = document.getElementById("main-container");
      const pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        mainContainer ? mainContainer.offsetHeight + 300 : window.innerHeight * 2
      );

      // 计算合理的纵向分布间距，避开顶部与极底部
      const totalPhotos = photos.length;
      const startTop = 80;
      const availableHeight = Math.max(pageHeight - startTop - 200, totalPhotos * 240);
      const verticalGap = availableHeight / Math.max(totalPhotos, 1);

      container.innerHTML = "";
      this.itemsData = [];

      photos.forEach((url, idx) => {
        const item = document.createElement("div");
        item.className = "wall-polaroid-item";

        // 左右两侧对称交错分布 (避开屏幕正中央 20%~80% 的主体文字区)
        const isLeft = idx % 2 === 0;
        const posX = isLeft ? (Math.random() * 6 + 2) : (Math.random() * 6 + 82);
        const baseTop = startTop + (idx * verticalGap) + (Math.random() * 30);
        const baseRot = (Math.random() - 0.5) * 20; // 随机轻微倾斜角度

        // 核心修正：使用纯负向阻尼系数 (-0.03 ~ -0.06)，使滑动时照片自然随页面往上走，同时呈现出优美的浅层视差
        const speed = isLeft ? -0.04 : -0.06;

        item.style.left = `${posX}%`;
        item.style.top = `${baseTop}px`;
        item.style.transform = `translate3d(0, 0, 0) rotate(${baseRot}deg)`;

        item.innerHTML = `
          <div class="wall-polaroid-inner">
            <img src="${url}" alt="时光碎片" loading="lazy" onerror="this.parentElement.parentElement.style.display='none'">
          </div>
        `;

        container.appendChild(item);

        // 缓存物理参数
        this.itemsData.push({
          element: item,
          baseRot: baseRot,
          speed: speed
        });
      });

      this.updateParallax();
    };

    // 立即执行一次布局
    layoutPhotos();

    // 当页面完全加载完成（图片和字体就绪）后再次校准一次高度
    window.addEventListener("load", layoutPhotos, { once: true });

    // 监听高度变化以动态适配
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        layoutPhotos();
      });
      resizeObserver.observe(document.body);
    }

    // 绑定基于 requestAnimationFrame 节流的高性能视差滚动
    window.addEventListener("scroll", () => {
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.updateParallax();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }, { passive: true });
  }

  /**
   * 执行负向视差浮动位移（确保随页面自然上滑）
   */
  updateParallax() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    this.itemsData.forEach(data => {
      if (!data.element) return;
      const offsetY = scrollY * data.speed;
      data.element.style.transform = `translate3d(0, ${offsetY}px, 0) rotate(${data.baseRot}deg)`;
    });
  }
}

// 自动挂载并在 DOM 就绪后启动
window.PhotoWallManager = PhotoWallManager;

document.addEventListener("DOMContentLoaded", () => {
  if (window.LOVE_CONFIG) {
    const photoWall = new PhotoWallManager(window.LOVE_CONFIG);
    photoWall.init();
  }
});
