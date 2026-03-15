import Dexie, { type EntityTable } from "dexie"

export interface TypingSession {
  id?: number
  timestamp: number
  mode: string
  modeConfig: string
  wpm: number
  rawWpm: number
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

export interface KeyStat {
  id?: number
  key: string
  totalHits: number
  errors: number
  totalLatency: number
  avgSpeed: number
  lastUpdated: number
}

export interface MidiFile {
  id?: number
  name: string
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
  const [sessions, keyStats, midiFiles, settings, dailyGoals] =
    await Promise.all([
      db.sessions.toArray(),
      db.keyStats.toArray(),
      db.midiFiles.toArray(),
      db.settings.toArray(),
      db.dailyGoals.toArray(),
    ])

  const midiFilesExport = midiFiles.map((f) => ({
    ...f,
    data: Array.from(new Uint8Array(f.data)),
  }))

  return JSON.stringify(
    { sessions, keyStats, midiFiles: midiFilesExport, settings, dailyGoals },
    null,
    2,
  )
}

export async function importAllData(jsonStr: string): Promise<void> {
  const data = JSON.parse(jsonStr)

  await db.transaction(
    "rw",
    [db.sessions, db.keyStats, db.midiFiles, db.settings, db.dailyGoals],
    async () => {
      await Promise.all([
        db.sessions.clear(),
        db.keyStats.clear(),
        db.midiFiles.clear(),
        db.settings.clear(),
        db.dailyGoals.clear(),
      ])

      if (data.sessions) await db.sessions.bulkAdd(data.sessions)
      if (data.keyStats) await db.keyStats.bulkAdd(data.keyStats)
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
