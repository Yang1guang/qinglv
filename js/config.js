/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/config.js
 * 核心理念: 婚姻是圣洁的、爱情是坚强的。包容、接纳、舍己、付出。
 */

window.LOVE_CONFIG = {
  // ================= 0. 情感生命周期与视觉配置 =================
  lifecycle: {
    currentPhase: "dating"
  },
  theme: {
    currentThemeBoy: "sunset-twilight",
    currentThemeGirl: "french-cream",
    customBgUrlBoy: "",
    customBgUrlGirl: ""
  },

  // ================= 1. 基础档案与灵魂印记 =================
  meta: {
    boyName: "张小阳",
    girlName: "李小光",
    startDate: "2024-05-20 13:14:00",
    nextMilestoneTitle: "两周年纪念日",
    nextMilestoneDate: "2026-05-20 00:00:00",
    siteTitle: "众水不灭 · 我们的恒久印记",
    siteSubtitle: "众水不能熄灭爱情，大水不能淹没 · 一生一世的契约"
  },

  // ================= 2. 门禁关卡与包容提示 =================
  gatekeeper: {
    enabled: true,
    title: "🔒 验证恒久契约",
    question: "输入我们第一次确认关系的纪念日 (6位数字)：",
    hint: "提示：2024年5月20日 ➔ 240520",
    correctAnswer: "240520",
    voiceVows: "众水不能熄灭, 我愿一生包容你, 永远爱你, 240520",
    errorTips: [
      "没关系，慢慢想，我一直都在这里等你。",
      "记忆偶尔会迷路，但我们的爱永远是归途。",
      "不要着急，深呼吸，我会包容你所有的粗心小毛病。",
      "就算密码被遗忘，我对你的承诺也永不改变。",
      "就算你忘记了全世界，我也接纳此时此刻的你。"
    ]
  },

  // ================= 3. 专属黑胶播放列表 (默认纯净空列表，统一采用二珂版告白气球起播) =================
  audio: {
    bgmAutoPlay: true,
    playMode: "list-loop",
    bgmTitle: "告白气球",
    bgmArtist: "二珂",
    bgmUrl: "/api/love/music-stream?hash=F4726605D01122AD14206E4EBFD3D2E1&album_id=0&title=%E5%91%8A%E7%99%BD%E6%B0%94%E7%90%83&artist=%E4%BA%8C%E7%8F%82",
    vinylCover: "",
    playlist: [] // 初始默认为纯净空列表，无需手动删除预设曲目，用户可后续自由添加
  },

  // ================= 4. 打字机真情告白 =================
  letter: {
    title: "致我生命中的唯一",
    content: "爱情胜过死亡，众水不能熄灭，大水不能淹没。| 爱情不是讲理的地方，而是理解、包容、接纳、舍己、付出、爱的地方。| 在漫长的一生一世里，我愿用尽全部的坚强，做你最踏实的避风港。| 故事才刚刚开始，余生请多指教。✨",
    signDate: "2026.05.20",
    signature: "永远爱你的 小阳"
  },

  // ================= 5. 时光轴节点 (支持背面 60 秒专属录音直链) =================
  timeline: [
    {
      id: "node_1",
      date: "2024.05.20",
      tag: "初遇心动",
      title: "第一次目光交汇的午后",
      desc: "那天阳光正好，逆着光走过来的那一刻，我就知道生命因你而完整。",
      location: "📍 晴天咖啡馆",
      frontImg: "assets/images/photo_01.jpg",
      backText: "那天我偷偷注视着你，手心全是紧张的温度。",
      voiceAudio: ""
    },
    {
      id: "node_2",
      date: "2024.10.01",
      tag: "海边守望",
      title: "听海浪诉说永恒",
      desc: "我们在退潮的海岸边漫步，晚风微凉，但握着你的手掌却格外坚定。",
      location: "📍 黄金海岸",
      frontImg: "assets/images/photo_02.jpg",
      backText: "大水不能淹没，海风见证了我们的初心。",
      voiceAudio: ""
    },
    {
      id: "node_3",
      date: "2025.01.01",
      tag: "跨年之约",
      title: "在零点的钟声里许下诺言",
      desc: "数万人倒计时的时候，我在漫天彩带下握住你的手，许下一生一世的愿望。",
      location: "📍 城市广场",
      frontImg: "assets/images/photo_03.jpg",
      backText: "每年的零点，我身边的人都只能是你。",
      voiceAudio: ""
    }
  ],

  // ================= 6. 隐藏彩蛋 =================
  easterEggs: [
    {
      id: "egg_1",
      selector: "#egg-star",
      message: "🌟 发现暗号星：爱情是一生一世、一男一女、一心一意！"
    },
    {
      id: "egg_2",
      selector: "#egg-paw",
      message: "🐾 踩到猫爪印：今晚为你做一顿可口的晚餐！"
    }
  ]
};
