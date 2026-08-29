/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/photo-wall.js
 * 作用: 「时光留白」自由视差照片墙渲染与全页面流式视差滚动计算 (双端安全边界防溢出定位)
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

    // 收集时光轴中的真实有效照片节点
    const timeline = this.config.timeline || [];
    const photoNodes = timeline.filter(item => Boolean(item.frontImg));

    if (photoNodes.length === 0) {
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
        mainContainer ? mainContainer.offsetHeight + 400 : window.innerHeight * 2.5
      );

      // 动态撑开容器高度，防止底部拍立得被裁切
      container.style.height = `${pageHeight}px`;

      container.innerHTML = "";
      this.itemsData = [];

      // 1. 首张照片作为左上角固定、正立的高清头像
      const avatarNode = photoNodes[0];
      if (avatarNode && avatarNode.frontImg) {
        const avatarItem = document.createElement("div");
        avatarItem.className = "wall-polaroid-avatar";
        avatarItem.innerHTML = `
          <div class="wall-polaroid-inner">
            <img src="${avatarNode.frontImg}" alt="专属头像" loading="eager" onerror="this.parentElement.parentElement.style.display='none'">
          </div>
          <div class="wall-polaroid-caption">${avatarNode.tag || "恒久契约"}</div>
        `;
        container.appendChild(avatarItem);
      }

      // 2. 其余照片渲染为背景流式倾斜视差照片墙 (严格防左右溢出算法)
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

          // 左右两侧交错分布 (严格依据左右边界锚定，彻底杜绝右侧突兀出框)
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
          // 移动端缩小旋转摆动幅度 (最大 10 度)，消除旋转角点刺穿视口边缘
          const baseRot = (Math.random() - 0.5) * (isMobile ? 10 : 18);

          // 负向视差阻尼系数 (-0.04 ~ -0.065)
          const speed = isLeft ? -0.04 : -0.065;

          item.style.top = `${baseTop}px`;
          item.style.transform = `translate3d(0, 0, 0) rotate(${baseRot}deg)`;

          item.innerHTML = `
            <div class="wall-polaroid-inner">
              <img src="${node.frontImg}" alt="${node.title || "时光碎片"}" loading="lazy" onerror="this.parentElement.parentElement.style.display='none'">
            </div>
          `;

          container.appendChild(item);

          // 缓存物理参数供视差计算使用
          this.itemsData.push({
            element: item,
            baseRot: baseRot,
            speed: speed
          });
        });
      }

      this.updateParallax();
    };

    // 立即执行一次布局
    layoutPhotos();

    // 监听资源加载与窗口变化以动态校准
    window.addEventListener("load", layoutPhotos, { once: true });

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        layoutPhotos();
      });
      resizeObserver.observe(document.body);
    }

    // 绑定高性能视差滚动
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
   * 执行负向视差浮动位移（确保随页面自然上滑呈现）
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
