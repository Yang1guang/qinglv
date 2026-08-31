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
    voiceVows: "开心, 喜乐, 永远爱你, 240520",
    errorTips: [
      "没关系，慢慢想，我一直都在这里等你。",
      "记忆偶尔会迷路，但我们的爱永远是归途。",
      "不要着急，深呼吸，我会包容你所有的粗心小毛病。",
      "就算密码被遗忘，我对你的承诺也永不改变。",
      "就算你忘记了全世界，我也接纳此时此刻的你。"
    ]
  },

  // ================= 3. 专属黑胶播放列表 =================
  audio: {
    bgmAutoPlay: true,
    playMode: "list-loop",
    bgmTitle: "告白气球",
    bgmArtist: "二珂",
    bgmUrl: "/api/love/music-stream?hash=F4726605D01122AD14206E4EBFD3D2E1&album_id=0&title=%E5%91%8A%E7%99%BD%E6%B0%94%E7%90%83&artist=%E4%BA%8C%E7%8F%82",
    vinylCover: "",
    playlist: []
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
      backText: "结婚后的每一个零点，我身边的人都只能是你。",
      voiceAudio: ""
    }
  ],

  // ================= 6. 隐藏彩蛋 =================
  easterEggs: [
    {
      id: "egg_1",
      selector: "#egg-star",
      message: "🌟 发现暗号星：一生一世、一男一女、一心一意！"
    },
    {
      id: "egg_2",
      selector: "#egg-paw",
      message: "🐾 踩到猫爪印：今晚为你做一顿可口的晚餐！"
    }
  ],

  // ================= 7. 倒数日与恒久纪念日 (支持公历/农历/生日/周年/单次目标) =================
  anniversaries: [
    {
      id: "anni_1",
      title: "初次牵手 · 确立恋爱契约",
      type: "countup",
      isLunar: false,
      isLeapMonth: false,
      date: "2024-05-20",
      annualRepeat: false,
      icon: "💖",
      tag: "恋爱起点",
      memo: "那一天的晚风很温柔，牵起你手的那一刻，我知道余生有了归宿。",
      bgImg: "assets/images/photo_01.jpg",
      voiceAudio: "",
      pinToHero: true
    },
    {
      id: "anni_2",
      title: "她的农历生日",
      type: "countdown",
      isLunar: true,
      isLeapMonth: false,
      date: "1998-04-15",
      annualRepeat: true,
      icon: "🎂",
      tag: "专属诞辰",
      memo: "愿你一生被爱，眼里常有星辰大海，笑里全是不染尘埃的纯真。",
      bgImg: "assets/images/photo_02.jpg",
      voiceAudio: "",
      pinToHero: false
    },
    {
      id: "anni_3",
      title: "他的公历生日",
      type: "countdown",
      isLunar: false,
      isLeapMonth: false,
      date: "1996-10-24",
      annualRepeat: true,
      icon: "🪐",
      tag: "先生生辰",
      memo: "感谢你的坚毅与温柔，做我们小家庭永远遮风挡雨的港湾。",
      bgImg: "",
      voiceAudio: "",
      pinToHero: false
    },
    {
      id: "anni_4",
      title: "预定神圣婚典 · 领证之约",
      type: "target",
      isLunar: false,
      isLeapMonth: false,
      date: "2026-10-01",
      annualRepeat: false,
      icon: "💍",
      tag: "共赴白头",
      memo: "在上帝与众人见证下，缔结一生一世不可分开的神圣盟约。",
      bgImg: "assets/images/photo_03.jpg",
      voiceAudio: "",
      pinToHero: false
    }
  ],

  // ================= 🌟 8. 破冰与情感信号箱 (严格三阶段伦理边界与避风港契约) =================
  icebreaker: {
    enabled: true,
    cooldownMinutes: 15, // 情绪冷静期冷却时长
    soundEnabled: true,
    actions: {
      // 🌿 恋爱期：坚守圣洁界限，严禁同居与室内私密行为引导
      dating: [
        {
          id: "calm_down",
          type: "calm_down",
          label: "我需要冷静",
          icon: "🌧️",
          desc: "我有些情绪，需要安静片刻，但请放心，我不会走开，待会儿通个电话好吗？"
        },
        {
          id: "break_ice",
          type: "break_ice",
          label: "我想和好",
          icon: "🟡",
          desc: "今天天气很好，我们不吵了好不好？待会儿一起去散散步。"
        },
        {
          id: "apology",
          type: "apology",
          label: "真诚道歉",
          icon: "🙇‍♂️",
          desc: "刚才是我态度不好、太急躁了，对不起，我愿意安静听你的感受。"
        },
        {
          id: "miss_you",
          type: "miss_you",
          label: "我很想你",
          icon: "💖",
          desc: "即使有分歧，我心里依然全是你，想念你的笑容。"
        },
        {
          id: "warm_hug",
          type: "warm_hug",
          label: "隔空抱抱",
          icon: "☁️",
          desc: "隔空送你一朵云朵拥抱和一杯热可可，不要再生气啦。"
        }
      ],
      // 💍 订婚期：盟约预备，化解现实筹备焦虑，不涉同居
      engaged: [
        {
          id: "calm_down",
          type: "calm_down",
          label: "暂停冷静",
          icon: "☕",
          desc: "筹备有些心力交瘁，我们先冷静下来，喝杯咖啡，别伤了彼此的初心。"
        },
        {
          id: "break_ice",
          type: "break_ice",
          label: "递个台阶",
          icon: "📜",
          desc: "比起眼前的分歧，我们的约定更珍贵。今晚开个视频对齐想法好吗？"
        },
        {
          id: "apology",
          type: "apology",
          label: "诚恳道歉",
          icon: "🙇‍♂️",
          desc: "我对不起你，刚才把现实的焦虑迁怒到了你身上，我向你道歉。"
        },
        {
          id: "miss_you",
          type: "miss_you",
          label: "重温誓言",
          icon: "💍",
          desc: "我们是一体的，无论面对多大挑战，我都坚定选择与你同行。"
        },
        {
          id: "warm_hug",
          type: "warm_hug",
          label: "坚定支持",
          icon: "🤝",
          desc: "再多繁杂的事情我们一起扛，别怕，有我在你身边。"
        }
      ],
      // 🏠 结婚期：合为一体，实体避风港，不可含怒到日落
      married: [
        {
          id: "calm_down",
          type: "calm_down",
          label: "情绪降温",
          icon: "📖",
          desc: "我先在书房安静一会儿，不可含怒到日落，待会儿就出来抱你。"
        },
        {
          id: "break_ice",
          type: "break_ice",
          label: "我想和好",
          icon: "🍎",
          desc: "家是讲爱的地方不是讲理的地方。厨房有切好的水果和温水，我们谈谈心。"
        },
        {
          id: "apology",
          type: "apology",
          label: "放下固执",
          icon: "🙇‍♂️",
          desc: "在这个家里你才是最重要的，我放下我的固执，对不起，过来抱一下。"
        },
        {
          id: "miss_you",
          type: "miss_you",
          label: "你是唯一",
          icon: "💖",
          desc: "柴米油盐是你，风花雪月也是你，执子之手，与子偕老。"
        },
        {
          id: "warm_hug",
          type: "warm_hug",
          label: "避风港湾",
          icon: "🏠",
          desc: "风雨再大，这里永远是你的避风港，我一直在。"
        }
      ]
    }
  }
};
