import Dexie, { type EntityTable } from "dexie"

export interface TypingSession {
  id?: number
  timestamp: number
  mode: string
  modeConfig: string
  wpm: number
  rawWpm: number
  melodyIntegrity?: number
  accuracy: number
  duration: number
  totalChars: number
  correctChars: number
  errorChars: number
  keystrokes: KeystrokeRecord[]
  midiFileId?: number
}

export interface KeystrokeRecord {
  key: string
  correct: boolean
  timestamp: number
  latency: number
}

export interface KeySample {
  index: number
  timestamp: number
  cpm: number
  filteredCpm: number
}

export interface KeyStat {
  id?: number
  key: string
  totalHits: number
  errors: number
  totalLatency: number
  avgSpeed: number
  lastUpdated: number
  adaptiveEwmaCpm?: number
  adaptiveBestCpm?: number
  adaptiveCorrectHits?: number
  adaptiveErrorHits?: number
  adaptiveDecayedCorrectHits?: number
  adaptiveDecayedErrorHits?: number
  adaptiveSamples?: KeySample[]
  adaptiveSampleIndex?: number
}

export interface BigramStat {
  id?: number
  fromKey: string
  toKey: string
  bigram: string
  totalAttempts: number
  correctAttempts: number
  ewmaLatency: number
  bestLatency: number
  decayedCorrect: number
  decayedErrors: number
  lastUpdated: number
}

export interface MidiFile {
  id?: number
  name: string
  description?: string
  data: ArrayBuffer
  frameCount: number
  uploadedAt: number
  isPreset: boolean
}

export interface UserSettings {
  id?: number
  key: string
  value: string
}

export interface DailyGoal {
  id?: number
  date: string
  targetMinutes: number
  completedMinutes: number
  sessionsCount: number
  bestWpm: number
  avgAccuracy: number
}

class MelodyTypeDB extends Dexie {
  sessions!: EntityTable<TypingSession, "id">
  keyStats!: EntityTable<KeyStat, "id">
  bigramStats!: EntityTable<BigramStat, "id">
  midiFiles!: EntityTable<MidiFile, "id">
  settings!: EntityTable<UserSettings, "id">
  dailyGoals!: EntityTable<DailyGoal, "id">

  constructor() {
    super("MelodyTypeDB")
    this.version(1).stores({
      sessions: "++id, timestamp, mode",
      keyStats: "++id, &key, lastUpdated",
      midiFiles: "++id, name, isPreset",
      settings: "++id, &key",
      dailyGoals: "++id, &date",
    })
    this.version(2).stores({
      sessions: "++id, timestamp, mode",
      keyStats: "++id, &key, lastUpdated",
      midiFiles: "++id, name, isPreset",
      settings: "++id, &key",
      dailyGoals: "++id, &date",
    })
    this.version(3).stores({
      sessions: "++id, timestamp, mode",
      keyStats: "++id, &key, lastUpdated",
      bigramStats: "++id, &bigram, fromKey, toKey",
      midiFiles: "++id, name, isPreset",
      settings: "++id, &key",
      dailyGoals: "++id, &date",
    })
  }
}

export const db = new MelodyTypeDB()

export async function getSetting(key: string): Promise<string | undefined> {
  const entry = await db.settings.where("key").equals(key).first()
  return entry?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where("key").equals(key).first()
  if (existing) {
    await db.settings.update(existing.id!, { value })
  } else {
    await db.settings.add({ key, value })
  }
}

export async function exportAllData(): Promise<string> {
  const [sessions, keyStats, bigramStats, midiFiles, settings, dailyGoals] =
    await Promise.all([
      db.sessions.toArray(),
      db.keyStats.toArray(),
      db.bigramStats.toArray(),
      db.midiFiles.toArray(),
      db.settings.toArray(),
      db.dailyGoals.toArray(),
    ])

  const midiFilesExport = midiFiles.map((f) => ({
    ...f,
    data: Array.from(new Uint8Array(f.data)),
  }))

  return JSON.stringify(
    { sessions, keyStats, bigramStats, midiFiles: midiFilesExport, settings, dailyGoals },
    null,
    2,
  )
}

export async function importAllData(jsonStr: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: Record<string, any>
  try {
    data = JSON.parse(jsonStr)
  } catch {
    throw new Error("备份文件不是有效的 JSON 格式")
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("备份文件格式不正确")
  }

  const validKeys = ["sessions", "keyStats", "bigramStats", "midiFiles", "settings", "dailyGoals"]
  for (const key of validKeys) {
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      throw new Error(`备份数据中 "${key}" 字段格式不正确，应为数组`)
    }
  }

  await db.transaction(
    "rw",
    [db.sessions, db.keyStats, db.bigramStats, db.midiFiles, db.settings, db.dailyGoals],
    async () => {
      await Promise.all([
        db.sessions.clear(),
        db.keyStats.clear(),
        db.bigramStats.clear(),
        db.midiFiles.clear(),
        db.settings.clear(),
        db.dailyGoals.clear(),
      ])

      if (data.sessions) await db.sessions.bulkAdd(data.sessions)
      if (data.keyStats) await db.keyStats.bulkAdd(data.keyStats)
      if (data.bigramStats) await db.bigramStats.bulkAdd(data.bigramStats)
      if (data.midiFiles) {
        const restored = data.midiFiles.map(
          (f: { data: number[] } & Omit<MidiFile, "data">) => ({
            ...f,
            data: new Uint8Array(f.data).buffer,
          }),
        )
        await db.midiFiles.bulkAdd(restored)
      }
      if (data.settings) await db.settings.bulkAdd(data.settings)
      if (data.dailyGoals) await db.dailyGoals.bulkAdd(data.dailyGoals)
    },
  )
}
