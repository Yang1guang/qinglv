/**
 * 众水不灭 · 雅歌之印
 * 文件名: js/stage-content.js
 * 作用: 独立管理恋爱期、订婚期、结婚期三大阶段专属的待办清单与舍己特权券数据
 * 核心准则: 严格界限隔离，恋爱期绝不出现越界同居或亲密日常
 */

window.STAGE_CONTENT = {
  // ================= 🌿 1. 恋爱期 (Dating Phase) =================
  dating: {
    title: "恋爱期待办清单",
    subtitle: "在尊重与接纳中了解彼此，坚守圣洁、克制与纯粹",
    scratchTitle: "恋爱期 · 舍己与包容特权券",
    checklist: [
      { id: "d_1", title: "一起在海边看一次清晨破晓的日出", completed: true },
      { id: "d_2", title: "在暴雨天共撑一把大伞漫步走回车站", completed: true },
      { id: "d_3", title: "【酸·委屈】当你因压力发无名火时，我选择咽下委屈温柔问你累不累", completed: false },
      { id: "d_4", title: "【冷·疏离】在你情绪低落想静静时，绝不强迫沟通，默默守望等你回头", completed: false },
      { id: "d_5", title: "【苦·低谷】在你遭遇重大挫折自我怀疑时绝不说教，坚定告诉你你永远闪闪发光", completed: true },
      { id: "d_6", title: "【甜·用心】悄悄买下你几个月前随口提过的小愿望，在平凡的日子里送给你", completed: true },
      { id: "d_7", title: "【痛·疗愈】倾听你童年或成长中的软弱伤痕，给予最温柔深情的保密与接纳", completed: false },
      { id: "d_8", title: "一起去流浪动物救助站或社区做一次义工，感受彼此的善良", completed: false },
      { id: "d_9", title: "郑重、真诚地拜访彼此的长辈，学会去爱那些养育你长大的人", completed: false },
      { id: "d_10", title: "共同读完一本关于性格与沟通的好书，深入交流彼此的心得", completed: false },
      { id: "d_11", title: "一起拼完一幅 1000 块的高难度拼图并装框留念", completed: false },
      { id: "d_12", title: "在冬天的雪地里堆一个写着我们名字的小雪人", completed: false },
      { id: "d_13", title: "去水族馆隔着玻璃看巨大的海洋生物游过", completed: false },
      { id: "d_14", title: "教对方学会一项自己最擅长的生活技能或乐器", completed: false },
      { id: "d_15", title: "在夕阳西下的天台上喝着热饮聊关于未来的纯真梦想", completed: false },
      { id: "d_16", title: "手牵手逛完一整座博物馆，认真读完每一处历史解说", completed: false },
      { id: "d_17", title: "在夜市里从街头吃到街尾，互相投喂可口小吃", completed: true },
      { id: "d_18", title: "在重要纪念日手写一封长长的纸质信件寄给对方", completed: false },
      { id: "d_19", title: "一起去郊外看一次没有光污染的漫天星空", completed: false },
      { id: "d_20", title: "出现分歧时绝不说伤害对方人格的重话，用理智与爱沟通", completed: true }
    ],
    scratchCards: [
      {
        id: "d_card_1",
        title: "绝对倾听接纳卡",
        content: "放下手机，全心全意听你诉说十分钟的烦恼与委屈，不评判、不说教，只给完全的接纳！",
        icon: "👂",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "d_card_2",
        title: "情绪降温暂停卡",
        content: "争执快要爆发时出示此卡，双方无条件暂停争论十分钟，冷静后用最温和的语气对话！",
        icon: "🕊️",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "d_card_3",
        title: "专属风雨代步券",
        content: "无论刮风下雨，只要一个消息，带着雨伞与温水准时出现在门口接你！",
        icon: "🚗",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "d_card_4",
        title: "耐心陪同支援卡",
        content: "陪逛街、买衣服或看展半天，全程提包支援，保持全程微笑与专注！",
        icon: "🛍️",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "d_card_5",
        title: "专属水果投喂券",
        content: "想吃西瓜切块、葡萄剥皮或芒果切丁，负责洗净切好投喂到嘴边！",
        icon: "🍉",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "d_card_6",
        title: "换位思考聆听卡",
        content: "发生误解时，先主动复述并理解对方的感受与委屈，不急于为自己辩解！",
        icon: "💡",
        scratched: false,
        used: false,
        usedTime: ""
      }
    ]
  },

  // ================= 💍 2. 订婚期 (Engaged Phase) =================
  engaged: {
    title: "订婚期待办清单",
    subtitle: "为一生一世的盟约做好准备，在磨合中学会舍己与妥协",
    scratchTitle: "订婚期 · 舍己与包容特权券",
    checklist: [
      { id: "e_1", title: "共同挑选对戒并在内侧刻上只属于我们两人的专属盟约", completed: false },
      { id: "e_2", title: "【辣·冲突】在筹备婚礼面对两家风俗分歧时，主动为彼此未来做出妥协与舍己", completed: false },
      { id: "e_3", title: "【酸·焦虑】面对婚前焦虑与未知恐惧时，紧握双手重温一路走来的初心", completed: false },
      { id: "e_4", title: "【苦·共担】坦诚彼此财务与未来规划，共同制定未来小家的奋斗蓝图", completed: false },
      { id: "e_5", title: "共同写一封‘致五年后我们’的信并封存进时光胶囊", completed: false },
      { id: "e_6", title: "去家居市场像布置未来小家一样，认真挑选未来的第一张餐桌", completed: true },
      { id: "e_7", title: "穿上正装与礼服去吃一次庄重的定盟晚宴", completed: false },
      { id: "e_8", title: "在长辈与亲友面前坚定地维护对方，做对方最坚实的心理后盾", completed: false },
      { id: "e_9", title: "一起为未来小家挑选第一盆充满生机的常青绿植", completed: false },
      { id: "e_10", title: "共同参加一次家庭沟通课程，为一生一世的长久相处做好心理预备", completed: false },
      { id: "e_11", title: "坐慢速火车去一座陌生城市，在慢节奏中磨合彼此的出行习惯", completed: false },
      { id: "e_12", title: "制定属于我们俩的相处原则：生气不可到日落，绝不把分歧带过夜", completed: true }
    ],
    scratchCards: [
      {
        id: "e_card_1",
        title: "无条件退让一步卡",
        content: "在筹备婚礼或面对未来规划分歧时出示，我心甘情愿为你退让一次，你比对错重要！",
        icon: "🤝",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "e_card_2",
        title: "绝对后盾支撑卡",
        content: "面对外界压力或感到孤立无援时出示，我将无条件坚定站在你身边做你最坚固的磐石！",
        icon: "🛡️",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "e_card_3",
        title: "婚前解压放空券",
        content: "感到筹备压力过大时出示，陪你远离烦扰彻底放空休息半天！",
        icon: "☕",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "e_card_4",
        title: "繁琐事务代办卡",
        content: "筹备过程中的繁琐采购与跑腿沟通，全部由我一人包揽搞定！",
        icon: "📋",
        scratched: false,
        used: false,
        usedTime: ""
      }
    ]
  },

  // ================= 🏠 3. 结婚期 (Married Phase) =================
  married: {
    title: "结婚期待办清单",
    subtitle: "合为一体，同甘共苦，在长相厮守与柴米油盐中践行真爱",
    scratchTitle: "结婚期 · 舍己与包容特权券",
    checklist: [
      { id: "m_1", title: "在深夜为晚归的伴侣留一盏暖黄色的灯，并热好饭菜", completed: false },
      { id: "m_2", title: "【痛·疾病】在对方生重病、最憔悴脆弱时整夜守在床前细心喂水照顾", completed: false },
      { id: "m_3", title: "每天清晨醒来，给身边的伴侣一个充满爱意与踏实感的早安问候", completed: false },
      { id: "m_4", title: "【冷·倦怠】在日复一日的平淡柴米油盐中，依然在下班路上带回一束花", completed: false },
      { id: "m_5", title: "【辣·争吵】哪怕白天吵得面红耳赤，睡觉前依然主动从背后拥抱和解", completed: false },
      { id: "m_6", title: "【甜·分担】在你连续加班的早晨，悄悄关掉闹钟代你做好早餐与家务", completed: false },
      { id: "m_7", title: "【苦·患难】遭遇人生裁员、疾病或重大变故时，紧握你的手说我们一起扛", completed: false },
      { id: "m_8", title: "亲手为对方做一顿四菜一汤的温馨烛光晚餐", completed: false },
      { id: "m_9", title: "清晨手挽手一起逛充满烟火气的菜市场，挑选新鲜食材", completed: true },
      { id: "m_10", title: "在厨房里一个人做饭，另一个人从背后温柔环抱", completed: false },
      { id: "m_11", title: "冬天躲在同一床温暖的被窝里通宵看经典老电影", completed: false },
      { id: "m_12", title: "在对方熟睡时，静静看着对方安稳的睡颜并感谢生命中有你", completed: false },
      { id: "m_13", title: "小心翼翼地为对方修剪一次指甲", completed: false },
      { id: "m_14", title: "在深夜寒冷的街头一起喝一碗热气腾腾的馄饨", completed: false },
      { id: "m_15", title: "每年结婚纪念日重游当年走过的一个重要地点", completed: false },
      { id: "m_16", title: "一生一世，不离不弃，一直坚定地牵手走到金婚白头", completed: false }
    ],
    scratchCards: [
      {
        id: "m_card_1",
        title: "烟火家务全包金牌",
        content: "今天所有的买菜、做饭、洗碗、拖地等一切家务全由我一人承包，安心当树懒！",
        icon: "🧹",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "m_card_2",
        title: "十分钟无言深拥卡",
        content: "受了委屈或感到疲惫时出示此卡，无需任何解释，立刻给你一个十分钟的长久拥抱！",
        icon: "🫂",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "m_card_3",
        title: "情绪休假 24 小时卡",
        content: "婚姻里撑不住时出示此卡，拥有 24 小时绝对摆烂权，不用管琐事，家里一切由我顶着！",
        icon: "🛌",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "m_card_4",
        title: "温柔洗头吹发 VIP",
        content: "享受专属洗头与吹风机造型护理一次，包含轻柔头部按摩，包君满意！",
        icon: "💆‍♀️",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "m_card_5",
        title: "深夜外卖买单卡",
        content: "无论多晚，指定想吃的夜宵或甜品，由对方全额买单并送至手上！",
        icon: "🍟",
        scratched: false,
        used: false,
        usedTime: ""
      },
      {
        id: "m_card_6",
        title: "吵架破冰特赦令",
        content: "无论谁对谁错，亮出此令立刻停止冷战，互相给对方台阶下，紧紧拥抱！",
        icon: "🕊️",
        scratched: false,
        used: false,
        usedTime: ""
      }
    ]
  }
};
