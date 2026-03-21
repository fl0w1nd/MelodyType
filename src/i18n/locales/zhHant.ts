const zhTW = {
  // ── Common ──────────────────────────────────────────────
  common: {
    cancel: "取消",
    save: "保存",
    close: "關閉",
    loading: "加載中...",
    optional: "可選",
  },

  // ── Navigation ──────────────────────────────────────────
  nav: {
    practice: "練習",
    dashboard: "儀表盤",
    midi: "MIDI",
    docs: "文檔",
    settings: "設置",
    githubRepository: "GitHub 倉庫",
    footer: "MelodyType · 打字與音樂的交響",
  },

  // ── Guided Tour ─────────────────────────────────────────
  tour: {
    welcome: {
      title: "歡迎使用 MelodyType",
      description: "讓打字練習與音樂旋律相伴。\n只需不到一分鐘，快速了解核心功能。",
      start: "開始引導",
      duration: "（約 30 秒）",
      skip: "跳過，我自己探索",
    },
    close: "關閉引導",
    prev: "上一步",
    next: "下一步",
    finish: "開始練習 🎹",
    replay: "重新查看引導教程",
    steps: {
      logo: {
        title: "歡迎來到 MelodyType 🎵",
        description:
          "這是一款將打字練習與音樂旋律融合的應用。你的每一次擊鍵都會驅動旋律流動，讓練習不再枯燥。",
      },
      modeSelector: {
        title: "選擇練習模式",
        description:
          "三種模式任你選擇：Adaptive（智能適應你的薄弱按鍵）、Time（限時挑戰，獲取 S 級評分）、Quote（名言名句打字練習）。",
      },
      optionsButton: {
        title: "⚙️ 這個按鈕很重要！",
        description:
          "這是 Adaptive 模式的隱藏選項入口。點擊它可以設定你的目標打字速度（CPM），系統會據此調整練習難度和按鍵解鎖節奏。接下來我們幫你打開它。",
      },
      optionsPanel: {
        title: "設定你的目標速度 🎯",
        description:
          "在這裡選擇適合你的目標 CPM（每分鐘字符數）。可以用預設快速選擇，也可以拖動滑塊精確調節。目標越高，解鎖新按鍵的門檻越高。試試點擊選擇一個吧！",
      },
      metricsBar: {
        title: "即時數據面板",
        description:
          "這裡即時顯示你的 WPM（每分鐘字數）、準確率、用時、原始速度以及旋律完整度。幫你全方位了解打字狀態。",
      },
      previousRoundSummary: {
        title: "自適應統計摘要",
        description:
          "這一行的大字數值表示你最新一次 Adaptive 會話的結果；彩色增減值則是它和更早 Adaptive 會話平均表現的對比，方便你觀察速度、準確率、得分、完整度、擊鍵數與 CPS 是在上升還是回落。",
      },
      flowMeter: {
        title: "旋律流量計",
        description:
          "保持穩定的打字節奏，旋律就會持續流動。暫停或頻繁出錯會消耗旋律能量——這是 MelodyType 的獨特機制。",
      },
      textArea: {
        title: "開始打字",
        description:
          "直接在鍵盤上打字即可開始練習，不需要點擊任何地方。遊標會自動跟隨你的輸入，打錯的字符會標紅。",
      },
      practiceActions: {
        title: "快捷操作",
        description:
          "按 Tab 可快速重新開始，也可以切換虛擬鍵盤的顯示。這些小按鈕雖然不起眼，但非常實用。",
      },
      navBar: {
        title: "探索更多功能",
        description:
          "儀表盤查看歷史統計，MIDI 管理背景音樂，文檔閱讀使用指南，設置管理數據與偏好。慢慢探索吧！",
      },
    },
  },

  // ── App / Page Loader ────────────────────────────────────
  app: {
    loading: "加載中...",
  },

  landing: {
    eyebrow: "隱私優先的打字訓練器",
    title: "在即時 MIDI 旋律裡練習打字",
    description:
      "MelodyType 會把你的每次擊鍵變成旋律的一部分，同時透過自適應訓練、限時挑戰與瀏覽器本地進度追蹤，幫助你提升速度、準確率與節奏感。",
    highlights: {
      adaptive: "針對薄弱按鍵的自適應訓練",
      rhythm: "限時與名言兩種練習模式",
      privacy: "本地優先統計，無需帳號",
    },
    docsCta: "查看文檔",
    githubCta: "查看 GitHub",
  },

  notFound: {
    title: "頁面不存在",
    description:
      "這個位址在 MelodyType 裡沒有對應頁面。你可以回到練習頁，或打開文檔繼續了解功能。",
    backHome: "返回練習頁",
    readDocs: "打開文檔",
  },

  // ── Practice Page ────────────────────────────────────────
  practice: {
    newKeyUnlocked: "🔓 新按鍵解鎖：",
    restart: "重新開始",
    allLevels: "所有關卡",
    hideKeyboard: "隱藏",
    showKeyboard: "顯示",
    keyboard: "鍵盤",
    roundSession: "第 {{round}} 輪 · 當前會話 · Esc 重置",
  },

  // ── Mode Selector ────────────────────────────────────────
  modeSelector: {
    adaptive: "自適應",
    time: "限時",
    quote: "名言",
    adaptiveDesc: "專注於你的薄弱按鍵，隨著進步逐步解鎖新字母。",
    timeDesc: "與時鐘賽跑，達成速度和準確率目標以獲取更高評級。",
    quoteDesc: "打出名言名句，輕鬆無壓力的自由練習模式。",
  },

  // ── Metrics Bar ──────────────────────────────────────────
  metricsBar: {
    wpm: "WPM",
    accuracy: "準確率",
    remaining: "剩餘",
    time: "用時",
    raw: "原始",
    integrity: "完整度",
    timeRemaining: "剩餘時間",
    tooltips: {
      wpm: "每分鐘字數——扣除錯誤後的淨速度。",
      accuracy: "正確擊鍵百分比。",
      time: "當前會話已用時間。",
      raw: "扣除錯誤前的原始 WPM。",
      integrity: "旋律完整度——衡量你保持旋律持續流動的穩定程度。",
    },
  },

  // ── Flow Meter ───────────────────────────────────────────
  flowMeter: {
    ready: "就緒",
    onPace: "節奏良好",
    fallingBehind: "節奏落後…",
    paused: "已暫停",
    label: "旋律流量",
    tooltip: "跟蹤你的打字節奏。穩定打字可保持旋律流動，暫停或減速會降低流量。",
  },

  // ── Key Progress Panel ────────────────────────────────────
  keyProgressPanel: {
    options: "選項",
    round: "第 {{n}} 輪",
    collapse: "收起",
    details: "詳情",
    title: "自適應練習",
    subtitle: "基於你的表現逐步解鎖按鍵",
    defaultSuffix: "· 默認",
    requireCurrentMastery: "嚴格要求當前掌握",
    requireCurrentMasteryDesc: "所有活躍按鍵必須時刻達到當前目標值才能解鎖下一個字母，不再以歷史最佳表現為基準。",
    stats: {
      speed: "速度",
      accuracy: "準確率",
      score: "得分",
      integrity: "完整度",
      target: "目標",
      clicks: "擊鍵數",
      cps: "每秒擊鍵",
    },
    scoreTooltip: "綜合得分，結合速度、準確率和旋律完整度。",
    integrityTooltip: "旋律完整度——衡量你保持旋律持續流動的穩定程度。",
    summary: {
      avgSpeed: "平均速度",
      avgAccuracy: "平均準確率",
      avgScore: "平均得分",
      avgIntegrity: "平均旋律完整度",
      sessions: "自適應會話數",
      totalClicks: "總擊鍵數",
      avgCps: "平均每秒擊鍵",
      avgConfidence: "平均置信度",
      unlockReadiness: "解鎖準備度",
    },
    unlockReadiness: {
      allMet: "所有活躍按鍵均達到自適應解鎖閾值。",
      blocking_one: "仍有 {{count}} 個按鍵阻止下一個字母解鎖。",
      blocking_other: "仍有 {{count}} 個按鍵阻止下一個字母解鎖。",
    },
    unlockedKeys: "已解鎖按鍵",
    nextToUnlock: "下一個解鎖",
    lockedManualHint: "以上鎖定的按鍵可以手動解鎖。",
    lockedTitle: "{{key}}：已鎖定 · 點擊手動解鎖",
    keyStats: {
      current: "當前",
      best: "最佳",
      recent: "近期",
      lifetime: "總計",
      hits: "擊鍵",
      falseCount: "失敗",
    },
    gates: {
      targetCpm: "目標 {{cpm}} cpm",
      minHits: "{{n}}+ 次",
      recentRate: "近期 {{n}}%",
      lifetimeRate: "總計 {{n}}%",
    },
    gatesMet: "{{met}}/{{total}} 達標",
    focusTooltip: {
      title: "專注鍵 {{key}} — 掌握進度",
      speed: "速度",
      hits: "擊鍵數",
      recentAcc: "近期準確率",
      lifetimeAcc: "總計準確率",
    },
    mastered: "已掌握",
    focus: "專注：",
    readyForUnlock: "可解鎖下一個",
    focusKeyThresholds: "專注鍵閾值",
    unlockDialog: {
      title: "提前解鎖 {{key}}？",
      description: "手動解鎖會跳過自適應閾值，該按鍵將立即加入活躍集合。",
      unlocking: "解鎖中…",
      unlock: "解鎖按鍵",
    },
    allKeysReady: "所有已解鎖按鍵均達到自適應解鎖閾值。",
    moreBlockers: "+{{n}} 個",
    includeNumbers: "包含數字",
    includePunctuation: "包含標點",
    includeSpecialCharacters: "包含特殊字元",
    symbolMixEarlyUnlockHint: "第一階段點擊後會彈出警告，可提前強制開啟 {{feature}}。",
    symbolMixEarlyUnlockSummary: "第一階段可透過警告提前強制開啟這些混合練習；第二階段則可直接切換。",
    mixUnlockWarning: {
      title: "提前開啟 {{feature}}？",
      description:
        "這會在 26 個字母尚未全部完成前，把 {{feature}} 混入目前訓練文本。它會改變原本的字母節奏，但能更早累積跨字元過渡記錄。",
      enable: "仍要開啟",
      enabling: "開啟中...",
    },
  },

  // ── Results Panel ────────────────────────────────────────
  resultsPanel: {
    title: "練習完成",
    newPb: "新紀錄！",
    targetClear: "目標達成：{{wpm}} WPM，準確率 {{acc}}%",
    stats: {
      wpm: "WPM",
      accuracy: "準確率",
      time: "用時",
      consistency: "穩定性",
      melodyIntegrity: "旋律完整度",
      cpm: "CPM",
    },
    detailStats: {
      correct: "正確",
      errors: "錯誤",
      rawWpm: "原始 WPM",
      melodyIntegrity: "旋律完整度",
      words: "單詞數",
    },
    levelProgress: "關卡進度",
    compactStats: {
      bestWpm: "最佳 WPM",
      bestAccuracy: "最佳準確率",
      bestGrade: "最佳評級",
      attempts: "嘗試次數",
    },
    nextRequirement: "下一步：{{grade}} 級 · {{wpm}} WPM，準確率 {{acc}}%",
    sGradeAchieved: "已達成 S 級——本關卡最高等級",
    newPersonalBest: "新個人紀錄！",
    firstAttempt: "本關卡首次嘗試——本次運行保存後將顯示你的記錄。",
    wpmOverTime: "WPM 趨勢",
    buttons: {
      allLevels: "所有關卡",
      tryAgain: "再試一次",
      nextLevel: "下一關",
      nextLesson: "下一課",
    },
    grades: {
      outstanding: "出色的表現！",
      excellent: "優秀的打字技能！",
      great: "乾得不錯，繼續進步！",
      good: "努力了，多加練習！",
      keepPracticing: "繼續練習！",
      beginner: "每個大師都曾是初學者。",
    },
    chart: {
      speed: "速度",
      accuracy: "準確率",
      keyAccuracy: "按鍵準確率",
      session: "會話",
      wpmUnit: "{{n}} wpm",
    },
  },

  // ── Time Level Select ────────────────────────────────────
  timeLevelSelect: {
    stats: {
      played: "已玩",
      aOrBetter: "A 及以上",
      sClears: "S 通關",
    },
    tierCount: "/ {{n}} 已玩",
    notPlayed: "未遊玩",
    gradeBest: "{{grade}} 最佳",
    newBadge: "新",
    punc: "標點",
    num: "數字",
    dialog: {
      record: "記錄",
      gradeThresholds: "評級閾值",
      record_labels: {
        best: "最佳",
        last: "上次",
        attempts: "嘗試次數",
        lastPlayed: "上次遊玩",
      },
      noRuns: "暫無記錄。",
      next: "下一步：",
      close: "關閉",
      startLevel: "開始關卡",
    },
  },

  // ── Dashboard Page ────────────────────────────────────────
  dashboardPage: {
    tabs: {
      adaptive: "自適應",
      time: "限時",
      quote: "名言",
    },
  },

  // ── Stats Overview ────────────────────────────────────────
  statsOverview: {
    title: "儀表盤",
    subtitle: "追蹤你的打字歷程",
    subtitleEmpty: "開始練習後即可查看進度",
    trends: {
      improving: "持續進步",
      needsFocus: "需要關注",
      steadyPace: "穩定前行",
    },
    metrics: {
      avgWpm: "平均 WPM",
      bestWpm: "最佳 WPM",
      accuracy: "準確率",
      melodyIntegrity: "旋律完整度",
      sessions: "會話數",
      practice: "練習時長",
      streak: "連續天數",
    },
    tooltips: {
      avgWpm: "所有會話的平均每分鐘字數。",
      bestWpm: "單次會話的最高 WPM。",
      accuracy: "所有會話的平均準確率。",
      melodyIntegrity: "平均旋律完整度得分。",
      sessions: "已完成的練習會話總數。",
      practice: "活躍打字會話的總累計時間。",
      streak: "連續有至少一次會話的天數。",
    },
  },

  // ── Session History ────────────────────────────────────────
  sessionHistory: {
    title: "最近會話",
    last: "最近 {{n}} 條",
    empty: "暫無會話",
    emptyDesc: "在練習頁面完成一次打字會話後，歷史記錄將顯示在這裡",
    timeAgo: {
      justNow: "剛剛",
      minutesAgo: "{{n}} 分鐘前",
      hoursAgo: "{{n}} 小時前",
      daysAgo: "{{n}} 天前",
    },
  },

  // ── Daily Goal Ring ────────────────────────────────────────
  dailyGoalRing: {
    title: "今日目標",
    done: "完成",
    minutes: "分鐘",
    ofMinutes: "/ {{n}} 分鐘",
    stats: {
      progress: "進度",
      sessions: "會話數",
      bestWpm: "最佳 WPM",
      avgAcc: "平均準確率",
    },
    tooltips: {
      progress: "今日已練習分鐘數（相對於每日目標）。",
      sessions: "今日已完成的會話數。",
      bestWpm: "今日會話中的最高 WPM。",
      avgAcc: "今日會話的平均準確率。",
    },
  },

  // ── WPM Chart ────────────────────────────────────────────
  wpmChart: {
    speedProgress: "速度進展",
    accuracyTrend: "準確率趨勢",
    summaryStats: {
      avgWpm: "平均 wpm",
      peak: "峰值",
      sessions: "會話",
      avg: "平均",
      floor: "底線",
    },
    noData: "該時間段暫無數據",
    tooltips: {
      speed: "速度",
      accuracy: "準確率",
      wpmUnit: "{{n}} wpm",
      accUnit: "{{n}}%",
    },
  },

  // ── Keyboard Heatmap ──────────────────────────────────────
  keyboardHeatmap: {
    title: "鍵盤熱力圖",
    tabs: {
      falseRate: "失敗率",
      frequency: "頻率",
      transitions: "過渡",
    },
    transitionsFrom: "從 {{key}} 的過渡",
    arcNote: "弧線顏色反映命中率，得分在熱力圖中為輔助參考。",
    legend: {
      falseRate: {
        low: "低",
        some: "一般",
        many: "較多",
        high: "高",
      },
      frequency: {
        rare: "稀少",
        often: "常見",
        most: "最多",
      },
      transitions: {
        clean: "乾淨",
        minor: "輕微",
        risky: "風險",
        errorProne: "易錯",
      },
    },
    hitRate: "命中率",
    score: "得分",
    pickLogicalKey: "選擇字元",
  },

  // ── Adaptive Progress Card ────────────────────────────────
  adaptiveProgressCard: {
    title: "自適應進度",
    empty: "自適應模式正在追蹤你的進度",
    emptyDesc:
      "在練習頁面切換到自適應模式——系統會學習你的強項，並專注於需要提升的按鍵",
    sessions_one: "{{count}} 次會話",
    sessions_other: "{{count}} 次會話",
    pills: {
      unlocked: "已解鎖",
      mastered: "已掌握",
      confidence: "置信度",
    },
    metrics: {
      speed: "速度",
      accuracy: "準確率",
      score: "得分",
      integrity: "完整度",
      clicks: "擊鍵數",
      cps: "每秒擊鍵",
    },
    keyConfidenceMap: "按鍵置信度地圖",
    weakestKeys: "最弱按鍵",
    strongestKeys: "最強按鍵",
    legend: {
      weak: "薄弱",
      learning: "學習中",
      good: "良好",
      mastered: "已掌握",
      locked: "已鎖定",
    },
  },

  // ── Key Detail Panel ──────────────────────────────────────
  keyDetailPanel: {
    totalPresses: "{{n}} 次總按壓",
    falsePct: "{{pct}} 失敗",
    statsNote: "成功/失敗是目標鍵統計，誤按是實際按下此鍵但目標為其他鍵的次數。",
    trend: "趨勢：",
    trendUp: "+{{n}}%",
    trendDown: "{{n}}%",
    trendStable: "穩定",
    stats: {
      success: "成功",
      misPresses: "誤按",
      false: "失敗",
      keyAccuracy: "按鍵準確率",
    },
    tooltips: {
      success: "目標為此鍵時正確按下的次數。",
      misPresses: "目標為其他鍵時誤按此鍵的次數。",
      false: "目標為此鍵時按下錯誤鍵的次數。",
      keyAccuracy: "此鍵的總體準確率。",
    },
    keyAccuracyLabel: "近 {{n}} 次會話的按鍵準確率",
    chartLabels: {
      session: "會話",
      keyAccuracy: "按鍵準確率",
    },
  },

  // ── Activity Heatmap ──────────────────────────────────────
  activityHeatmap: {
    title: "活動記錄",
    activeDays_one: "{{count}} 個活躍天",
    activeDays_other: "{{count}} 個活躍天",
    dayLabels: {
      mon: "一",
      wed: "三",
      fri: "五",
    },
    tooltip: {
      sessions: "{{n}} 次會話 · 最佳 {{wpm}} wpm",
      noSessions: "無會話",
    },
    legend: {
      less: "少",
      more: "多",
    },
    ariaLabel: "顯示練習會話時間分佈的活動熱力圖",
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
      loop: "循環",
      once: "單次",
      sequential: "順序",
      random: "隨機",
    },
    noSelection: "未選擇",
    playing: "♪ 播放中",
    playlist: "播放列表",
    allTracks: "所有曲目",
    nextTrack: "下一曲",
  },

  // ── MIDI Page ────────────────────────────────────────────
  midiPage: {
    loopModes: {
      loop: "循環",
      once: "單次",
      sequential: "順序",
      random: "隨機",
    },
    presets: "預設",
    yourFiles: "我的文件",
    playlist: "播放列表",
    upload: "上傳",
    emptyFiles: "上傳你的 MIDI 文件",
    emptyFilesDesc: "將 .mid 文件拖拽到此處或點擊瀏覽。你的文件將與預設一同播放。",
    addMore: "添加更多",
    clearPlaylist: "清空",
    emptyPlaylist: "播放列表為空",
    emptyPlaylistHint: "使用 + 添加曲目",
    itemCount_one: "{{count}} 項",
    itemCount_other: "{{count}} 項",
    activeBadge: "活躍",
    playingBadge: "播放中",
    testButton: "測試",
    frames: "{{n}} 幀",
    synths: {
      piano: "鋼琴",
      strings: "弦樂",
      synth: "合成器",
      musicBox: "音樂盒",
      bell: "鐘聲",
    },
    uploadDialog: {
      title: "上傳 MIDI 文件",
      subtitle: "保存前請編輯名稱並添加描述。",
      name: "名稱",
      description: "描述",
      descriptionPlaceholder: "可選描述...",
      framesDetected: "檢測到 {{n}} 幀",
      cancel: "取消",
      save: "保存",
    },
    editDialog: {
      title: "編輯 MIDI 文件",
      subtitle: "更新名稱和描述。",
      name: "名稱",
      description: "描述",
      descriptionPlaceholder: "可選描述...",
      cancel: "取消",
      save: "保存",
    },
  },

  // ── Settings Page ────────────────────────────────────────
  settingsPage: {
    dataManagement: {
      title: "數據管理",
      sessions_one: "{{count}} 次會話",
      sessions_other: "{{count}} 次會話",
      keyRecords_one: "{{count}} 條按鍵記錄",
      keyRecords_other: "{{count}} 條按鍵記錄",
      transitionRecords_one: "{{count}} 條過渡記錄",
      transitionRecords_other: "{{count}} 條過渡記錄",
      midiFiles_one: "{{count}} 個 MIDI 文件",
      midiFiles_other: "{{count}} 個 MIDI 文件",
      exportBackup: "導出備份",
      exported: "已導出！",
      importBackup: "導入備份",
      imported: "已導入！",
      invalidFile: "無效文件",
      clearStatistics: "清除統計",
      clearDialog: {
        title: "清除所有統計數據？",
        description:
          "這將永久刪除你的所有打字會話、按鍵統計、過渡統計和每日目標。MIDI 文件和設置將被保留。此操作無法撤銷。",
        cancel: "取消",
        confirm: "刪除統計",
      },
      resetSettings: "重置設置",
      resetDialog: {
        title: "重置所有設置？",
        description:
          "這將把 MelodyType 恢復到默認配置，包括自適應練習、顯示和 MIDI 偏好。你的練習統計和 MIDI 文件將被保留。",
        cancel: "取消",
        confirm: "重置設置",
      },
    },
    language: {
      title: "語言",
      label: "介面語言",
      auto: "自動（瀏覽器）",
      en: "English",
      zh: "中文",
    },
    about: {
      title: "關於",
      tagline: "打字與音樂的交響",
      description:
        "MelodyType 是一款將鍵盤訓練與音樂享受相結合的打字練習應用。每次擊鍵都會觸發 MIDI 音符，將你的練習轉化為旋律。所有數據都存儲在瀏覽器本地——無需賬戶，無需雲端，完全私密。",
      docsHint: "查看鍵盤快捷鍵、指標詞彙表和使用指南",
      viewDocs: "查看文檔 →",
    },
  },

  // ── Docs Page ────────────────────────────────────────────
  docsPage: {
    nav: {
      gettingStarted: "快速入門",
      practiceModes: "練習模式",
      adaptiveMode: "自適應模式",
      timeMode: "限時模式",
      quoteMode: "名言模式",
      metricsGlossary: "指標詞彙表",
      melodyMidi: "旋律與 MIDI",
      dashboard: "儀表盤",
      midiManagement: "MIDI 管理",
      keyboardShortcuts: "鍵盤快捷鍵",
    },
    overview: {
      title: "歡迎使用 MelodyType",
      p1: "MelodyType 是一款將鍵盤訓練與即時音樂融合的打字練習應用。你的每次擊鍵都會驅動 MIDI 旋律，將每次會話變成一場音樂演奏。",
      p2: "自適應引擎追蹤每個按鍵的準確率和速度，自動調整練習內容以針對你的薄弱點。根據你的目標選擇三種模式之一。",
      quickStart: {
        title: "快速入門",
        step1: "從練習區域頂部選擇練習模式",
        step2: "直接開始打字——無需先點擊任何地方",
        step3: "Tab 鍵重新開始會話；Esc 鍵返回關卡選擇（限時模式）",
      },
      features: {
        title: "探索功能",
        adaptive: {
          title: "自適應模式",
          desc: "按鍵逐步推進，智能適應你的技能水平",
        },
        time: {
          title: "限時模式",
          desc: "設有速度和準確率目標的評級關卡",
        },
        dashboard: {
          title: "儀表盤",
          desc: "詳細統計、熱力圖和進度圖表",
        },
        midi: {
          title: "MIDI 與旋律",
          desc: "與擊鍵同步的可自定義背景音樂",
        },
      },
    },
    practice: {
      title: "練習模式",
      description: "MelodyType 提供三種不同的練習模式，各自針對打字提升的不同方面。",
      modes: {
        adaptive: {
          title: "自適應",
          desc: "持續適應你的薄弱點，專注於你不擅長的按鍵，並隨著進步解鎖新按鍵。",
        },
        time: {
          title: "限時",
          desc: "固定時長的關卡，有評級性能目標。根據 WPM 和準確率獲得 C 到 S 的評級。",
        },
        quote: {
          title: "名言",
          desc: "打出文學、科學和哲學領域的名言名句。無壓力，純粹的自由練習。",
        },
      },
      commonControls: {
        title: "通用操作",
        desc: "在所有模式下，Tab 鍵重新開始當前會話，虛擬鍵盤可從練習工具欄開關。",
      },
    },
    adaptive: {
      title: "自適應模式",
      p1: "自適應模式是 MelodyType 的核心功能。它從一小組常用字母開始，隨著你的表現提升逐步解鎖新按鍵。",
      progressiveUnlocking: {
        title: "漸進式按鍵解鎖",
        desc: "系統監控你輸入的每個按鍵，只有當所有當前活躍按鍵都達到速度、準確率和一致性的掌握閾值時，才會解鎖下一個字母。",
      },
      focusKey: {
        title: "專注鍵",
        desc: "最近解鎖的按鍵成為專注鍵。自適應引擎生成更頻繁包含該鍵的文本，幫助你更快建立肌肉記憶。",
      },
      masteryCriteria: {
        title: "按鍵掌握標準",
        items: [
          "速度：該按鍵的每分鐘字符數達到目標 CPM 閾值",
          "準確率：近期和終身準確率超過所需百分比",
          "一致性：已記錄足夠的總擊鍵數，使測量結果可靠",
          "旋律完整度：平均旋律完整度得分達到最低閾值",
        ],
      },
      options: {
        title: "選項",
        desc: "選項面板（齒輪圖標）允許你調整目標 CPM、切換「嚴格要求當前掌握」模式。",
      },
    },
    time: {
      title: "限時模式",
      levelSelection: {
        title: "關卡選擇",
        desc: "關卡分為四個層級：初級、中級、高階和專家。每個關卡有固定時限、單詞難度設置，以及可選的標點和數字。",
      },
      gradingSystem: {
        title: "評級系統",
        desc: "每個關卡根據你的 WPM 和準確率給出 C 到 S 的評級：",
        grades: {
          s: "S — 速度和準確率均大幅超出目標",
          a: "A — 乾淨地達成關卡目標",
          b: "B — 略低於目標但仍為通過",
          c: "C — 以最低通過標準完成關卡",
        },
      },
      results: {
        title: "結果與進度",
        desc: "每次運行後，結果面板顯示你的評級、WPM、準確率和 WPM 趨勢圖。每個關卡的最佳評級和 WPM 都會被追蹤。",
      },
    },
    quote: {
      title: "名言模式",
      p1: "名言模式呈現來自文學、科學、哲學和歷史的名言名句。沒有時間限制或評級要求——專為輕鬆、探索性練習設計。",
      p2: "名言長度和複雜度各不相同。旋律和流量計仍正常運作，即使在無壓力環境中也鼓勵穩定的節奏。",
    },
    metrics: {
      title: "指標詞彙表",
      core: {
        title: "核心指標",
        wpm: {
          label: "WPM（每分鐘字數）",
          desc: "淨打字速度，計算公式為（正確字符數 / 5）÷ 已用分鐘數。錯誤會被扣除。",
        },
        rawWpm: {
          label: "原始 WPM",
          desc: "扣除錯誤前的總打字速度。顯示你不考慮準確率 的實際擊鍵速度。",
        },
        accuracy: {
          label: "準確率",
          desc: "首次嘗試即正確的擊鍵百分比。",
        },
        consistency: {
          label: "一致性",
          desc: "你在會話中打字速度的穩定程度。數值越高越穩定。",
        },
        cpm: {
          label: "CPM（每分鐘字符數）",
          desc: "原始字符吞吐量。在自適應模式中內部用於每鍵速度閾值。",
        },
      },
      adaptive: {
        title: "自適應指標",
        keyAccuracy: {
          label: "按鍵準確率",
          desc: "單鍵成功率：目標為該鍵時正確按下的頻率。",
        },
        keyScore: {
          label: "按鍵得分",
          desc: "某鍵的綜合得分，將速度、準確率和旋律完整度融合為 0-100 的單一數值。",
        },
        confidence: {
          label: "置信度",
          desc: "某鍵真正被掌握的統計確定性。需要足夠多的一致性表現才能達到高置信度。",
        },
        falseCount: {
          label: "失敗",
          desc: "目標為該鍵時按下錯誤鍵的次數。同一目標位置重複按錯只計一次。",
        },
      },
      dashboard: {
        title: "儀表盤關鍵統計",
        streak: {
          label: "連續天數",
          desc: "至少完成一次練習會話的連續日曆天數。",
        },
        melodyIntegrity: {
          label: "旋律完整度",
          desc: "旋律在會話中持續播放的程度。100% 意味著你打字穩定無間斷。暫停和爆發式輸入會降低此分數。",
        },
        practiceTime: {
          label: "練習時長",
          desc: "活躍打字會話的總累計時間。",
        },
      },
    },
    melody: {
      title: "旋律與音樂流動",
      p1: "每次擊鍵觸發一個 MIDI 音符。音調來自當前播放的旋律曲目；你的打字速度決定播放速度。",
      flowStates: {
        title: "流動狀態",
        onPace: "節奏良好——打字速度達到或超過目標節奏；旋律正常播放",
        fallingBehind: "節奏落後——打字速度略慢；旋律相應減速",
        paused: "已暫停——短暫無輸入；旋律暫停",
      },
      integrityScore: {
        title: "旋律完整度得分",
        desc: "在每次會話結束時記錄，此分數反映旋律積極播放的時間百分比。連續不間斷的打字得分更高。",
      },
    },
    dashboard: {
      title: "儀表盤",
      p1: "儀表盤為你提供所有練習模式的長期進度概覽。",
      sections: {
        overviewStats: {
          title: "概覽統計",
          desc: "頂級數字：平均 WPM、最佳 WPM、總體準確率、旋律完整度、總會話數、累計練習時長和當前連續天數。",
        },
        dailyGoal: {
          title: "每日目標",
          desc: "可配置的每日練習目標（分鐘）。每天完成會話時圓環填充。在設置中設定你的目標。",
        },
        activityHeatmap: {
          title: "活動熱力圖",
          desc: "GitHub 風格的貢獻圖，顯示過去一年的練習頻率。顏色越深表示當天會話越多。",
        },
        charts: {
          title: "圖表",
          desc: "按時間範圍過濾的 WPM 趨勢和準確率趨勢圖。使用範圍選擇器放大近期會話或查看長期趨勢。",
        },
        keyboardHeatmap: {
          title: "鍵盤熱力圖",
          desc: "每鍵性能的可視化表示。在誤觸率、頻率和過渡視圖之間切換，找出薄弱點。",
        },
      },
    },
    midi: {
      title: "MIDI 管理",
      p1: "MIDI 頁面讓你控制練習中播放的背景音樂。",
      layout: {
        title: "佈局",
        desc: "三列：預設（內置曲目）、我的文件（上傳的 .mid 文件）和播放列表（當前隊列）。",
      },
      controls: {
        title: "操作",
        items: [
          "點擊曲目將其設為活躍源",
          "使用 + 將曲目添加到播放列表",
          "循環模式選擇器（循環/單次/順序/隨機）控制播放順序",
          "合成器選擇器更改樂器音色",
          "測試播放任意曲目的短預覽",
        ],
      },
      uploading: {
        title: "上傳文件",
        desc: "點擊上傳或將 .mid 文件拖拽到我的文件面板。為每個文件命名並添加可選描述。文件存儲在瀏覽器本地。",
      },
      floatingPlayer: {
        title: "懸浮播放器",
        desc: "離開 MIDI 頁面後，角落會出現懸浮播放器。用它暫停/恢復、跳轉曲目和更改循環模式，無需離開練習會話。",
      },
    },
    shortcuts: {
      title: "鍵盤快捷鍵",
      columns: {
        action: "操作",
        shortcut: "快捷鍵",
        context: "場景",
      },
      rows: [
        {
          action: "重新開始會話",
          shortcut: "Tab",
          context: "練習（所有模式）",
        },
        {
          action: "返回關卡選擇",
          shortcut: "Esc",
          context: "限時模式",
        },
        {
          action: "下一步 / 上一步",
          shortcut: "→ / ←",
          context: "引導教程",
        },
        {
          action: "關閉教程",
          shortcut: "Esc",
          context: "引導教程",
        },
      ],
      tips: {
        title: "提示",
        items: [
          "打字前無需點擊文本區域——直接開始打字，會話即刻啟動。",
          "可隱藏虛擬鍵盤以減少練習時的視覺干擾。",
          "切換模式會重置當前會話，但所有統計記錄均會保留。",
          "自適應模式中的選項面板是持久的——CPM 目標在會話之間保存。",
          "導出的備份包含所有會話、按鍵統計、MIDI 文件和設置。",
          "可隨時從導航欄的 ? 按鈕重播引導教程。",
        ],
      },
    },
  },

  // ── Time Levels data ──────────────────────────────────────
  timeLevels: {
    "b-1": {
      name: "第一步",
      description: "短暫寬鬆的練習，鞏固基礎。",
    },
    "b-2": {
      name: "快速衝刺",
      description: "稍長的簡單練習專注於穩定節奏。",
    },
    "b-3": {
      name: "穩定流動",
      description: "一分鐘簡單詞彙，培養持久耐力。",
    },
    "b-4": {
      name: "數字初識",
      description: "在不提高詞彙難度的情況下加入數字練習。",
    },
    "b-5": {
      name: "長途跑",
      description: "兩分鐘簡單文本，為更長測試做準備。",
    },
    "i-1": {
      name: "進階起步",
      description: "短暫爆發中級詞彙，提升基礎速度。",
    },
    "i-2": {
      name: "詞彙爆發",
      description: "30 秒中級詞彙，目標節奏更穩。",
    },
    "i-3": {
      name: "完整句子",
      description: "引入標點符號，詞彙難度保持適中。",
    },
    "i-4": {
      name: "數字衝擊",
      description: "數字加中級詞彙，強化視覺過渡。",
    },
    "i-5": {
      name: "綜合練習",
      description: "較長的中級練習，標點壓力開始顯現。",
    },
    "i-6": {
      name: "耐力測試",
      description: "兩分鐘中級測試，考驗控制而非慌亂。",
    },
    "a-1": {
      name: "複雜詞彙",
      description: "高難度詞彙成為新常態。",
    },
    "a-2": {
      name: "標點達人",
      description: "高難度句子，標點再也無法忽視。",
    },
    "a-3": {
      name: "數據錄入",
      description: "高難度詞彙加數字，短暫而精準的練習。",
    },
    "a-4": {
      name: "極限挑戰",
      description: "長篇高難度文本，考驗標點處理能力。",
    },
    "a-5": {
      name: "全套組合",
      description: "高難度詞彙、標點和數字同時出現。",
    },
    "a-6": {
      name: "馬拉松",
      description: "長時間高級練習，測試疲勞中的節奏保持。",
    },
    "e-1": {
      name: "速度惡魔",
      description: "短暫全功能爆發，獎勵極致控制力。",
    },
    "e-2": {
      name: "精準測試",
      description: "專家基準：速度極高，失誤代價更重。",
    },
    "e-3": {
      name: "終極關卡",
      description: "兩分鐘專家文本，節奏與專注缺一不可。",
    },
  },

  // ── Time Level Tier labels ───────────────────────────────
  tierMeta: {
    beginner: "初級",
    intermediate: "中級",
    advanced: "高級",
    expert: "專家",
  },

  // ── Time Grade messages ──────────────────────────────────
  gradeMessages: {
    S: "頂級通關。節奏與精準度均保持穩定。",
    A: "出色發揮。乾淨地達成了關卡目標。",
    B: "穩健通關。稍微提升速度或準確率即可晉級。",
    C: "基礎通關。在追求更快評級前先建立穩定性。",
  },
} as const

export default zhTW
