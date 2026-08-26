/**
 * ====================================================================
 * 恋爱时光轴 & 漫游宇宙 (Love Universe)
 * 文件名: js/config.js
 * 作用: 全站个性化数据配置中枢 (生活化 100 件事清单 + 趣味特权刮刮乐)
 * ====================================================================
 */

window.LOVE_CONFIG = {
  // ================= 0. 主题视觉配置 =================
  theme: {
    currentTheme: "sunset-twilight", // 默认：暮色星河 (可选 sakura-romance / cyber-space / firefly-forest / warm-ember / sweet-dream)
    customBgUrl: "" // 可选：自定义高清背景大图直链
  },

  // ================= 1. 基础档案 =================
  meta: {
    boyName: "张小阳",
    girlName: "李小光",
    startDate: "2024-05-20 13:14:00",
    nextMilestoneTitle: "两周年纪念日",
    nextMilestoneDate: "2026-05-20 00:00:00",
    siteTitle: "我们的漫游宇宙 · 陪伴倒计时",
    siteSubtitle: "山水一程，三生有幸 · 属于我们的数字博物馆"
  },

  // ================= 2. 门禁关卡 =================
  gatekeeper: {
    enabled: true,
    title: "🔒 验证默契档案",
    question: "输入我们第一次确认关系的纪念日 (6位数字)：",
    hint: "提示：2024年5月20日 ➔ 240520",
    correctAnswer: "240520",
    errorTips: [
      "不对哦，再想想！罚亲一口 😚",
      "密码错误！小本本记仇 +1 📝",
      "是不是把重要的日子给忘了？危险警告 ⚠️",
      "提示都在上面写着啦，笨蛋！❤️"
    ]
  },

  // ================= 3. 音频系统与背景音乐 =================
  audio: {
    bgmAutoPlay: true,
    bgmUrl: "https://music.163.com/song/media/outer/url?id=436514312.mp3", // 周杰伦 - 告白气球
    bgmTitle: "告白气球",
    bgmArtist: "周杰伦",
    vinylCover: "",
    sounds: {
      gatekeeperPass: "",
      gatekeeperError: "",
      scratch: "",
      stamp: "",
      flip: ""
    }
  },

  // ================= 4. 打字机真情告白 =================
  letter: {
    title: "致我最珍贵的女孩",
    content: "从遇见你的第一天起，我的整个世界都亮了起来。| 感谢你陪我走过四季变换，包容我所有的小脾气。| 无论星河如何变幻，你永远是我唯一的航向标。| 故事才刚刚开始，余生请多指教。✨",
    signDate: "2026.05.20",
    signature: "永远爱你的 小阳"
  },

  // ================= 5. 时光轴节点 =================
  timeline: [
    {
      id: "node_1",
      date: "2024.05.20",
      tag: "初遇心动",
      title: "第一次目光交汇的咖啡馆",
      desc: "那天阳光正好，你穿着白色的连衣裙，逆着光走过来的一瞬间，我就知道沦陷了。",
      location: "📍 晴天咖啡馆",
      frontImg: "assets/images/photo_01.jpg",
      backText: "那天我偷偷拍了你的背影，其实手抖得连对焦都对不准。",
      voiceAudio: ""
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

  // ================= 6. 恋爱 100 件小事清单 (精选 50 项真实生活与浪漫清单) =================
  checklist100: [
    { id: 1, title: "一起在海边看一次日出破晓", completed: true },
    { id: 2, title: "坐一次摩天轮并在最高点接吻", completed: true },
    { id: 3, title: "穿情侣装去游乐园痛快玩一天", completed: true },
    { id: 4, title: "亲手为对方做一顿四菜一汤的烛光晚餐", completed: false },
    { id: 5, title: "在夏天下暴雨时共撑一把伞漫步回家", completed: true },
    { id: 6, title: "一起去现场听一场最喜欢歌手的演唱会", completed: false },
    { id: 7, title: "在远离城市的山顶露营，数着流星入睡", completed: false },
    { id: 8, title: "来一场说走就走的公路自驾旅行", completed: false },
    { id: 9, title: "冬天躲在同一床被窝里通宵看老电影", completed: true },
    { id: 10, title: "一起去拍一组搞怪又甜蜜的九宫格大头贴", completed: true },
    { id: 11, title: "在对方生病时寸步不离地煮粥照顾一整天", completed: false },
    { id: 12, title: "一起去陶艺馆亲手捏一对刻着名字的对杯", completed: false },
    { id: 13, title: "换上睡衣在客厅里不开灯踩着音乐慢摇", completed: false },
    { id: 14, title: "一起逛周末清晨的菜市场，挑选新鲜食材", completed: true },
    { id: 15, title: "给对方吹干头发并轻轻梳顺", completed: true },
    { id: 16, title: "一起拼完一幅 1000 块的高难度拼图并装框", completed: false },
    { id: 17, title: "在雪地里打雪仗、堆一个两人的专属雪人", completed: false },
    { id: 18, title: "去水族馆隔着玻璃看巨大的鲸鲨游过", completed: false },
    { id: 19, title: "偷偷给对方准备一份藏在口袋里的惊喜小礼物", completed: true },
    { id: 20, title: "教对方学会一项自己最擅长的技能或游戏", completed: false },
    { id: 21, title: "在夕阳西下的天台上喝着啤酒聊未来", completed: false },
    { id: 22, title: "一起养一盆绿植并把它养到开花", completed: false },
    { id: 23, title: "早晨醒来在阳光里给对方一个长长的早安吻", completed: true },
    { id: 24, title: "去对方从小长大的小学和老街巷走一走", completed: false },
    { id: 25, title: "一起去古镇或寺庙真诚地为彼此祈福挂红丝带", completed: false },
    { id: 26, title: "在厨房里一个人做饭，另一个人从背后环抱", completed: true },
    { id: 27, title: "去宜家像布置未来小家一样试躺每一张沙发", completed: true },
    { id: 28, title: "穿上正装和礼服去吃一次正式的浪漫西餐", completed: false },
    { id: 29, title: "一起坐慢速绿皮火车看窗外风景慢慢倒退", completed: false },
    { id: 30, title: "在喝微醺后吐露平时不好意思说的肉麻情话", completed: false },
    { id: 31, title: "把对方随口说过的愿望悄悄记在备忘录里并逐一实现", completed: true },
    { id: 32, title: "一起去动物收容所当一次义工喂猫撸狗", completed: false },
    { id: 33, title: "手牵手逛完一整座博物馆并认真读每段介绍", completed: false },
    { id: 34, title: "在夜市里从街头吃到街尾，互相投喂小吃", completed: true },
    { id: 35, title: "一起去采摘园摘草莓或樱桃，吃到饱为止", completed: false },
    { id: 36, title: "在对方睡着时偷偷看着睡颜笑出声", completed: true },
    { id: 37, title: "一起去海边捡贝壳并把它们做成纪念标本", completed: false },
    { id: 38, title: "两个人戴着同一副耳机听同一首歌散步", completed: true },
    { id: 39, title: "在纪念日当天手写一封长长的纸质情书寄给对方", completed: false },
    { id: 40, title: "一起看一次秋天的满山红叶或银杏大道", completed: false },
    { id: 41, title: "在失落难过时给对方一个最踏实温暖的怀抱", completed: true },
    { id: 42, title: "一起去电玩城抓娃娃直到把币全部投光", completed: true },
    { id: 43, title: "给彼此起一个只有两个人知道的专属幼稚绰号", completed: true },
    { id: 44, title: "在深夜街头吃一碗热气腾腾的小馄饨", completed: true },
    { id: 45, title: "一起规划一次属于两个人的长途度假旅行", completed: false },
    { id: 46, title: "在无人的草坪上并排躺着看云朵变换形状", completed: false },
    { id: 47, title: "给对方小心翼翼地修剪一次指甲", completed: false },
    { id: 48, title: "一起去烘焙店亲手烤一个并不完美但很甜的蛋糕", completed: false },
    { id: 49, title: "吵架后不管多生气，绝不过夜并在睡前和好", completed: true },
    { id: 50, title: "一起跨越漫长岁月，一直坚定地走到白头", completed: false }
  ],

  // ================= 7. 恋爱特权刮刮乐 (实用生活化特权卡，真实有爱) =================
  scratchCards: [
    {
      id: "card_1",
      title: "无条件和好券",
      content: "吵架拌嘴时亮出此券，双方必须立刻停止争论，男方主动认错并附带一个温暖长抱！",
      icon: "🕊️",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_2",
      title: "深夜外卖买单卡",
      content: "无论多晚，指定想喝的奶茶、炸鸡或夜宵，由对方全额买单并贴心送至手上！",
      icon: "🍟",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_3",
      title: "温柔洗头吹发 VIP",
      content: "享受专属洗头与吹风机造型护理一次，包含轻柔头部按摩，包君满意！",
      icon: "💆‍♀️",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_4",
      title: "家务全包免死金牌",
      content: "使用当天，所有的洗碗、扫地、倒垃圾等杂务全部由对方一人承包，安心当树懒！",
      icon: "🧹",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_5",
      title: "爱心定制晚餐点单券",
      content: "可任意指定 3 道想吃的拿手家常菜，对方负责买菜、下厨、摆盘与收拾！",
      icon: "🍳",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_6",
      title: "周末赖床早安抱抱卡",
      content: "周末早晨拥有无限期赖床特权，不催起床，并享受 30 分钟专属早安温存抱抱！",
      icon: "🛌",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_7",
      title: "电影题材绝对选择权",
      content: "下次看电影时，不论爱情片、恐怖片还是文艺片，完全由持券人 100% 决定！",
      icon: "🍿",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_8",
      title: "30 分钟全身解乏按摩",
      content: "享受捏肩、按背、揉腿全套服务，力度随叫随调，随时随地可兑现！",
      icon: "💆‍♂️",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_9",
      title: "耐心陪逛陪玩卡",
      content: "陪逛街试衣服或陪打游戏半天，全程负责提包/支援，保持全程微笑与耐心！",
      icon: "🛍️",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_10",
      title: "专属水果剥皮去核券",
      content: "想吃西瓜切块、葡萄剥皮或芒果切丁，对方负责洗净切好喂到嘴边！",
      icon: "🍉",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_11",
      title: "突然想吃甜品兑现券",
      content: "只要想吃冰淇淋或小蛋糕，对方无论刮风下雨都会买来送到身边！",
      icon: "🍦",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_12",
      title: "随叫随到接送卡",
      content: "下班或聚会结束时，只要一个电话，对方负责准时出现在门口接你回家！",
      icon: "🚗",
      scratched: false,
      used: false,
      usedTime: ""
    }
  ],

  // ================= 8. 隐藏彩蛋 =================
  easterEggs: [
    {
      id: "egg_1",
      selector: "#egg-star",
      message: "🌟 发现第一颗暗号星：恭喜你捕捉到了宇宙里最想念你的心跳！"
    },
    {
      id: "egg_2",
      selector: "#egg-paw",
      message: "🐾 踩到猫爪印啦：奖励今晚为你洗一次头发！"
    }
  ]
};
