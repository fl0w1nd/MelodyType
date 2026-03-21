const zh = {
  // ── Common ──────────────────────────────────────────────
  common: {
    cancel: "取消",
    save: "保存",
    close: "关闭",
    loading: "加载中...",
    optional: "可选",
  },

  // ── Navigation ──────────────────────────────────────────
  nav: {
    practice: "练习",
    dashboard: "仪表盘",
    midi: "MIDI",
    docs: "文档",
    settings: "设置",
    githubRepository: "GitHub 仓库",
    footer: "MelodyType · 打字与音乐的交响",
  },

  // ── Guided Tour ─────────────────────────────────────────
  tour: {
    welcome: {
      title: "欢迎使用 MelodyType",
      description: "让打字练习与音乐旋律相伴。\n只需不到一分钟，快速了解核心功能。",
      start: "开始引导",
      duration: "（约 30 秒）",
      skip: "跳过，我自己探索",
    },
    close: "关闭引导",
    prev: "上一步",
    next: "下一步",
    finish: "开始练习 🎹",
    replay: "重新查看引导教程",
    steps: {
      logo: {
        title: "欢迎来到 MelodyType 🎵",
        description:
          "这是一款将打字练习与音乐旋律融合的应用。你的每一次击键都会驱动旋律流动，让练习不再枯燥。",
      },
      modeSelector: {
        title: "选择练习模式",
        description:
          "三种模式任你选择：Adaptive（智能适应你的薄弱按键）、Time（限时挑战，获取 S 级评分）、Quote（名言名句打字练习）。",
      },
      optionsButton: {
        title: "⚙️ 这个按钮很重要！",
        description:
          "这是 Adaptive 模式的隐藏选项入口。点击它可以设定你的目标打字速度（CPM），系统会据此调整练习难度和按键解锁节奏。接下来我们帮你打开它。",
      },
      optionsPanel: {
        title: "设定你的目标速度 🎯",
        description:
          "在这里选择适合你的目标 CPM（每分钟字符数）。可以用预设快速选择，也可以拖动滑块精确调节。目标越高，解锁新按键的门槛越高。试试点击选择一个吧！",
      },
      metricsBar: {
        title: "实时数据面板",
        description:
          "这里实时显示你的 WPM（每分钟字数）、准确率、用时、原始速度以及旋律完整度。帮你全方位了解打字状态。",
      },
      previousRoundSummary: {
        title: "自适应统计摘要",
        description:
          "这一行的大号数字表示你最新一次 Adaptive 会话的结果；彩色增减值则是它和更早 Adaptive 会话平均表现的对比，方便你观察速度、准确率、得分、完整度、击键数与 CPS 是在上升还是回落。",
      },
      flowMeter: {
        title: "旋律流量计",
        description:
          "保持稳定的打字节奏，旋律就会持续流动。暂停或频繁出错会消耗旋律能量——这是 MelodyType 的独特机制。",
      },
      textArea: {
        title: "开始打字",
        description:
          "直接在键盘上打字即可开始练习，不需要点击任何地方。光标会自动跟随你的输入，打错的字符会标红。",
      },
      practiceActions: {
        title: "快捷操作",
        description:
          "按 Tab 可快速重新开始，也可以切换虚拟键盘的显示。这些小按钮虽然不起眼，但非常实用。",
      },
      navBar: {
        title: "探索更多功能",
        description:
          "仪表盘查看历史统计，MIDI 管理背景音乐，文档阅读使用指南，设置管理数据与偏好。慢慢探索吧！",
      },
    },
  },

  // ── App / Page Loader ────────────────────────────────────
  app: {
    loading: "加载中...",
  },

  // ── Practice Page ────────────────────────────────────────
  practice: {
    newKeyUnlocked: "🔓 新按键解锁：",
    restart: "重新开始",
    allLevels: "所有关卡",
    hideKeyboard: "隐藏",
    showKeyboard: "显示",
    keyboard: "键盘",
    roundSession: "第 {{round}} 轮 · 当前会话 · Esc 重置",
  },

  // ── Mode Selector ────────────────────────────────────────
  modeSelector: {
    adaptive: "自适应",
    time: "限时",
    quote: "名言",
    adaptiveDesc: "专注于你的薄弱按键，随着进步逐步解锁新字母。",
    timeDesc: "与时钟赛跑，达成速度和准确率目标以获取更高评级。",
    quoteDesc: "打出名言名句，轻松无压力的自由练习模式。",
  },

  // ── Metrics Bar ──────────────────────────────────────────
  metricsBar: {
    wpm: "WPM",
    accuracy: "准确率",
    remaining: "剩余",
    time: "用时",
    raw: "原始",
    integrity: "完整度",
    timeRemaining: "剩余时间",
    tooltips: {
      wpm: "每分钟字数——扣除错误后的净速度。",
      accuracy: "正确击键百分比。",
      time: "当前会话已用时间。",
      raw: "扣除错误前的原始 WPM。",
      integrity: "旋律完整度——衡量你保持旋律持续流动的稳定程度。",
    },
  },

  // ── Flow Meter ───────────────────────────────────────────
  flowMeter: {
    ready: "就绪",
    onPace: "节奏良好",
    fallingBehind: "节奏落后…",
    paused: "已暂停",
    label: "旋律流量",
    tooltip: "跟踪你的打字节奏。稳定打字可保持旋律流动，暂停或减速会降低流量。",
  },

  // ── Key Progress Panel ───────────────────────────────────
  keyProgressPanel: {
    options: "选项",
    round: "第 {{n}} 轮",
    collapse: "收起",
    details: "详情",
    title: "自适应练习",
    subtitle: "基于你的表现逐步解锁按键",
    defaultSuffix: "· 默认",
    requireCurrentMastery: "严格要求当前掌握",
    requireCurrentMasteryDesc: "所有活跃按键必须时刻达到当前目标值才能解锁下一个字母，不再以历史最佳表现为基准。",
    stats: {
      speed: "速度",
      accuracy: "准确率",
      score: "得分",
      integrity: "完整度",
      target: "目标",
      clicks: "击键数",
      cps: "每秒击键",
    },
    scoreTooltip: "综合得分，结合速度、准确率和旋律完整度。",
    integrityTooltip: "旋律完整度——衡量你保持旋律持续流动的稳定程度。",
    summary: {
      avgSpeed: "平均速度",
      avgAccuracy: "平均准确率",
      avgScore: "平均得分",
      avgIntegrity: "平均旋律完整度",
      sessions: "自适应会话数",
      totalClicks: "总击键数",
      avgCps: "平均每秒击键",
      avgConfidence: "平均置信度",
      unlockReadiness: "解锁准备度",
    },
    unlockReadiness: {
      allMet: "所有活跃按键均达到自适应解锁阈值。",
      blocking_one: "仍有 {{count}} 个按键阻止下一个字母解锁。",
      blocking_other: "仍有 {{count}} 个按键阻止下一个字母解锁。",
    },
    unlockedKeys: "已解锁按键",
    nextToUnlock: "下一个解锁",
    lockedManualHint: "以上锁定的按键可以手动解锁。",
    lockedTitle: "{{key}}：已锁定 · 点击手动解锁",
    keyStats: {
      current: "当前",
      best: "最佳",
      recent: "近期",
      lifetime: "总计",
      hits: "击键",
      falseCount: "失败",
    },
    gates: {
      targetCpm: "目标 {{cpm}} cpm",
      minHits: "{{n}}+ 次",
      recentRate: "近期 {{n}}%",
      lifetimeRate: "总计 {{n}}%",
    },
    mastered: "已掌握",
    focus: "专注：",
    readyForUnlock: "可解锁下一个",
    focusKeyThresholds: "专注键阈值",
    unlockDialog: {
      title: "提前解锁 {{key}}？",
      description: "手动解锁会跳过自适应阈值，该按键将立即加入活跃集合。",
      unlocking: "解锁中…",
      unlock: "解锁按键",
    },
    allKeysReady: "所有已解锁按键均达到自适应解锁阈值。",
    moreBlockers: "+{{n}} 个",
  },

  // ── Results Panel ────────────────────────────────────────
  resultsPanel: {
    title: "练习完成",
    newPb: "新纪录！",
    targetClear: "目标达成：{{wpm}} WPM，准确率 {{acc}}%",
    stats: {
      wpm: "WPM",
      accuracy: "准确率",
      time: "用时",
      consistency: "稳定性",
      melodyIntegrity: "旋律完整度",
      cpm: "CPM",
    },
    detailStats: {
      correct: "正确",
      errors: "错误",
      rawWpm: "原始 WPM",
      melodyIntegrity: "旋律完整度",
      words: "单词数",
    },
    levelProgress: "关卡进度",
    compactStats: {
      bestWpm: "最佳 WPM",
      bestAccuracy: "最佳准确率",
      bestGrade: "最佳评级",
      attempts: "尝试次数",
    },
    nextRequirement: "下一步：{{grade}} 级 · {{wpm}} WPM，准确率 {{acc}}%",
    sGradeAchieved: "已达成 S 级——本关卡最高等级",
    newPersonalBest: "新个人纪录！",
    firstAttempt: "本关卡首次尝试——本次运行保存后将显示你的记录。",
    wpmOverTime: "WPM 趋势",
    buttons: {
      allLevels: "所有关卡",
      tryAgain: "再试一次",
      nextLevel: "下一关",
      nextLesson: "下一课",
    },
    grades: {
      outstanding: "出色的表现！",
      excellent: "优秀的打字技能！",
      great: "干得不错，继续进步！",
      good: "努力了，多加练习！",
      keepPracticing: "继续练习！",
      beginner: "每个大师都曾是初学者。",
    },
    chart: {
      speed: "速度",
      accuracy: "准确率",
      keyAccuracy: "按键准确率",
      session: "会话",
      wpmUnit: "{{n}} wpm",
    },
  },

  // ── Time Level Select ────────────────────────────────────
  timeLevelSelect: {
    stats: {
      played: "已玩",
      aOrBetter: "A 及以上",
      sClears: "S 通关",
    },
    tierCount: "/ {{n}} 已玩",
    notPlayed: "未游玩",
    gradeBest: "{{grade}} 最佳",
    newBadge: "新",
    punc: "标点",
    num: "数字",
    dialog: {
      record: "记录",
      gradeThresholds: "评级阈值",
      record_labels: {
        best: "最佳",
        last: "上次",
        attempts: "尝试次数",
        lastPlayed: "上次游玩",
      },
      noRuns: "暂无记录。",
      next: "下一步：",
      close: "关闭",
      startLevel: "开始关卡",
    },
  },

  // ── Dashboard Page ───────────────────────────────────────
  dashboardPage: {
    tabs: {
      adaptive: "自适应",
      time: "限时",
      quote: "名言",
    },
  },

  // ── Stats Overview ───────────────────────────────────────
  statsOverview: {
    title: "仪表盘",
    subtitle: "追踪你的打字历程",
    subtitleEmpty: "开始练习后即可查看进度",
    trends: {
      improving: "持续进步",
      needsFocus: "需要关注",
      steadyPace: "稳定前行",
    },
    metrics: {
      avgWpm: "平均 WPM",
      bestWpm: "最佳 WPM",
      accuracy: "准确率",
      melodyIntegrity: "旋律完整度",
      sessions: "会话数",
      practice: "练习时长",
      streak: "连续天数",
    },
    tooltips: {
      avgWpm: "所有会话的平均每分钟字数。",
      bestWpm: "单次会话的最高 WPM。",
      accuracy: "所有会话的平均准确率。",
      melodyIntegrity: "平均旋律完整度得分。",
      sessions: "已完成的练习会话总数。",
      practice: "活跃打字会话的总累计时间。",
      streak: "连续有至少一次会话的天数。",
    },
  },

  // ── Session History ──────────────────────────────────────
  sessionHistory: {
    title: "最近会话",
    last: "最近 {{n}} 条",
    empty: "暂无会话",
    emptyDesc: "在练习页面完成一次打字会话后，历史记录将显示在这里",
    timeAgo: {
      justNow: "刚刚",
      minutesAgo: "{{n}} 分钟前",
      hoursAgo: "{{n}} 小时前",
      daysAgo: "{{n}} 天前",
    },
  },

  // ── Daily Goal Ring ──────────────────────────────────────
  dailyGoalRing: {
    title: "今日目标",
    done: "完成",
    minutes: "分钟",
    ofMinutes: "/ {{n}} 分钟",
    stats: {
      progress: "进度",
      sessions: "会话数",
      bestWpm: "最佳 WPM",
      avgAcc: "平均准确率",
    },
    tooltips: {
      progress: "今日已练习分钟数（相对于每日目标）。",
      sessions: "今日已完成的会话数。",
      bestWpm: "今日会话中的最高 WPM。",
      avgAcc: "今日会话的平均准确率。",
    },
  },

  // ── WPM Chart ────────────────────────────────────────────
  wpmChart: {
    speedProgress: "速度进展",
    accuracyTrend: "准确率趋势",
    summaryStats: {
      avgWpm: "平均 wpm",
      peak: "峰值",
      sessions: "会话",
      avg: "平均",
      floor: "底线",
    },
    noData: "该时间段暂无数据",
    tooltips: {
      speed: "速度",
      accuracy: "准确率",
      wpmUnit: "{{n}} wpm",
      accUnit: "{{n}}%",
    },
  },

  // ── Keyboard Heatmap ─────────────────────────────────────
  keyboardHeatmap: {
    title: "键盘热力图",
    tabs: {
      falseRate: "失败率",
      frequency: "频率",
      transitions: "过渡",
    },
    transitionsFrom: "从 {{key}} 的过渡",
    arcNote: "弧线颜色反映命中率，得分在热力图中为辅助参考。",
    legend: {
      falseRate: {
        low: "低",
        some: "一般",
        many: "较多",
        high: "高",
      },
      frequency: {
        rare: "稀少",
        often: "常见",
        most: "最多",
      },
      transitions: {
        clean: "干净",
        minor: "轻微",
        risky: "风险",
        errorProne: "易错",
      },
    },
    hitRate: "命中率",
    score: "得分",
  },

  // ── Adaptive Progress Card ───────────────────────────────
  adaptiveProgressCard: {
    title: "自适应进度",
    empty: "自适应模式正在追踪你的进度",
    emptyDesc:
      "在练习页面切换到自适应模式——系统会学习你的强项，并专注于需要提升的按键",
    sessions_one: "{{count}} 次会话",
    sessions_other: "{{count}} 次会话",
    pills: {
      unlocked: "已解锁",
      mastered: "已掌握",
      confidence: "置信度",
    },
    metrics: {
      speed: "速度",
      accuracy: "准确率",
      score: "得分",
      integrity: "完整度",
      clicks: "击键数",
      cps: "每秒击键",
    },
    keyConfidenceMap: "按键置信度地图",
    weakestKeys: "最弱按键",
    strongestKeys: "最强按键",
    legend: {
      weak: "薄弱",
      learning: "学习中",
      good: "良好",
      mastered: "已掌握",
      locked: "已锁定",
    },
  },

  // ── Key Detail Panel ─────────────────────────────────────
  keyDetailPanel: {
    totalPresses: "{{n}} 次总按压",
    falsePct: "{{pct}} 失败",
    statsNote: "成功/失败是目标键统计，误按是实际按下此键但目标为其他键的次数。",
    trend: "趋势：",
    trendUp: "+{{n}}%",
    trendDown: "{{n}}%",
    trendStable: "稳定",
    stats: {
      success: "成功",
      misPresses: "误按",
      false: "失败",
      keyAccuracy: "按键准确率",
    },
    tooltips: {
      success: "目标为此键时正确按下的次数。",
      misPresses: "目标为其他键时误按此键的次数。",
      false: "目标为此键时按下错误键的次数。",
      keyAccuracy: "此键的总体准确率。",
    },
    keyAccuracyLabel: "近 {{n}} 次会话的按键准确率",
    chartLabels: {
      session: "会话",
      keyAccuracy: "按键准确率",
    },
  },

  // ── Activity Heatmap ─────────────────────────────────────
  activityHeatmap: {
    title: "活动记录",
    activeDays_one: "{{count}} 个活跃天",
    activeDays_other: "{{count}} 个活跃天",
    dayLabels: {
      mon: "一",
      wed: "三",
      fri: "五",
    },
    tooltip: {
      sessions: "{{n}} 次会话 · 最佳 {{wpm}} wpm",
      noSessions: "无会话",
    },
    legend: {
      less: "少",
      more: "多",
    },
    ariaLabel: "显示练习会话时间分布的活动热力图",
  },

  // ── Time Range Selector ──────────────────────────────────
  timeRangeSelector: {
    recent: "最近",
    day: "天",
    week: "周",
    month: "月",
  },

  // ── MIDI Floating Player ─────────────────────────────────
  midiFloatingPlayer: {
    loopModes: {
      loop: "循环",
      once: "单次",
      sequential: "顺序",
      random: "随机",
    },
    noSelection: "未选择",
    playing: "♪ 播放中",
    playlist: "播放列表",
    allTracks: "所有曲目",
    nextTrack: "下一曲",
  },

  // ── MIDI Page ────────────────────────────────────────────
  midiPage: {
    loopModes: {
      loop: "循环",
      once: "单次",
      sequential: "顺序",
      random: "随机",
    },
    presets: "预设",
    yourFiles: "我的文件",
    playlist: "播放列表",
    upload: "上传",
    emptyFiles: "上传你的 MIDI 文件",
    emptyFilesDesc: "将 .mid 文件拖拽到此处或点击浏览。你的文件将与预设一同播放。",
    addMore: "添加更多",
    clearPlaylist: "清空",
    emptyPlaylist: "播放列表为空",
    emptyPlaylistHint: "使用 + 添加曲目",
    itemCount_one: "{{count}} 项",
    itemCount_other: "{{count}} 项",
    activeBadge: "活跃",
    playingBadge: "播放中",
    testButton: "测试",
    frames: "{{n}} 帧",
    synths: {
      piano: "钢琴",
      strings: "弦乐",
      synth: "合成器",
      musicBox: "音乐盒",
      bell: "钟声",
    },
    uploadDialog: {
      title: "上传 MIDI 文件",
      subtitle: "保存前请编辑名称并添加描述。",
      name: "名称",
      description: "描述",
      descriptionPlaceholder: "可选描述...",
      framesDetected: "检测到 {{n}} 帧",
      cancel: "取消",
      save: "保存",
    },
    editDialog: {
      title: "编辑 MIDI 文件",
      subtitle: "更新名称和描述。",
      name: "名称",
      description: "描述",
      descriptionPlaceholder: "可选描述...",
      cancel: "取消",
      save: "保存",
    },
  },

  // ── Settings Page ────────────────────────────────────────
  settingsPage: {
    dataManagement: {
      title: "数据管理",
      sessions_one: "{{count}} 次会话",
      sessions_other: "{{count}} 次会话",
      keyRecords_one: "{{count}} 条按键记录",
      keyRecords_other: "{{count}} 条按键记录",
      transitionRecords_one: "{{count}} 条过渡记录",
      transitionRecords_other: "{{count}} 条过渡记录",
      midiFiles_one: "{{count}} 个 MIDI 文件",
      midiFiles_other: "{{count}} 个 MIDI 文件",
      exportBackup: "导出备份",
      exported: "已导出！",
      importBackup: "导入备份",
      imported: "已导入！",
      invalidFile: "无效文件",
      clearStatistics: "清除统计",
      clearDialog: {
        title: "清除所有统计数据？",
        description:
          "这将永久删除你的所有打字会话、按键统计、过渡统计和每日目标。MIDI 文件和设置将被保留。此操作无法撤销。",
        cancel: "取消",
        confirm: "删除统计",
      },
      resetSettings: "重置设置",
      resetDialog: {
        title: "重置所有设置？",
        description:
          "这将把 MelodyType 恢复到默认配置，包括自适应练习、显示和 MIDI 偏好。你的练习统计和 MIDI 文件将被保留。",
        cancel: "取消",
        confirm: "重置设置",
      },
    },
    language: {
      title: "语言",
      label: "界面语言",
      auto: "自动（浏览器）",
      en: "English",
      zh: "中文",
    },
    about: {
      title: "关于",
      tagline: "打字与音乐的交响",
      description:
        "MelodyType 是一款将键盘训练与音乐享受相结合的打字练习应用。每次击键都会触发 MIDI 音符，将你的练习转化为旋律。所有数据都存储在浏览器本地——无需账户，无需云端，完全私密。",
      docsHint: "查看键盘快捷键、指标词汇表和使用指南",
      viewDocs: "查看文档 →",
    },
  },

  // ── Docs Page ────────────────────────────────────────────
  docsPage: {
    nav: {
      gettingStarted: "快速入门",
      practiceModes: "练习模式",
      adaptiveMode: "自适应模式",
      timeMode: "限时模式",
      quoteMode: "名言模式",
      metricsGlossary: "指标词汇表",
      melodyMidi: "旋律与 MIDI",
      dashboard: "仪表盘",
      midiManagement: "MIDI 管理",
      keyboardShortcuts: "键盘快捷键",
    },
    overview: {
      title: "欢迎使用 MelodyType",
      p1: "MelodyType 是一款将键盘训练与实时音乐融合的打字练习应用。你的每次击键都会驱动 MIDI 旋律，将每次会话变成一场音乐演奏。",
      p2: "自适应引擎追踪每个按键的准确率和速度，自动调整练习内容以针对你的薄弱点。根据你的目标选择三种模式之一。",
      quickStart: {
        title: "快速入门",
        step1: "从练习区域顶部选择练习模式",
        step2: "直接开始打字——无需先点击任何地方",
        step3: "Tab 键重新开始会话；Esc 键返回关卡选择（限时模式）",
      },
      features: {
        title: "探索功能",
        adaptive: {
          title: "自适应模式",
          desc: "按键逐步推进，智能适应你的技能水平",
        },
        time: {
          title: "限时模式",
          desc: "设有速度和准确率目标的评级关卡",
        },
        dashboard: {
          title: "仪表盘",
          desc: "详细统计、热力图和进度图表",
        },
        midi: {
          title: "MIDI 与旋律",
          desc: "与击键同步的可自定义背景音乐",
        },
      },
    },
    practice: {
      title: "练习模式",
      description: "MelodyType 提供三种不同的练习模式，各自针对打字提升的不同方面。",
      modes: {
        adaptive: {
          title: "自适应",
          desc: "持续适应你的薄弱点，专注于你不擅长的按键，并随着进步解锁新按键。",
        },
        time: {
          title: "限时",
          desc: "固定时长的关卡，有评级性能目标。根据 WPM 和准确率获得 C 到 S 的评级。",
        },
        quote: {
          title: "名言",
          desc: "打出文学、科学和哲学领域的名言名句。无压力，纯粹的自由练习。",
        },
      },
      commonControls: {
        title: "通用操作",
        desc: "在所有模式下，Tab 键重新开始当前会话，虚拟键盘可从练习工具栏开关。",
      },
    },
    adaptive: {
      title: "自适应模式",
      p1: "自适应模式是 MelodyType 的核心功能。它从一小组常用字母开始，随着你的表现提升逐步解锁新按键。",
      progressiveUnlocking: {
        title: "渐进式按键解锁",
        desc: "系统监控你输入的每个按键，只有当所有当前活跃按键都达到速度、准确率和一致性的掌握阈值时，才会解锁下一个字母。",
      },
      focusKey: {
        title: "专注键",
        desc: "最近解锁的按键成为专注键。自适应引擎生成更频繁包含该键的文本，帮助你更快建立肌肉记忆。",
      },
      masteryCriteria: {
        title: "按键掌握标准",
        items: [
          "速度：该按键的每分钟字符数达到目标 CPM 阈值",
          "准确率：近期和终身准确率超过所需百分比",
          "一致性：已记录足够的总击键数，使测量结果可靠",
          "旋律完整度：平均旋律完整度得分达到最低阈值",
        ],
      },
      options: {
        title: "选项",
        desc: "选项面板（齿轮图标）允许你调整目标 CPM、切换「严格要求当前掌握」模式。",
      },
    },
    time: {
      title: "限时模式",
      levelSelection: {
        title: "关卡选择",
        desc: "关卡分为四个层级：初级、中级、高级和专家。每个关卡有固定时限、单词难度设置，以及可选的标点和数字。",
      },
      gradingSystem: {
        title: "评级系统",
        desc: "每个关卡根据你的 WPM 和准确率给出 C 到 S 的评级：",
        grades: {
          s: "S — 速度和准确率均大幅超出目标",
          a: "A — 干净地达成关卡目标",
          b: "B — 略低于目标但仍为通过",
          c: "C — 以最低通过标准完成关卡",
        },
      },
      results: {
        title: "结果与进度",
        desc: "每次运行后，结果面板显示你的评级、WPM、准确率和 WPM 趋势图。每个关卡的最佳评级和 WPM 都会被追踪。",
      },
    },
    quote: {
      title: "名言模式",
      p1: "名言模式呈现来自文学、科学、哲学和历史的名言名句。没有时间限制或评级要求——专为轻松、探索性练习设计。",
      p2: "名言长度和复杂度各不相同。旋律和流量计仍正常运作，即使在无压力环境中也鼓励稳定的节奏。",
    },
    metrics: {
      title: "指标词汇表",
      core: {
        title: "核心指标",
        wpm: {
          label: "WPM（每分钟字数）",
          desc: "净打字速度，计算公式为（正确字符数 / 5）÷ 已用分钟数。错误会被扣除。",
        },
        rawWpm: {
          label: "原始 WPM",
          desc: "扣除错误前的总打字速度。显示你不考虑准确率的实际击键速度。",
        },
        accuracy: {
          label: "准确率",
          desc: "首次尝试即正确的击键百分比。",
        },
        consistency: {
          label: "一致性",
          desc: "你在会话中打字速度的稳定程度。数值越高越稳定。",
        },
        cpm: {
          label: "CPM（每分钟字符数）",
          desc: "原始字符吞吐量。在自适应模式中内部用于每键速度阈值。",
        },
      },
      adaptive: {
        title: "自适应指标",
        keyAccuracy: {
          label: "按键准确率",
          desc: "单键成功率：目标为该键时正确按下的频率。",
        },
        keyScore: {
          label: "按键得分",
          desc: "某键的综合得分，将速度、准确率和旋律完整度融合为 0-100 的单一数值。",
        },
        confidence: {
          label: "置信度",
          desc: "某键真正被掌握的统计确定性。需要足够多的一致性表现才能达到高置信度。",
        },
        falseCount: {
          label: "失败",
          desc: "目标为该键时按下错误键的次数。同一目标位置重复按错只计一次。",
        },
      },
      dashboard: {
        title: "仪表盘关键统计",
        streak: {
          label: "连续天数",
          desc: "至少完成一次练习会话的连续日历天数。",
        },
        melodyIntegrity: {
          label: "旋律完整度",
          desc: "旋律在会话中持续播放的程度。100% 意味着你打字稳定无间断。暂停和爆发式输入会降低此分数。",
        },
        practiceTime: {
          label: "练习时长",
          desc: "活跃打字会话的总累计时间。",
        },
      },
    },
    melody: {
      title: "旋律与音乐流动",
      p1: "每次击键触发一个 MIDI 音符。音调来自当前播放的旋律曲目；你的打字速度决定播放速度。",
      flowStates: {
        title: "流动状态",
        onPace: "节奏良好——打字速度达到或超过目标节奏；旋律正常播放",
        fallingBehind: "节奏落后——打字速度略慢；旋律相应减速",
        paused: "已暂停——短暂无输入；旋律暂停",
      },
      integrityScore: {
        title: "旋律完整度得分",
        desc: "在每次会话结束时记录，此分数反映旋律积极播放的时间百分比。连续不间断的打字得分更高。",
      },
    },
    dashboard: {
      title: "仪表盘",
      p1: "仪表盘为你提供所有练习模式的长期进度概览。",
      sections: {
        overviewStats: {
          title: "概览统计",
          desc: "顶级数字：平均 WPM、最佳 WPM、总体准确率、旋律完整度、总会话数、累计练习时长和当前连续天数。",
        },
        dailyGoal: {
          title: "每日目标",
          desc: "可配置的每日练习目标（分钟）。每天完成会话时圆环填充。在设置中设定你的目标。",
        },
        activityHeatmap: {
          title: "活动热力图",
          desc: "GitHub 风格的贡献图，显示过去一年的练习频率。颜色越深表示当天会话越多。",
        },
        charts: {
          title: "图表",
          desc: "按时间范围过滤的 WPM 趋势和准确率趋势图。使用范围选择器放大近期会话或查看长期趋势。",
        },
        keyboardHeatmap: {
          title: "键盘热力图",
          desc: "每键性能的可视化表示。在误触率、频率和过渡视图之间切换，找出薄弱点。",
        },
      },
    },
    midi: {
      title: "MIDI 管理",
      p1: "MIDI 页面让你控制练习中播放的背景音乐。",
      layout: {
        title: "布局",
        desc: "三列：预设（内置曲目）、我的文件（上传的 .mid 文件）和播放列表（当前队列）。",
      },
      controls: {
        title: "操作",
        items: [
          "点击曲目将其设为活跃源",
          "使用 + 将曲目添加到播放列表",
          "循环模式选择器（循环/单次/顺序/随机）控制播放顺序",
          "合成器选择器更改乐器音色",
          "测试播放任意曲目的短预览",
        ],
      },
      uploading: {
        title: "上传文件",
        desc: "点击上传或将 .mid 文件拖拽到我的文件面板。为每个文件命名并添加可选描述。文件存储在浏览器本地。",
      },
      floatingPlayer: {
        title: "悬浮播放器",
        desc: "离开 MIDI 页面后，角落会出现悬浮播放器。用它暂停/恢复、跳转曲目和更改循环模式，无需离开练习会话。",
      },
    },
    shortcuts: {
      title: "键盘快捷键",
      columns: {
        action: "操作",
        shortcut: "快捷键",
        context: "场景",
      },
      rows: [
        {
          action: "重新开始会话",
          shortcut: "Tab",
          context: "练习（所有模式）",
        },
        {
          action: "返回关卡选择",
          shortcut: "Esc",
          context: "限时模式",
        },
        {
          action: "下一步 / 上一步",
          shortcut: "→ / ←",
          context: "引导教程",
        },
        {
          action: "关闭教程",
          shortcut: "Esc",
          context: "引导教程",
        },
      ],
      tips: {
        title: "提示",
        items: [
          "打字前无需点击文本区域——直接开始打字，会话即刻启动。",
          "可隐藏虚拟键盘以减少练习时的视觉干扰。",
          "切换模式会重置当前会话，但所有统计记录均会保留。",
          "自适应模式中的选项面板是持久的——CPM 目标在会话之间保存。",
          "导出的备份包含所有会话、按键统计、MIDI 文件和设置。",
          "可随时从导航栏的 ? 按钮重播引导教程。",
        ],
      },
    },
  },

  // ── Time Levels data ─────────────────────────────────────
  timeLevels: {
    "b-1": {
      name: "第一步",
      description: "短暂宽松的练习，巩固基础。",
    },
    "b-2": {
      name: "快速冲刺",
      description: "稍长的简单练习，专注于稳定节奏。",
    },
    "b-3": {
      name: "稳定流动",
      description: "一分钟简单词汇，培养持久耐力。",
    },
    "b-4": {
      name: "数字初识",
      description: "在不提高词汇难度的情况下加入数字练习。",
    },
    "b-5": {
      name: "长途跑",
      description: "两分钟简单文本，为更长测试做准备。",
    },
    "i-1": {
      name: "进阶起步",
      description: "短暂爆发中级词汇，提升基础速度。",
    },
    "i-2": {
      name: "词汇爆发",
      description: "30 秒中级词汇，目标节奏更稳。",
    },
    "i-3": {
      name: "完整句子",
      description: "引入标点符号，词汇难度保持适中。",
    },
    "i-4": {
      name: "数字冲击",
      description: "数字加中级词汇，强化视觉过渡。",
    },
    "i-5": {
      name: "综合练习",
      description: "较长的中级练习，标点压力开始显现。",
    },
    "i-6": {
      name: "耐力测试",
      description: "两分钟中级测试，考验控制而非慌乱。",
    },
    "a-1": {
      name: "复杂词汇",
      description: "高难度词汇成为新常态。",
    },
    "a-2": {
      name: "标点达人",
      description: "高难度句子，标点再也无法忽视。",
    },
    "a-3": {
      name: "数据录入",
      description: "高难度词汇加数字，短暂而精准的练习。",
    },
    "a-4": {
      name: "极限挑战",
      description: "长篇高难度文本，考验标点处理能力。",
    },
    "a-5": {
      name: "全套组合",
      description: "高难度词汇、标点和数字同时出现。",
    },
    "a-6": {
      name: "马拉松",
      description: "长时间高级练习，测试疲劳中的节奏保持。",
    },
    "e-1": {
      name: "速度恶魔",
      description: "短暂全功能爆发，奖励极致控制力。",
    },
    "e-2": {
      name: "精准测试",
      description: "专家基准：速度极高，失误代价更重。",
    },
    "e-3": {
      name: "终极关卡",
      description: "两分钟专家文本，节奏与专注缺一不可。",
    },
  },

  // ── Time Level Tier labels ───────────────────────────────
  tierMeta: {
    beginner: "初级",
    intermediate: "中级",
    advanced: "高级",
    expert: "专家",
  },

  // ── Time Grade messages ──────────────────────────────────
  gradeMessages: {
    S: "顶级通关。节奏与精准度均保持稳定。",
    A: "出色发挥。干净地达成了关卡目标。",
    B: "稳健通关。稍微提升速度或准确率即可晋级。",
    C: "基础通关。在追求更快评级前先建立稳定性。",
  },
} as const

export default zh
