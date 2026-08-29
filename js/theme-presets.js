/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/theme-presets.js
 * 作用: 12 套男女双视角高奢主题全量参数与物理粒子引擎定义 (全量校准浅色系高对比度字色)
 */

window.THEME_PRESETS = {
  // ================= 👦 男生偏好 · 6 套深邃浪漫主题 (暗色调 / 星空 / 科技 / 森林) =================
  boy: [
    {
      id: "sunset-twilight",
      name: "🌌 暮色星河",
      tag: "浪漫 / 深邃",
      desc: "落日余晖与闪烁星空交织，带尾迹的流星雨划过天际",
      particleType: "meteor",
      themeType: "dark",
      colors: {
        bg: "radial-gradient(circle at center top, #1e1b4b 0%, #090d16 70%)",
        cardBg: "rgba(19, 26, 41, 0.75)",
        cardBorder: "rgba(245, 158, 11, 0.3)",
        textMain: "#ffffff",
        textSub: "#94a3b8",
        accent: "#f59e0b"
      }
    },
    {
      id: "cyber-space",
      name: "⚡ 赛博漫游",
      tag: "科技 / 帅气",
      desc: "霓虹光束与全息矩阵粒子穿梭，极具未来科幻质感",
      particleType: "cyberMatrix",
      themeType: "dark",
      colors: {
        bg: "radial-gradient(circle at center, #022c22 0%, #030712 80%)",
        cardBg: "rgba(6, 78, 59, 0.35)",
        cardBorder: "rgba(52, 211, 153, 0.4)",
        textMain: "#ecfdf5",
        textSub: "#6ee7b7",
        accent: "#10b981"
      }
    },
    {
      id: "firefly-forest",
      name: "🌲 萤火森林",
      tag: "治愈 / 幽静",
      desc: "幽绿森林夜空中的发光萤火虫，忽明忽暗灵动飞舞",
      particleType: "fireflies",
      themeType: "dark",
      colors: {
        bg: "radial-gradient(circle at center bottom, #064e3b 0%, #022c22 60%, #020617 100%)",
        cardBg: "rgba(6, 78, 59, 0.4)",
        cardBorder: "rgba(110, 231, 183, 0.35)",
        textMain: "#f0fdf4",
        textSub: "#86efac",
        accent: "#22c55e"
      }
    },
    {
      id: "warm-ember",
      name: "🔥 炽热余烬",
      tag: "热情 / 爱意",
      desc: "如壁炉般缓缓升腾的火星余烬，温暖深沉而热烈",
      particleType: "embers",
      themeType: "dark",
      colors: {
        bg: "radial-gradient(circle at center bottom, #450a0a 0%, #180505 70%, #050101 100%)",
        cardBg: "rgba(69, 10, 10, 0.45)",
        cardBorder: "rgba(248, 113, 113, 0.35)",
        textMain: "#fef2f2",
        textSub: "#fca5a5",
        accent: "#ef4444"
      }
    },
    {
      id: "deep-ocean",
      name: "🌊 深海鲸落",
      tag: "静谧 / 浩瀚",
      desc: "深邃蔚蓝海沟中的自发光浮游生物与柔美光斑缓缓浮升",
      particleType: "bioplankton",
      themeType: "dark",
      colors: {
        bg: "radial-gradient(circle at center top, #082f49 0%, #031826 60%, #020617 100%)",
        cardBg: "rgba(8, 47, 73, 0.45)",
        cardBorder: "rgba(56, 189, 248, 0.35)",
        textMain: "#f0f9ff",
        textSub: "#7dd3fc",
        accent: "#0ea5e9"
      }
    },
    {
      id: "aurora-night",
      name: "🌌 极光夜幕",
      tag: "神秘 / 唯美",
      desc: "高纬度夜幕下如绸缎般缓缓起伏律动的碧绿与淡紫极光",
      particleType: "aurora",
      themeType: "dark",
      colors: {
        bg: "radial-gradient(circle at top right, #3b0764 0%, #090d16 75%)",
        cardBg: "rgba(59, 7, 100, 0.35)",
        cardBorder: "rgba(192, 132, 252, 0.35)",
        textMain: "#faf5ff",
        textSub: "#d8b4fe",
        accent: "#a855f7"
      }
    }
  ],

  // ================= 👧 女生偏好 · 6 套清透治愈主题 (浅色调 / 高饱和高对比度字色) =================
  girl: [
    {
      id: "french-cream",
      name: "🧁 法式奶油",
      tag: "温柔 / 慵懒",
      desc: "午后阳光洒在棉麻白裙上的温暖与柔焦丁达尔光尘",
      particleType: "sunDust",
      themeType: "light",
      colors: {
        bg: "radial-gradient(circle at center top, #fffdfa 0%, #f7eee4 75%, #ebdcd0 100%)",
        cardBg: "rgba(255, 255, 255, 0.95)",
        cardBorder: "rgba(120, 53, 15, 0.35)",
        textMain: "#451a03",
        textSub: "#78350f",
        accent: "#b45309"
      }
    },
    {
      id: "sakura-romance",
      name: "🌸 初雪樱花",
      tag: "甜美 / 唯美",
      desc: "微风吹拂下 3D 翻转的粉嫩樱花花瓣徐徐漫天散落",
      particleType: "petals",
      themeType: "light",
      colors: {
        bg: "radial-gradient(circle at center top, #fff5f7 0%, #fce7f3 70%, #fbcfe8 100%)",
        cardBg: "rgba(255, 255, 255, 0.95)",
        cardBorder: "rgba(225, 29, 72, 0.35)",
        textMain: "#881337",
        textSub: "#9f1239",
        accent: "#e11d48"
      }
    },
    {
      id: "monet-garden",
      name: "🌷 莫奈花园",
      tag: "清透 / 初恋",
      desc: "晨雾薄荷浅绿与水面涟漪光斑交织，充满生机与草木清香",
      particleType: "floralRipples",
      themeType: "light",
      colors: {
        bg: "radial-gradient(circle at center top, #f0fdf4 0%, #dcfce7 65%, #bbf7d0 100%)",
        cardBg: "rgba(255, 255, 255, 0.95)",
        cardBorder: "rgba(22, 101, 52, 0.35)",
        textMain: "#14532d",
        textSub: "#166534",
        accent: "#15803d"
      }
    },
    {
      id: "morning-dew",
      name: "💎 晨曦朝露",
      tag: "圣洁 / 高雅",
      desc: "纯白珍珠底色搭配晶莹剔透的晨露光泽，折射香槟高光",
      particleType: "dewDrops",
      themeType: "light",
      colors: {
        bg: "radial-gradient(circle at center top, #fafafc 0%, #f1f5f9 70%, #e2e8f0 100%)",
        cardBg: "rgba(255, 255, 255, 0.96)",
        cardBorder: "rgba(71, 85, 105, 0.35)",
        textMain: "#0f172a",
        textSub: "#334155",
        accent: "#d97706"
      }
    },
    {
      id: "sunset-blush",
      name: "🍬 梦幻甜梦",
      tag: "软糯 / 治愈",
      desc: "柔和晚霞粉与薰衣草淡紫，七彩糖果气泡缓缓升腾折射",
      particleType: "bubbles",
      themeType: "light",
      colors: {
        bg: "radial-gradient(circle at center top, #faf5ff 0%, #f3e8ff 60%, #e9d5ff 100%)",
        cardBg: "rgba(255, 255, 255, 0.95)",
        cardBorder: "rgba(147, 51, 234, 0.35)",
        textMain: "#581c87",
        textSub: "#6b21a8",
        accent: "#9333ea"
      }
    },
    {
      id: "orange-sea",
      name: "🍊 橘子汽水",
      tag: "明朗 / 海风",
      desc: "海边傍晚的暖杏夕阳橘，细碎的金色波光与气泡升腾翻滚",
      particleType: "seaSpray",
      themeType: "light",
      colors: {
        bg: "radial-gradient(circle at center top, #fff7ed 0%, #ffedd5 60%, #fed7aa 100%)",
        cardBg: "rgba(255, 255, 255, 0.95)",
        cardBorder: "rgba(234, 88, 12, 0.35)",
        textMain: "#7c2d12",
        textSub: "#9a3412",
        accent: "#ea580c"
      }
    }
  ]
};
