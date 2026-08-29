/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/photo-wall.js
 * 作用: 「时光留白」自由视差照片墙渲染与全页面流式视差滚动计算 (彻底根除 ResizeObserver 重排死循环，实现 60FPS 极速滚动)
 */

class PhotoWallManager {
  constructor(config) {
    this.config = config || window.LOVE_CONFIG || {};
    this.itemsData = [];
    this.ticking = false;
    this.lastScrollY = -1;
    this.resizeTimer = null;
  }

  init() {
    const container = document.getElementById("parallax-photo-wall");
    if (!container) return;

    // 收集时光轴中的真实有效照片节点
    const timeline = this.config.timeline || [];
    const photoNodes = timeline.filter(item => Boolean(item.frontImg));

    if (photoNodes.length === 0) {
      container.innerHTML = "";
      return;
    }

    // 核心布局计算 (严格禁止在滚动期间反复调用重建 DOM)
    const layoutPhotos = () => {
      const mainContainer = document.getElementById("main-container");
      const pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        mainContainer ? mainContainer.offsetHeight + 400 : window.innerHeight * 2.5
      );

      container.style.height = `${pageHeight}px`;
      container.innerHTML = "";
      this.itemsData = [];

      // 1. 首张照片作为左上角固定正立高清头像
      const avatarNode = photoNodes[0];
      if (avatarNode && avatarNode.frontImg) {
        const avatarItem = document.createElement("div");
        avatarItem.className = "wall-polaroid-avatar";
        avatarItem.innerHTML = `
          <div class="wall-polaroid-inner">
            <img src="${avatarNode.frontImg}" alt="专属头像" loading="eager" decoding="async" onerror="this.parentElement.parentElement.style.display='none'">
          </div>
          <div class="wall-polaroid-caption">${avatarNode.tag || "恒久契约"}</div>
        `;
        container.appendChild(avatarItem);
      }

      // 2. 其余照片渲染为背景流式倾斜视差照片墙
      const remainingNodes = photoNodes.slice(1);
      const totalPhotos = remainingNodes.length;

      if (totalPhotos > 0) {
        const isMobile = window.innerWidth <= 640;
        const startTop = isMobile ? 330 : 260; // 移动端避让顶部大标题
        const availableHeight = Math.max(pageHeight - startTop - 200, totalPhotos * 260);
        const verticalGap = availableHeight / Math.max(totalPhotos, 1);

        remainingNodes.forEach((node, idx) => {
          const item = document.createElement("div");
          item.className = "wall-polaroid-item";

          // 严格左右安全锚定，杜绝溢出屏幕
          const isLeft = idx % 2 === 0;
          if (isMobile) {
            if (isLeft) {
              item.style.left = `${Math.random() * 3 + 2}%`;
              item.style.right = "auto";
            } else {
              item.style.right = `${Math.random() * 3 + 2}%`;
              item.style.left = "auto";
            }
          } else {
            if (isLeft) {
              item.style.left = `${Math.random() * 4 + 2}%`;
              item.style.right = "auto";
            } else {
              item.style.right = `${Math.random() * 4 + 2}%`;
              item.style.left = "auto";
            }
          }

          const baseTop = startTop + (idx * verticalGap) + (Math.random() * 30);
          const baseRot = (Math.random() - 0.5) * (isMobile ? 8 : 16);
          const speed = isLeft ? -0.035 : -0.055;

          item.style.top = `${baseTop}px`;
          item.style.transform = `translate3d(0, 0, 0) rotate(${baseRot}deg)`;

          item.innerHTML = `
            <div class="wall-polaroid-inner">
              <img src="${node.frontImg}" alt="${node.title || "时光碎片"}" loading="lazy" decoding="async" onerror="this.parentElement.parentElement.style.display='none'">
            </div>
          `;

          container.appendChild(item);

          this.itemsData.push({
            element: item,
            baseRot: baseRot,
            speed: speed
          });
        });
      }

      this.updateParallax(true);
    };

    // 初始执行一次布局
    layoutPhotos();

    // 资源载入后校准一次高度
    window.addEventListener("load", layoutPhotos, { once: true });

    // 仅在窗口尺寸真正发生改变时进行防抖重绘 (彻底剥离 ResizeObserver 避免与滚动产生死锁循环)
    window.addEventListener("resize", () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        layoutPhotos();
      }, 250);
    }, { passive: true });

    // 高性能 RAF 视差驱动 (无位置变动不触发 GPU 写入)
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
   * 执行负向视差浮动位移 (纯 3D 矩阵计算，不触发 Reflow 重排)
   */
  updateParallax(force = false) {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    if (!force && Math.abs(scrollY - this.lastScrollY) < 0.5) return;
    this.lastScrollY = scrollY;

    for (let i = 0; i < this.itemsData.length; i++) {
      const data = this.itemsData[i];
      if (data.element) {
        const offsetY = Math.round(scrollY * data.speed);
        data.element.style.transform = `translate3d(0, ${offsetY}px, 0) rotate(${data.baseRot}deg)`;
      }
    }
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
