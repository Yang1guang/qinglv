/**
 * ====================================================================
 * 太阳 ios-IP · 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: js/config.js
 * 作用: 全站唯一客户个性化数据配置中枢 (小白 1 分钟极速交付)
 * ====================================================================
 */

window.LOVE_CONFIG = {
  // ================= 1. 基础档案 (必填) =================
  meta: {
    boyName: "张小阳", // 男生姓名/昵称
    girlName: "李小光", // 女生姓名/昵称
    // 恋爱起始时间 (格式务必严格: YYYY-MM-DD HH:mm:ss)
    startDate: "2024-05-20 13:14:00",
    // 下一个重大纪念日标题与日期
    nextMilestoneTitle: "两周年纪念日",
    nextMilestoneDate: "2026-05-20 00:00:00",
    // 网页大标题与副标题
    siteTitle: "我们的漫游宇宙 · 陪伴倒计时",
    siteSubtitle: "山水一程，三生有幸 · 属于我们的数字博物馆"
  },

  // ================= 2. 门禁解锁关卡 (沉浸式解密) =================
  gatekeeper: {
    enabled: true, // 是否开启密码锁 (true: 开启, false: 直接进入)
    title: "🔒 验证默契档案",
    question: "输入我们第一次确认关系的纪念日 (6位数字)：",
    hint: "提示：2024年5月20日 ➔ 240520",
    correctAnswer: "240520", // 正确密码 (不区分大小写)
    // 答错时的随机调侃提示语列表
    errorTips: [
      "不对哦，再想想！罚亲一口 😚",
      "密码错误！小本本记仇 +1 📝",
      "是不是把重要的日子给忘了？危险警告 ⚠️",
      "提示都在上面写着啦，笨蛋！❤️"
    ]
  },

  // ================= 3. 音频系统与背景音乐 =================
  audio: {
    bgmAutoPlay: false, // 是否尝试自动播放背景音乐 (受移动端策略限制，进场后点击触发最稳)
    bgmUrl: "assets/audio/bgm-romantic.mp3", // 背景音乐链接
    bgmTitle: "Sweet Memories",
    bgmArtist: "Romantic Ensemble",
    vinylCover: "assets/images/vinyl-cover.jpg", // 黑胶唱片封面图
    // 交互音效路径
    sounds: {
      gatekeeperPass: "assets/audio/pass.mp3",
      gatekeeperError: "assets/audio/error.mp3",
      scratch: "assets/audio/scratch.mp3",
      stamp: "assets/audio/stamp.mp3",
      flip: "assets/audio/flip.mp3"
    }
  },

  // ================= 4. 打字机真情告白 =================
  letter: {
    title: "致我最珍贵的女孩",
    // 告白正文 (使用 | 符号进行自然停顿分段)
    content: "从遇见你的第一天起，我的整个世界都亮了起来。| 感谢你陪我走过四季变换，包容我所有的小脾气。| 无论星河如何变幻，你永远是我唯一的航向标。| 故事才刚刚开始，余生请多指教。✨",
    signDate: "2026.05.20",
    signature: "永远爱你的 小阳"
  },

  // ================= 5. 时光轴节点 (拍立得卡片库) =================
  timeline: [
    {
      id: "node_1",
      date: "2024.05.20",
      tag: "初遇心动",
      title: "第一次目光交汇的咖啡馆",
      desc: "那天阳光正好，你穿着白色的连衣裙，逆着光走过来的一瞬间，我就知道沦陷了。",
      location: "📍 晴天咖啡馆",
      frontImg: "assets/images/photo_01.jpg", // 拍立得正面照片
      backText: "那天我偷偷拍了你的背影，其实手抖得连对焦都对不准。", // 拍立得背面手写留言
      voiceAudio: "assets/audio/voice_01.mp3" // 可选: 专属情话语音片段
    },
    {
      id: "node_2",
      date: "2024.10.01",
      tag: "海边日落",
      title: "吹着晚风，听海浪说喜欢你",
      desc: "我们光着脚踩在退潮的沙滩上，烟花绽放的瞬间，你转头对我说‘好想一直这样’。",
      location: "📍 黄金海岸沙滩",
      frontImg: "assets/images/photo_02.jpg",
      backText: "海风很咸，但那一刻握着你的手，甜到了心里。",
      voiceAudio: ""
    },
    {
      id: "node_3",
      date: "2025.01.01",
      tag: "跨年之夜",
      title: "在零点的钟声里拥抱",
      desc: "数万人倒计时的时候，我在漫天飞舞的彩带里紧紧抱住了你，许下关于以后的愿望。",
      location: "📍 城市中心广场",
      frontImg: "assets/images/photo_03.jpg",
      backText: "每年的零点，我身边的人都只能是你。",
      voiceAudio: ""
    }
  ],

  // ================= 6. 恋爱 100 件小事 (精选示例) =================
  checklist100: [
    { id: 1, title: "一起在海边看一次日出", completed: true },
    { id: 2, title: "一起坐摩天轮并在最高点接吻", completed: true },
    { id: 3, title: "穿情侣装去游乐园打卡", completed: true },
    { id: 4, title: "为对方亲手做一顿烛光晚餐", completed: false },
    { id: 5, title: "在雨天共撑一把伞漫步", completed: true },
    { id: 6, title: "一起去听一场偶像的演唱会", completed: false },
    { id: 7, title: "去没有光污染的山顶数流星", completed: false },
    { id: 8, title: "一起自驾去远方公路旅行", completed: false }
  ],

  // ================= 7. 恋爱特权刮刮乐兑换券 =================
  scratchCards: [
    {
      id: "card_1",
      title: "无条件原谅券",
      content: "凭此券可无条件平息一次争吵，男方必须立刻认错并附带抱抱！",
      icon: "🕊️",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_2",
      title: "深夜外卖买单券",
      content: "无论多晚，指定想吃的外卖由男方全额买单并送至手上！",
      icon: "🍟",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_3",
      title: "揉肩捏腿 30 分钟",
      content: "享受 VIP 级上门按摩服务，力度任选，随时可兑现！",
      icon: "💆",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_4",
      title: "任意心愿神仙卡",
      content: "空白特权券！由持券人自由指定任意心愿，不得拒绝！",
      icon: "👑",
      scratched: false,
      used: false,
      usedTime: ""
    }
  ],

  // ================= 8. 隐藏彩蛋 (角落微互动) =================
  easterEggs: [
    {
      id: "egg_1",
      selector: "#egg-star",
      message: "🌟 发现第一颗暗号星：恭喜你捕捉到了宇宙里最想念你的心跳！"
    },
    {
      id: "egg_2",
      selector: "#egg-paw",
      message: "🐾 踩到猫爪印啦：奖励今晚获得小阳为你洗一次头发！"
    }
  ]
};
