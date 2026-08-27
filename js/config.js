/**
 * 众水不灭 · 雅歌之印 (Love Universe)
 * 文件名: js/config.js
 * 核心理念: 婚姻是圣洁的、爱情是坚强的。包容、接纳、舍己、付出。
 */

window.LOVE_CONFIG = {
  // ================= 0. 情感生命周期与视觉配置 =================
  lifecycle: {
    currentPhase: "dating" // dating(恋爱期) / engaged(订婚期) / married(结婚期)
  },
  theme: {
    currentTheme: "sunset-twilight",
    customBgUrl: ""
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
    errorTips: [
      "没关系，慢慢想，我一直都在这里等你。",
      "记忆偶尔会迷路，但我们的爱永远是归途。",
      "不要着急，深呼吸，我会包容你所有的粗心小毛病。",
      "就算密码被遗忘，我对你的承诺也永不改变。",
      "就算你忘记了全世界，我也接纳此时此刻的你。"
    ]
  },

  // ================= 3. 音频系统 =================
  audio: {
    bgmAutoPlay: true,
    bgmUrl: "https://music.163.com/song/media/outer/url?id=436514312.mp3",
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
    title: "致我生命中的唯一",
    content: "爱情胜过死亡，众水不能熄灭，大水不能淹没。| 爱情不是讲理的地方，而是理解、包容、接纳、舍己、付出、爱的地方。| 在漫长的一生一世里，我愿用尽全部的坚强，做你最踏实的避风港。| 故事才刚刚开始，余生请多指教。✨",
    signDate: "2026.05.20",
    signature: "永远爱你的 小阳"
  },

  // ================= 5. 时光轴节点 =================
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

  // ================= 6. 100 件同行小事清单 (严格按 phase 划分，恋爱期绝不越界) =================
  checklist100: [
    // --- Phase 1: 恋爱期 (尊重、接纳、精神守望与克制) ---
    { id: 1, phase: 1, title: "一起在海边看一次日出破晓", completed: true },
    { id: 2, phase: 1, title: "在夏天下暴雨时共撑一把伞漫步走回学校/车站", completed: true },
    { id: 3, phase: 1, title: "【酸·委屈】当你因压力发无名火时，我选择咽下委屈温柔问你累不累", completed: false },
    { id: 4, phase: 1, title: "【冷·疏离】在你情绪低落想静静时，不强迫沟通，默默守望等你回头", completed: false },
    { id: 5, phase: 1, title: "【苦·低谷】在你遭遇重大失败时绝不说教，坚定告诉你你永远闪闪发光", completed: true },
    { id: 6, phase: 1, title: "【甜·用心】悄悄买下你几个月前随口提过的小愿望，在平凡的日子里送给你", completed: true },
    { id: 7, phase: 1, title: "【痛·疗愈】倾听你童年或家庭的软弱伤痕，给予最温柔深情的保密与接纳", completed: false },
    { id: 8, phase: 1, title: "一起去福利机构或动物收容所当一次义工，感受彼此的善良", completed: false },
    { id: 9, phase: 1, title: "郑重、真诚地拜访彼此的长辈，学会去爱养育你长大的人", completed: false },
    { id: 10, phase: 1, title: "给对方吹干头发并轻轻梳顺", completed: true },
    { id: 11, phase: 1, title: "一起拼完一幅 1000 块的高难度拼图并装框留念", completed: false },
    { id: 12, phase: 1, title: "在雪地里打雪仗、堆一个只属于我们两人的雪人", completed: false },
    { id: 13, phase: 1, title: "去水族馆隔着玻璃看巨大的鲸鲨游过", completed: false },
    { id: 14, phase: 1, title: "教对方学会一项自己最擅长的技能或乐器", completed: false },
    { id: 15, phase: 1, title: "在夕阳西下的天台上喝着饮料聊关于以后的梦想", completed: false },
    { id: 16, phase: 1, title: "手牵手逛完一整座博物馆并认真读完每一处历史", completed: false },
    { id: 17, phase: 1, title: "在夜市里从街头吃到街尾，互相投喂可口小吃", completed: true },
    { id: 18, phase: 1, title: "在纪念日当天手写一封长长的纸质情书寄给对方", completed: false },
    { id: 19, phase: 1, title: "一起看一次秋天的满山红叶或银杏大道", completed: false },
    { id: 20, phase: 1, title: "吵架后不管多生气，绝不带情绪过夜，主动温和和好", completed: true },

    // --- Phase 2: 订婚期 (契约、预备、利益舍己) ---
    { id: 21, phase: 2, title: "共同挑选对戒并在内侧刻上专属盟约", completed: false },
    { id: 22, phase: 2, title: "【辣·冲突】在筹备未来或两家风俗分歧时，主动为未来做出妥协与舍己", completed: false },
    { id: 23, phase: 2, title: "【酸·焦虑】婚前焦虑恐惧时，握紧双手重温一路走来的初心", completed: false },
    { id: 24, phase: 2, title: "【苦·共担】坦诚彼此财务与规划，共同制定未来小家的奋斗蓝图", completed: false },
    { id: 25, phase: 2, title: "共同写一封‘致五年后我们’的信并封存进时光胶囊", completed: false },
    { id: 26, phase: 2, title: "去宜家像布置未来小家一样试躺每一张沙发", completed: true },
    { id: 27, phase: 2, title: "穿上正装与礼服去吃一次正式的浪漫晚宴", completed: false },
    { id: 28, phase: 2, title: "一起坐慢速绿皮火车看窗外风景慢慢倒退", completed: false },
    { id: 29, phase: 2, title: "在长辈面前坚定地维护对方，成为对方最坚实的后盾", completed: false },
    { id: 30, phase: 2, title: "一起为未来小家挑选第一盆充满生机的绿植", completed: false },

    // --- Phase 3: 结婚期 (合为一体、同居烟火气、病榻长情) ---
    { id: 31, phase: 3, title: "在深夜为晚归的伴侣留一盏暖黄色的灯，热好饭菜", completed: false },
    { id: 32, phase: 3, title: "【痛·疾病】在对方生重病、最脆弱不堪时整夜守护在床边细心照顾", completed: false },
    { id: 33, phase: 3, title: "每天清晨醒来，给身边的伴侣一个安稳踏实的早安吻", completed: false },
    { id: 34, phase: 3, title: "【冷·倦怠】在日复一日的平淡柴米油盐中，依然在下班路上带回一束花", completed: false },
    { id: 35, phase: 3, title: "【辣·争吵】哪怕白天吵架，睡觉前依然从背后环抱和解", completed: false },
    { id: 36, phase: 3, title: "【甜·分担】在你连续加班的早晨，悄悄关掉闹钟代你做好早餐与家务", completed: false },
    { id: 37, phase: 3, title: "【苦·患难】遭遇人生或家庭重大变故时，微笑着对你说我们一起从头再来", completed: false },
    { id: 38, phase: 3, title: "亲手为对方做一顿四菜一汤的烛光晚餐", completed: false },
    { id: 39, phase: 3, title: "一起逛清晨充满烟火气的菜市场，挑选新鲜食材", completed: true },
    { id: 40, phase: 3, title: "在厨房里一个人做饭，另一个人从背后温柔环抱", completed: false },
    { id: 41, phase: 3, title: "冬天躲在同一床被窝里通宵看经典老电影", completed: false },
    { id: 42, phase: 3, title: "在对方熟睡时偷偷看着睡颜幸福地笑出声", completed: false },
    { id: 43, phase: 3, title: "小心翼翼地为对方修剪一次指甲", completed: false },
    { id: 44, phase: 3, title: "在深夜街头一起喝一碗热气腾腾的馄饨", completed: false },
    { id: 45, phase: 3, title: "一起规划一次属于两个人的长途度假旅行", completed: false },
    { id: 46, phase: 3, title: "给彼此起一个只有我们俩知道的专属昵称", completed: true },
    { id: 47, phase: 3, title: "在客厅不开灯，踏着轻柔的音乐紧紧相拥慢摇", completed: false },
    { id: 48, phase: 3, title: "一起跨越漫长岁月，一直坚定地走到金婚白头", completed: false }
  ],

  // ================= 7. 舍己与包容特权券 (按 phase 分层) =================
  scratchCards: [
    // Phase 1: 恋爱期特权
    {
      id: "card_1",
      phase: 1,
      title: "绝对倾听接纳卡",
      content: "放下手机，全心全意听你诉说十分钟的烦恼与委屈，不评判、不说教，只给完全的接纳！",
      icon: "👂",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_2",
      phase: 1,
      title: "情绪降温暂停卡",
      content: "出现争执快要吵架时亮出此卡，双方无条件暂停争论十分钟，冷静后用最温柔的语气对话！",
      icon: "🕊️",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_3",
      phase: 1,
      title: "专属风雨代步券",
      content: "无论刮风下雨，只要一个消息，对方带着雨伞与温水准时出现在门口接你！",
      icon: "🚗",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_4",
      phase: 1,
      title: "耐心陪逛陪玩卡",
      content: "陪逛街、试衣服或打游戏半天，全程提包支援，保持全程微笑与专注！",
      icon: "🛍️",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_5",
      phase: 1,
      title: "专属水果投喂券",
      content: "想吃西瓜切块、葡萄剥皮或芒果切丁，对方负责洗净切好投喂到嘴边！",
      icon: "🍉",
      scratched: false,
      used: false,
      usedTime: ""
    },

    // Phase 2: 订婚期特权
    {
      id: "card_6",
      phase: 2,
      title: "无条件退让一步卡",
      content: "在筹备婚礼或面对未来规划分歧时出示此卡，我心甘情愿为你退让一次，你比对错重要！",
      icon: "🤝",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_7",
      phase: 2,
      title: "绝对后盾支撑卡",
      content: "当你面对外界压力或感到孤立无援时，我将无条件坚定站在你身边做你最坚固的磐石！",
      icon: "🛡️",
      scratched: false,
      used: false,
      usedTime: ""
    },

    // Phase 3: 结婚期特权
    {
      id: "card_8",
      phase: 3,
      title: "烟火家务全包金牌",
      content: "今天所有的买菜、做饭、洗碗、扫地等一切家务全由我一人承包，安心当树懒！",
      icon: "🧹",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_9",
      phase: 3,
      title: "十分钟无言深拥卡",
      content: "受了委屈或感到疲惫时出示此卡，无需言语解释，立刻给你一个十分钟的长久拥抱！",
      icon: "🫂",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_10",
      phase: 3,
      title: "情绪休假 24 小时卡",
      content: "婚姻里撑不住时出示此卡，拥有 24 小时绝对摆烂权，不用管琐事，家里一切由我顶着！",
      icon: "🛌",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_11",
      phase: 3,
      title: "温柔洗头吹发 VIP",
      content: "享受专属洗头与吹风机造型护理一次，包含轻柔头部按摩，包君满意！",
      icon: "💆‍♀️",
      scratched: false,
      used: false,
      usedTime: ""
    },
    {
      id: "card_12",
      phase: 3,
      title: "深夜外卖买单卡",
      content: "无论多晚，指定想喝的奶茶或想吃的夜宵，由对方全额买单并送至手上！",
      icon: "🍟",
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
      message: "🌟 发现暗号星：爱情是一生一世、一男一女、一心一意！"
    },
    {
      id: "egg_2",
      selector: "#egg-paw",
      message: "🐾 踩到猫爪印：今晚为你做一顿可口的晚餐！"
    }
  ]
};
