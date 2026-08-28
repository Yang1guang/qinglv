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

    // 获取全页面真实可滚动高度，避免仅局限于首屏高度
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      window.innerHeight * 2
    );

    // 纵向分布步长，保证从顶部至底部均匀散落
    const totalPhotos = photos.length;
    const verticalGap = (pageHeight - 260) / Math.max(totalPhotos, 1);

    photos.forEach((url, idx) => {
      const item = document.createElement("div");
      item.className = "wall-polaroid-item";

      // 左右两侧交错分布 (左侧 2%~12%，右侧 78%~88%，避开正中央内容区)
      const isLeft = idx % 2 === 0;
      const posX = isLeft ? (Math.random() * 8 + 2) : (Math.random() * 8 + 80);
      const baseTop = (idx * verticalGap) + (Math.random() * 40 + 40);
      const baseRot = (Math.random() - 0.5) * 22; // 随机轻微倾斜角度
      const speed = isLeft ? 0.06 : -0.05;       // 左右相反的自然视差浮动系数

      item.style.left = `${posX}%`;
      item.style.top = `${baseTop}px`;
      item.style.transform = `translate3d(0, 0, 0) rotate(${baseRot}deg)`;

      item.innerHTML = `
        <div class="wall-polaroid-inner">
          <img src="${url}" alt="时光碎片" loading="lazy" onerror="this.parentElement.parentElement.style.display='none'">
        </div>
      `;

      container.appendChild(item);

      // 缓存每个拍立得的物理参数
      this.itemsData.push({
        element: item,
        baseRot: baseRot,
        speed: speed
      });
    });

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

    // 窗口尺寸变化时自动重新校准
    window.addEventListener("resize", () => {
      this.updateParallax();
    }, { passive: true });
  }

  /**
   * 执行微视差浮动位移
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
