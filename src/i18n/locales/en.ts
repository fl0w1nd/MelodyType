const en = {
  // ── Common ──────────────────────────────────────────────
  common: {
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    loading: "Loading...",
    optional: "Optional",
  },

  // ── Navigation ──────────────────────────────────────────
  nav: {
    practice: "Practice",
    dashboard: "Dashboard",
    midi: "MIDI",
    docs: "Docs",
    settings: "Settings",
    githubRepository: "GitHub Repository",
    footer: "MelodyType · Where typing meets music",
  },

  // ── Guided Tour ─────────────────────────────────────────
  tour: {
    welcome: {
      title: "Welcome to MelodyType",
      description:
        "Pair your typing practice with musical melodies.\nLearn the core features in under a minute.",
      start: "Start Tour",
      duration: "(~30 sec)",
      skip: "Skip, I'll explore myself",
    },
    close: "Close tour",
    prev: "Previous",
    next: "Next",
    finish: "Start Typing 🎹",
    replay: "Replay guided tour",
    steps: {
      logo: {
        title: "Welcome to MelodyType 🎵",
        description:
          "An app that blends typing practice with musical melodies. Every keystroke drives the melody forward, making practice enjoyable.",
      },
      modeSelector: {
        title: "Choose a Practice Mode",
        description:
          "Three modes to choose from: Adaptive (smart adaptation to your weak keys), Time (timed challenges for S-grade), and Quote (famous quotes typing).",
      },
      optionsButton: {
        title: "⚙️ This Button Matters!",
        description:
          "This is the hidden options panel for Adaptive mode. Click it to set your target typing speed (CPM) — the system uses it to adjust difficulty and key unlock pace. Let's open it now.",
      },
      optionsPanel: {
        title: "Set Your Target Speed 🎯",
        description:
          "Choose a target CPM (characters per minute) that suits you. Use presets for a quick pick or drag the slider for precision. The higher the target, the stricter the unlock criteria. Give it a try!",
      },
      metricsBar: {
        title: "Live Stats Panel",
        description:
          "See your real-time WPM, accuracy, elapsed time, raw speed, and melody integrity — giving you a complete picture of your typing state.",
      },
      flowMeter: {
        title: "Melody Flow Meter",
        description:
          "Keep a steady typing rhythm and the melody keeps flowing. Pausing or frequent errors drain melody energy — a unique MelodyType mechanic.",
      },
      textArea: {
        title: "Start Typing",
        description:
          "Just type on your keyboard to begin — no need to click anywhere. The cursor follows your input automatically, and wrong characters are highlighted in red.",
      },
      practiceActions: {
        title: "Quick Actions",
        description:
          "Press Tab to restart quickly, or toggle the virtual keyboard. These small buttons are subtle but very handy.",
      },
      navBar: {
        title: "Explore More",
        description:
          "Dashboard for history stats, MIDI to manage background music, Docs to read the guide, and Settings to manage data and preferences. Enjoy exploring!",
      },
    },
  },

  // ── App / Page Loader ────────────────────────────────────
  app: {
    loading: "Loading...",
  },

  // ── Practice Page ────────────────────────────────────────
  practice: {
    newKeyUnlocked: "🔓 New key unlocked:",
    restart: "Restart",
    allLevels: "All Levels",
    hideKeyboard: "Hide",
    showKeyboard: "Show",
    keyboard: "Keyboard",
    roundSession: "Round {{round}} · current session · Esc resets",
  },

  // ── Mode Selector ────────────────────────────────────────
  modeSelector: {
    adaptive: "Adaptive",
    time: "Time",
    quote: "Quote",
    adaptiveDesc:
      "Focuses on your weakest keys. Unlocks new letters as you improve.",
    timeDesc:
      "Race against the clock. Hit speed and accuracy targets for higher grades.",
    quoteDesc: "Type famous quotes. Clean, unranked freeform sessions.",
  },

  // ── Metrics Bar ──────────────────────────────────────────
  metricsBar: {
    wpm: "WPM",
    accuracy: "Accuracy",
    remaining: "Remaining",
    time: "Time",
    raw: "Raw",
    integrity: "Integrity",
    timeRemaining: "Time remaining",
    tooltips: {
      wpm: "Words per minute — net speed after subtracting errors.",
      accuracy: "Percentage of correct keystrokes.",
      time: "Elapsed time for the current session.",
      raw: "Raw WPM before error penalty.",
      integrity:
        "Melody integrity — how consistently you kept the melody flowing.",
    },
  },

  // ── Flow Meter ───────────────────────────────────────────
  flowMeter: {
    ready: "Ready",
    onPace: "On Pace",
    fallingBehind: "Falling Behind…",
    paused: "Paused",
    label: "Melody Flow",
    tooltip:
      "Tracks your typing rhythm. Type steadily to keep the melody flowing. Pausing or slowing down reduces flow.",
  },

  // ── Key Progress Panel ───────────────────────────────────
  keyProgressPanel: {
    options: "Options",
    round: "Round {{n}}",
    collapse: "Collapse",
    details: "Details",
    title: "Adaptive Practice",
    subtitle: "Progressive key unlocking based on your performance",
    defaultSuffix: "· Default",
    requireCurrentMastery: "Require Current Mastery",
    requireCurrentMasteryDesc:
      "All active keys must pass current thresholds before unlocking the next letter.",
    stats: {
      speed: "Speed",
      accuracy: "Accuracy",
      score: "Score",
      integrity: "Integrity",
      target: "Target",
      clicks: "Clicks",
      cps: "CPS",
    },
    scoreTooltip:
      "Composite score combining speed, accuracy, and melody integrity.",
    integrityTooltip:
      "Melody integrity — how consistently you kept the melody flowing.",
    summary: {
      avgSpeed: "Average Speed",
      avgAccuracy: "Average Accuracy",
      avgScore: "Average Score",
      avgIntegrity: "Average Melody Integrity",
      sessions: "Adaptive Sessions",
      totalClicks: "Total Clicks",
      avgCps: "Average CPS",
      avgConfidence: "Average Confidence",
      unlockReadiness: "Unlock Readiness",
    },
    unlockReadiness: {
      allMet: "All active keys meet the adaptive unlock thresholds.",
      blocking_one:
        "{{count}} key still blocking the next letter.",
      blocking_other:
        "{{count}} keys still blocking the next letter.",
    },
    unlockedKeys: "Unlocked Keys",
    nextToUnlock: "Next to Unlock",
    lockedManualHint: "Locked keys above can be unlocked manually.",
    lockedTitle: "{{key}}: Locked · click to unlock manually",
    keyStats: {
      current: "Current",
      best: "Best",
      recent: "Recent",
      lifetime: "Lifetime",
      hits: "Hits",
      forecast: "Forecast",
    },
    gates: {
      targetCpm: "Target {{cpm}} cpm",
      minHits: "{{n}}+ hits",
      recentRate: "{{n}}% recent",
      lifetimeRate: "{{n}}% lifetime",
    },
    mastered: "mastered",
    focus: "Focus:",
    readyForUnlock: "Ready for next unlock",
    focusKeyThresholds: "Focus Key Thresholds",
    unlockDialog: {
      title: "Unlock {{key}} early?",
      description:
        "Manual unlocks skip the adaptive thresholds. The key will be added to your active set immediately.",
      unlocking: "Unlocking…",
      unlock: "Unlock Key",
    },
    allKeysReady: "All currently unlocked keys meet the adaptive unlock thresholds.",
    moreBlockers: "+{{n}} more",
  },

  // ── Results Panel ────────────────────────────────────────
  resultsPanel: {
    title: "Practice Complete",
    newPb: "New PB!",
    targetClear: "Target clear: {{wpm}} WPM at {{acc}}%",
    stats: {
      wpm: "WPM",
      accuracy: "Accuracy",
      time: "Time",
      consistency: "Consistency",
      melodyIntegrity: "Melody Integrity",
      cpm: "CPM",
    },
    detailStats: {
      correct: "Correct",
      errors: "Errors",
      rawWpm: "Raw WPM",
      melodyIntegrity: "Melody Integrity",
      words: "Words",
    },
    levelProgress: "Level Progress",
    compactStats: {
      bestWpm: "Best WPM",
      bestAccuracy: "Best Accuracy",
      bestGrade: "Best Grade",
      attempts: "Attempts",
    },
    nextRequirement: "Next: grade {{grade}} · {{wpm}} WPM at {{acc}}%",
    sGradeAchieved: "S-grade achieved — no higher rank on this level",
    newPersonalBest: "New personal best!",
    firstAttempt:
      "First attempt on this level — your record will appear here after this run is saved.",
    wpmOverTime: "WPM Over Time",
    buttons: {
      allLevels: "All Levels",
      tryAgain: "Try Again",
      nextLevel: "Next Level",
      nextLesson: "Next Lesson",
    },
    grades: {
      outstanding: "Outstanding performance!",
      excellent: "Excellent typing skills!",
      great: "Great work, keep improving!",
      good: "Good effort, practice more!",
      keepPracticing: "Keep practicing!",
      beginner: "Every master was once a beginner.",
    },
    chart: {
      speed: "Speed",
      accuracy: "Accuracy",
      keyAccuracy: "Key Accuracy",
      session: "Session",
      wpmUnit: "{{n}} wpm",
    },
  },

  // ── Time Level Select ────────────────────────────────────
  timeLevelSelect: {
    stats: {
      played: "Played",
      aOrBetter: "A or Better",
      sClears: "S Clears",
    },
    tierCount: "/ {{n}} played",
    notPlayed: "Not played",
    gradeBest: "{{grade}} Best",
    newBadge: "New",
    punc: "Punc",
    num: "Num",
    dialog: {
      record: "Record",
      gradeThresholds: "Grade Thresholds",
      record_labels: {
        best: "Best",
        last: "Last",
        attempts: "Attempts",
        lastPlayed: "Last played",
      },
      noRuns: "No runs logged yet.",
      next: "Next:",
      close: "Close",
      startLevel: "Start Level",
    },
  },

  // ── Dashboard Page ───────────────────────────────────────
  dashboardPage: {
    tabs: {
      adaptive: "Adaptive",
      time: "Time",
      quote: "Quote",
    },
  },

  // ── Stats Overview ───────────────────────────────────────
  statsOverview: {
    title: "Dashboard",
    subtitle: "Track your typing journey",
    subtitleEmpty: "Start practicing to see your progress",
    trends: {
      improving: "Improving",
      needsFocus: "Needs focus",
      steadyPace: "Steady pace",
    },
    metrics: {
      avgWpm: "Avg WPM",
      bestWpm: "Best WPM",
      accuracy: "Accuracy",
      melodyIntegrity: "Melody Integrity",
      sessions: "Sessions",
      practice: "Practice",
      streak: "Streak",
    },
    tooltips: {
      avgWpm: "Average words per minute across all sessions.",
      bestWpm: "Your highest WPM achieved in a single session.",
      accuracy: "Average accuracy across all sessions.",
      melodyIntegrity: "Average melody integrity score.",
      sessions: "Total number of completed practice sessions.",
      practice: "Total time spent practicing.",
      streak: "Consecutive days with at least one session.",
    },
  },

  // ── Session History ──────────────────────────────────────
  sessionHistory: {
    title: "Recent Sessions",
    last: "Last {{n}}",
    empty: "No sessions yet",
    emptyDesc:
      "Complete a typing session on the Practice page to see your history here",
    timeAgo: {
      justNow: "Just now",
      minutesAgo: "{{n}}m ago",
      hoursAgo: "{{n}}h ago",
      daysAgo: "{{n}}d ago",
    },
  },

  // ── Daily Goal Ring ──────────────────────────────────────
  dailyGoalRing: {
    title: "Today's Goal",
    done: "Done",
    minutes: "minutes",
    ofMinutes: "/ {{n}} min",
    stats: {
      progress: "Progress",
      sessions: "Sessions",
      bestWpm: "Best WPM",
      avgAcc: "Avg Acc",
    },
    tooltips: {
      progress: "Minutes practiced today toward your daily goal.",
      sessions: "Number of sessions completed today.",
      bestWpm: "Best WPM achieved in today's sessions.",
      avgAcc: "Average accuracy across today's sessions.",
    },
  },

  // ── WPM Chart ────────────────────────────────────────────
  wpmChart: {
    speedProgress: "Speed Progress",
    accuracyTrend: "Accuracy Trend",
    summaryStats: {
      avgWpm: "avg wpm",
      peak: "peak",
      sessions: "sessions",
      avg: "avg",
      floor: "floor",
    },
    noData: "No data for this period",
    tooltips: {
      speed: "Speed",
      accuracy: "Accuracy",
      wpmUnit: "{{n}} wpm",
      accUnit: "{{n}}%",
    },
  },

  // ── Keyboard Heatmap ─────────────────────────────────────
  keyboardHeatmap: {
    title: "Keyboard Heatmap",
    tabs: {
      falseRate: "False Rate",
      frequency: "Frequency",
      transitions: "Transitions",
    },
    transitionsFrom: "Transitions from {{key}}",
    arcNote:
      "Arc color reflects hit rate. Score stays secondary in the heatmap.",
    legend: {
      falseRate: {
        low: "Low",
        some: "Some",
        many: "Many",
        high: "High",
      },
      frequency: {
        rare: "Rare",
        often: "Often",
        most: "Most",
      },
      transitions: {
        clean: "Clean",
        minor: "Minor",
        risky: "Risky",
        errorProne: "Error-prone",
      },
    },
    hitRate: "Hit Rate",
    score: "Score",
  },

  // ── Adaptive Progress Card ───────────────────────────────
  adaptiveProgressCard: {
    title: "Adaptive Progress",
    empty: "Adaptive mode tracks your progress",
    emptyDesc:
      "Switch to Adaptive mode on the Practice page — the system will learn your strengths and focus on keys you need to improve",
    sessions_one: "{{count}} session",
    sessions_other: "{{count}} sessions",
    pills: {
      unlocked: "Unlocked",
      mastered: "Mastered",
      confidence: "Confidence",
    },
    metrics: {
      speed: "Speed",
      accuracy: "Accuracy",
      score: "Score",
      integrity: "Integrity",
      clicks: "Clicks",
      cps: "CPS",
    },
    keyConfidenceMap: "Key Confidence Map",
    weakestKeys: "Weakest Keys",
    strongestKeys: "Strongest Keys",
    legend: {
      weak: "Weak",
      learning: "Learning",
      good: "Good",
      mastered: "Mastered",
      locked: "Locked",
    },
  },

  // ── Key Detail Panel ─────────────────────────────────────
  keyDetailPanel: {
    totalPresses: "{{n}} Total Presses",
    falsePct: "{{pct}} false",
    statsNote:
      "Success/False are target-key stats. Mis-presses are actual wrong presses of this key.",
    trend: "Trend:",
    trendUp: "+{{n}}%",
    trendDown: "{{n}}%",
    trendStable: "Stable",
    stats: {
      success: "Success",
      misPresses: "Mis-presses",
      false: "False",
      keyAccuracy: "Key Accuracy",
    },
    tooltips: {
      success:
        "Times you correctly pressed this key when it was the target.",
      misPresses:
        "Times you pressed this key when a different key was the target.",
      false:
        "Times you pressed the wrong key when this key was the target.",
      keyAccuracy: "Overall accuracy rate for this key.",
    },
    keyAccuracyLabel: "Key accuracy per session (recent {{n}})",
    chartLabels: {
      session: "Session",
      keyAccuracy: "Key Accuracy",
    },
  },

  // ── Activity Heatmap ─────────────────────────────────────
  activityHeatmap: {
    title: "Activity",
    activeDays_one: "{{count}} active day",
    activeDays_other: "{{count}} active days",
    dayLabels: {
      mon: "Mon",
      wed: "Wed",
      fri: "Fri",
    },
    tooltip: {
      sessions: "{{n}} session(s) · best {{wpm}} wpm",
      noSessions: "No sessions",
    },
    legend: {
      less: "Less",
      more: "More",
    },
    ariaLabel: "Activity heatmap showing practice sessions over time",
  },

  // ── Time Range Selector ──────────────────────────────────
  timeRangeSelector: {
    recent: "Recent",
    day: "Day",
    week: "Week",
    month: "Month",
  },

  // ── MIDI Floating Player ─────────────────────────────────
  midiFloatingPlayer: {
    loopModes: {
      loop: "Loop",
      once: "Once",
      sequential: "Sequential",
      random: "Random",
    },
    noSelection: "No selection",
    playing: "♪ Playing",
    playlist: "Playlist",
    allTracks: "All Tracks",
    nextTrack: "Next track",
  },

  // ── MIDI Page ────────────────────────────────────────────
  midiPage: {
    presets: "Presets",
    yourFiles: "Your Files",
    playlist: "Playlist",
    upload: "Upload",
    emptyFiles: "Upload your MIDI files",
    emptyFilesDesc:
      "Drop .mid files here or click to browse. Your files play alongside presets.",
    addMore: "Add more",
    clearPlaylist: "Clear",
    emptyPlaylist: "Playlist is empty",
    emptyPlaylistHint: "Use + to add tracks",
    itemCount_one: "{{count}} item",
    itemCount_other: "{{count}} items",
    activeBadge: "Active",
    playingBadge: "Playing",
    testButton: "Test",
    frames: "{{n}} frames",
    synths: {
      piano: "Piano",
      strings: "Strings",
      synth: "Synth",
      musicBox: "Music Box",
      bell: "Bell",
    },
    uploadDialog: {
      title: "Upload MIDI File",
      subtitle: "Edit the name and add a description before saving.",
      name: "Name",
      description: "Description",
      descriptionPlaceholder: "Optional description...",
      framesDetected: "{{n}} frames detected",
      cancel: "Cancel",
      save: "Save",
    },
    editDialog: {
      title: "Edit MIDI File",
      subtitle: "Update the name and description.",
      name: "Name",
      description: "Description",
      descriptionPlaceholder: "Optional description...",
      cancel: "Cancel",
      save: "Save",
    },
  },

  // ── Settings Page ────────────────────────────────────────
  settingsPage: {
    dataManagement: {
      title: "Data Management",
      sessions_one: "{{count}} session",
      sessions_other: "{{count}} sessions",
      keyRecords_one: "{{count}} key record",
      keyRecords_other: "{{count}} key records",
      transitionRecords_one: "{{count}} transition record",
      transitionRecords_other: "{{count}} transition records",
      midiFiles_one: "{{count}} MIDI file",
      midiFiles_other: "{{count}} MIDI files",
      exportBackup: "Export Backup",
      exported: "Exported!",
      importBackup: "Import Backup",
      imported: "Imported!",
      invalidFile: "Invalid File",
      clearStatistics: "Clear Statistics",
      clearDialog: {
        title: "Clear All Statistics?",
        description:
          "This will permanently delete all your typing sessions, key statistics, transition statistics, and daily goals. MIDI files and settings will be preserved. This action cannot be undone.",
        cancel: "Cancel",
        confirm: "Delete Statistics",
      },
      resetSettings: "Reset Settings",
      resetDialog: {
        title: "Reset All Settings?",
        description:
          "This restores MelodyType to its default configuration, including adaptive practice, display, and MIDI preferences. Your practice statistics and MIDI files will be preserved.",
        cancel: "Cancel",
        confirm: "Reset Settings",
      },
    },
    language: {
      title: "Language",
      label: "Interface Language",
      auto: "Auto (Browser)",
      en: "English",
      zh: "中文",
    },
    about: {
      title: "About",
      tagline: "Where typing meets music",
      description:
        "MelodyType is a typing practice application that combines keyboard training with musical enjoyment. Each keystroke triggers MIDI notes, turning your practice sessions into melodies. All your data is stored locally in your browser — no accounts, no cloud, complete privacy.",
      docsHint: "For keyboard shortcuts, metrics glossary, and usage guide",
      viewDocs: "View Docs →",
    },
  },

  // ── Docs Page ────────────────────────────────────────────
  docsPage: {
    nav: {
      gettingStarted: "Getting Started",
      practiceModes: "Practice Modes",
      adaptiveMode: "Adaptive Mode",
      timeMode: "Time Mode",
      quoteMode: "Quote Mode",
      metricsGlossary: "Metrics Glossary",
      melodyMidi: "Melody & MIDI",
      dashboard: "Dashboard",
      midiManagement: "MIDI Management",
      keyboardShortcuts: "Keyboard Shortcuts",
    },
    overview: {
      title: "Welcome to MelodyType",
      p1: "MelodyType is a typing practice application that blends keyboard training with real-time music. Every keystroke you make drives a MIDI melody, turning each session into a musical performance.",
      p2: "The adaptive engine tracks your per-key accuracy and speed, automatically adjusting what you practice to target your weaknesses. Choose from three modes depending on your goals.",
      quickStart: {
        title: "Quick Start",
        step1: "Select a practice mode from the top of the practice area",
        step2: "Start typing — no need to click anywhere first",
        step3: "Tab restarts the session; Esc returns to the level selector (Time mode)",
      },
      features: {
        title: "Explore Features",
        adaptive: {
          title: "Adaptive Mode",
          desc: "Intelligent key-by-key progression that adapts to your skill level",
        },
        time: {
          title: "Time Mode",
          desc: "Graded levels with speed and accuracy targets",
        },
        dashboard: {
          title: "Dashboard",
          desc: "Detailed statistics, heatmaps, and progress charts",
        },
        midi: {
          title: "MIDI & Melody",
          desc: "Customizable background music synchronized to your keystrokes",
        },
      },
    },
    practice: {
      title: "Practice Modes",
      description:
        "MelodyType offers three distinct practice modes, each designed for a different aspect of typing improvement.",
      modes: {
        adaptive: {
          title: "Adaptive",
          desc: "Continuously adapts to your weaknesses. Focuses on keys you struggle with and unlocks new ones as you improve.",
        },
        time: {
          title: "Time",
          desc: "Fixed-length levels with graded performance targets. Earn C through S grades based on WPM and accuracy.",
        },
        quote: {
          title: "Quote",
          desc: "Type famous quotes from literature, science, and philosophy. No pressure, just clean freeform practice.",
        },
      },
      commonControls: {
        title: "Common Controls",
        desc: "Across all modes, Tab restarts the current session and the virtual keyboard can be toggled on or off from the practice toolbar.",
      },
    },
    adaptive: {
      title: "Adaptive Mode",
      p1: "Adaptive mode is MelodyType's core feature. It starts with a small set of common letters and progressively unlocks new keys as your performance improves.",
      progressiveUnlocking: {
        title: "Progressive Key Unlocking",
        desc: "The system monitors every key you type and only unlocks the next letter when all currently active keys meet the mastery thresholds for speed, accuracy, and consistency.",
      },
      focusKey: {
        title: "Focus Key",
        desc: "The most recently unlocked key becomes the focus key. The adaptive engine generates text that includes this key more frequently, helping you build muscle memory faster.",
      },
      masteryCriteria: {
        title: "Key Mastery Criteria",
        items: [
          "Speed: characters per minute for that specific key meets the target CPM threshold",
          "Accuracy: recent and lifetime accuracy exceed the required percentages",
          "Consistency: enough total hits have been recorded to make the measurement reliable",
          "Melody Integrity: average melody integrity score meets the minimum threshold",
        ],
      },
      options: {
        title: "Options",
        desc: "The Options panel (gear icon) lets you adjust the target CPM, toggle the \"Require Current Mastery\" gate, and manually unlock keys ahead of schedule.",
      },
    },
    time: {
      title: "Time Mode",
      levelSelection: {
        title: "Level Selection",
        desc: "Levels are grouped into four tiers: Beginner, Intermediate, Advanced, and Expert. Each level has a fixed time limit, a word difficulty setting, and optional punctuation and number inclusion.",
      },
      gradingSystem: {
        title: "Grading System",
        desc: "Each level awards a grade from C to S based on your WPM and accuracy:",
        grades: {
          s: "S — exceeds both speed and accuracy targets by a significant margin",
          a: "A — meets the level targets cleanly",
          b: "B — slightly below targets but still a passing clear",
          c: "C — completed the level at minimum passing criteria",
        },
      },
      results: {
        title: "Results & Progress",
        desc: "After each run, the results panel shows your grade, WPM, accuracy, and a WPM-over-time chart. Your best grade and WPM are tracked per level.",
      },
    },
    quote: {
      title: "Quote Mode",
      p1: "Quote mode presents famous quotes from literature, science, philosophy, and history. There are no time limits or grade requirements — it is designed for relaxed, exploratory practice.",
      p2: "Quotes vary in length and complexity. The melody and flow meter still operate normally, encouraging steady rhythm even in a pressure-free environment.",
    },
    metrics: {
      title: "Metrics Glossary",
      core: {
        title: "Core Metrics",
        wpm: {
          label: "WPM (Words Per Minute)",
          desc: "Net typing speed, calculated as (correct characters / 5) ÷ minutes elapsed. Errors are subtracted.",
        },
        rawWpm: {
          label: "Raw WPM",
          desc: "Gross typing speed before subtracting errors. Shows your physical keystroke speed regardless of accuracy.",
        },
        accuracy: {
          label: "Accuracy",
          desc: "Percentage of keystrokes that were correct on the first attempt.",
        },
        consistency: {
          label: "Consistency",
          desc: "How stable your typing speed is across the session. Higher is steadier.",
        },
        cpm: {
          label: "CPM (Characters Per Minute)",
          desc: "Raw character throughput. Used internally in Adaptive mode for per-key speed thresholds.",
        },
      },
      adaptive: {
        title: "Adaptive Metrics",
        keyAccuracy: {
          label: "Key Accuracy",
          desc: "Per-key success rate: how often you pressed the right key when it was the target.",
        },
        keyScore: {
          label: "Key Score",
          desc: "Composite score for a key, blending speed, accuracy, and melody integrity into a single 0–100 value.",
        },
        confidence: {
          label: "Confidence",
          desc: "Statistical certainty that a key has been truly mastered. Requires enough hits at consistent performance to reach high confidence.",
        },
        forecast: {
          label: "Forecast",
          desc: "Predicted future performance for a key based on current trajectory. Used to anticipate when a key will reach mastery.",
        },
      },
      dashboard: {
        title: "Dashboard Key Stats",
        streak: {
          label: "Streak",
          desc: "Number of consecutive calendar days with at least one completed practice session.",
        },
        melodyIntegrity: {
          label: "Melody Integrity",
          desc: "How continuously the melody played during a session. A score of 100% means you typed steadily with no gaps. Pauses and bursts reduce this score.",
        },
        practiceTime: {
          label: "Practice Time",
          desc: "Total cumulative time spent in active typing sessions.",
        },
      },
    },
    melody: {
      title: "Melody & Musical Flow",
      p1: "Every keystroke triggers a MIDI note. The note pitch is derived from the melody track currently playing; your typing speed determines the playback tempo.",
      flowStates: {
        title: "Flow States",
        onPace: "On Pace — typing at or above the target rhythm; melody plays normally",
        fallingBehind:
          "Falling Behind — typing slightly slower; melody slows proportionally",
        paused: "Paused — no input for a moment; melody pauses",
      },
      integrityScore: {
        title: "Melody Integrity Score",
        desc: "Recorded at the end of each session, this score reflects what percentage of the time the melody was actively playing. Consistent, uninterrupted typing scores higher.",
      },
    },
    dashboard: {
      title: "Dashboard",
      p1: "The Dashboard gives you an overview of your long-term progress across all practice modes.",
      sections: {
        overviewStats: {
          title: "Overview Stats",
          desc: "Top-level numbers: average WPM, best WPM, overall accuracy, melody integrity, total sessions, cumulative practice time, and your current streak.",
        },
        dailyGoal: {
          title: "Daily Goal",
          desc: "A configurable daily practice target in minutes. The ring fills as you complete sessions each day. Set your goal in Settings.",
        },
        activityHeatmap: {
          title: "Activity Heatmap",
          desc: "GitHub-style contribution graph showing your practice frequency over the past year. Darker cells mean more sessions that day.",
        },
        charts: {
          title: "Charts",
          desc: "WPM over time and accuracy trend charts, filterable by time range. Use the range selector to zoom into recent sessions or view long-term trends.",
        },
        keyboardHeatmap: {
          title: "Keyboard Heatmap",
          desc: "Visual representation of per-key performance. Switch between false rate, frequency, and transition views to identify weak spots.",
        },
      },
    },
    midi: {
      title: "MIDI Management",
      p1: "The MIDI page lets you control the background music that plays during practice.",
      layout: {
        title: "Layout",
        desc: "Three columns: Presets (built-in tracks), Your Files (uploaded .mid files), and Playlist (your current queue).",
      },
      controls: {
        title: "Controls",
        items: [
          "Click a track to set it as the active source",
          "Use + to add tracks to the playlist",
          "The loop mode selector (Loop / Once / Sequential / Random) controls playback order",
          "The synth selector changes the instrument sound",
          "Test plays a short preview of any track",
        ],
      },
      uploading: {
        title: "Uploading Files",
        desc: "Click Upload or drag .mid files onto the Your Files panel. Give each file a name and optional description. Files are stored locally in your browser.",
      },
      floatingPlayer: {
        title: "Floating Player",
        desc: "When you navigate away from the MIDI page, a floating player appears in the corner. Use it to pause/resume, skip tracks, and change loop mode without leaving your practice session.",
      },
    },
    shortcuts: {
      title: "Keyboard Shortcuts",
      columns: {
        action: "Action",
        shortcut: "Shortcut",
        context: "Context",
      },
      rows: [
        {
          action: "Restart session",
          shortcut: "Tab",
          context: "Practice (all modes)",
        },
        {
          action: "Return to level select",
          shortcut: "Esc",
          context: "Time mode",
        },
        {
          action: "Next step / Previous step",
          shortcut: "→ / ←",
          context: "Guided tour",
        },
        {
          action: "Close tour",
          shortcut: "Esc",
          context: "Guided tour",
        },
      ],
      tips: {
        title: "Tips",
        items: [
          "You do not need to click the text area before typing — just start typing and the session begins.",
          "The virtual keyboard can be hidden to reduce visual distraction during practice.",
          "Switching modes resets the current session but preserves all recorded statistics.",
          "The Options panel in Adaptive mode is persistent — your CPM target is saved between sessions.",
          "Exported backups include all sessions, key statistics, MIDI files, and settings.",
          "The guided tour can be replayed at any time from the ? button in the navigation bar.",
        ],
      },
    },
  },

  // ── Time Levels data ─────────────────────────────────────
  timeLevels: {
    "b-1": {
      name: "First Steps",
      description: "Short, forgiving bursts to lock in the basics.",
    },
    "b-2": {
      name: "Quick Dash",
      description: "A slightly longer easy run focused on stable tempo.",
    },
    "b-3": {
      name: "Steady Flow",
      description: "A full minute of simple words to build staying power.",
    },
    "b-4": {
      name: "Number Intro",
      description:
        "Bring digits into the mix without raising the word difficulty.",
    },
    "b-5": {
      name: "Long Run",
      description: "Two minutes of easy text to prepare for longer tests.",
    },
    "i-1": {
      name: "Stepping Up",
      description: "Medium vocabulary in a short burst to raise baseline speed.",
    },
    "i-2": {
      name: "Word Power",
      description: "Medium words over 30 seconds with a steadier pace target.",
    },
    "i-3": {
      name: "Full Sentences",
      description: "Punctuation enters while the vocabulary stays manageable.",
    },
    "i-4": {
      name: "Number Crunch",
      description: "Digits plus medium words to sharpen visual transitions.",
    },
    "i-5": {
      name: "Mixed Bag",
      description:
        "Longer medium runs where punctuation pressure starts to matter.",
    },
    "i-6": {
      name: "Endurance",
      description: "A two-minute medium test that rewards control over panic.",
    },
    "a-1": {
      name: "Complex Words",
      description: "Hard vocabulary becomes the new normal.",
    },
    "a-2": {
      name: "Punctuation Pro",
      description:
        "Harder sentences where punctuation can no longer be ignored.",
    },
    "a-3": {
      name: "Data Entry",
      description: "Hard words and digits in a shorter, sharper burst.",
    },
    "a-4": {
      name: "The Challenge",
      description:
        "Long-form hard text that punishes sloppy punctuation handling.",
    },
    "a-5": {
      name: "Full Combo",
      description: "Hard words, punctuation, and numbers all at once.",
    },
    "a-6": {
      name: "Marathon",
      description:
        "A long advanced run that tests whether pace survives fatigue.",
    },
    "e-1": {
      name: "Speed Demon",
      description: "A short all-features burst that rewards explosive control.",
    },
    "e-2": {
      name: "Precision Test",
      description:
        "The expert benchmark: speed is high, but misses are punished harder.",
    },
    "e-3": {
      name: "The Gauntlet",
      description:
        "Two minutes of expert text where both pace and focus must hold.",
    },
  },

  // ── Time Level Tier labels ───────────────────────────────
  tierMeta: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
  },

  // ── Time Grade messages ──────────────────────────────────
  gradeMessages: {
    S: "Top-tier clear. Rhythm and precision both held up.",
    A: "Strong run. The level target was met cleanly.",
    B: "Solid clear. A little more speed or accuracy will push it higher.",
    C: "Baseline clear. Build consistency before chasing faster grades.",
  },
} as const

export default en
export type TranslationKeys = typeof en
