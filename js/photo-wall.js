/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/photo-wall.js
 * 作用: 「时光留白」自由视差照片墙渲染与视差滚动
 */

class PhotoWallManager {
  constructor(config) {
    this.config = config || {};
  }

  init() {
    const container = document.getElementById("parallax-photo-wall");
    if (!container) return;

    // 收集时光轴中的所有照片作为背景留白素材
    const timeline = this.config.timeline || [];
    const photos = timeline.map(item => item.frontImg).filter(Boolean);

    if (photos.length === 0) {
      photos.push("assets/images/photo_01.jpg");
    }

    container.innerHTML = "";
    
    // 生成散落的拍立得碎片
    photos.forEach((url, idx) => {
      const item = document.createElement("div");
      item.className = "wall-polaroid-item";
      
      // 随机左右分布与倾斜角度
      const isLeft = idx % 2 === 0;
      const posX = isLeft ? (Math.random() * 12 + 2) : (Math.random() * 12 + 82);
      const posY = (idx * 28) + Math.random() * 15;
      const rot = (Math.random() - 0.5) * 16;

      item.style.left = `${posX}%`;
      item.style.top = `${posY}vh`;
      item.style.transform = `rotate(${rot}deg)`;

      item.innerHTML = `
        <div class="wall-polaroid-inner">
          <img src="${url}" alt="记忆碎片" loading="lazy" onerror="this.src='assets/images/photo_01.jpg'">
        </div>
      `;
      container.appendChild(item);
    });

    // 监听视差滚动
    window.addEventListener("scroll", () => {
      const scrollY = window.scrollY;
      const items = container.querySelectorAll(".wall-polaroid-item");
      items.forEach((el, idx) => {
        const speed = (idx % 2 === 0) ? 0.12 : 0.08;
        el.style.transform = `translateY(${scrollY * speed}px) rotate(${((idx * 5) - 10)}deg)`;
      });
    }, { passive: true });
  }
}

window.PhotoWallManager = PhotoWallManager;
