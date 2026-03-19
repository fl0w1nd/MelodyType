import { useLiveQuery } from "dexie-react-hooks"
import type { MidiConfig } from "@/engine/midi/types"
import { defaultMidiConfig } from "@/engine/midi/types"
import {
  DEFAULT_RECOVER_KEYS,
  DEFAULT_TARGET_CPM,
  INITIAL_UNLOCK_COUNT,
  LETTER_FREQUENCY_ORDER,
} from "@/engine/typing/adaptiveConstants"
import { presetList } from "@/engine/midi/presets"
import { db } from "@/lib/db"

// ── Types ──────────────────────────────────────────────

export type SelectedMidiSource =
  | { type: "preset"; id: string }
  | { type: "file"; id: number }

export type AdaptivePhase = "progressive" | "reinforcement"

export interface AppSettingsSnapshot {
  showKeyboard: boolean
  dailyGoalMinutes: number
  midiConfig: MidiConfig
  selectedMidi: SelectedMidiSource | null
  midiPlaylist: SelectedMidiSource[]
  adaptiveTargetCpm: number
  adaptiveRecoverKeys: boolean
  adaptiveForcedKeys: string[]
  adaptiveUnlocked: string[]
  adaptivePhase: AdaptivePhase
}

export type SettingKey = keyof AppSettingsSnapshot

// ── Definitions ────────────────────────────────────────

type SettingDefinition<T> = {
  defaultValue: T
  deserialize: (raw: string | undefined) => T
  serialize: (value: T) => string
}

const defaultSelectedMidi: SelectedMidiSource | null = presetList[0]
  ? { type: "preset", id: presetList[0].id }
  : null

function parseJsonOrFallback<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function parseNumberOrFallback(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

const defaultUnlockedKeys = LETTER_FREQUENCY_ORDER.slice(0, INITIAL_UNLOCK_COUNT)

export const appSettingDefinitions: {
  [K in SettingKey]: SettingDefinition<AppSettingsSnapshot[K]>
} = {
  showKeyboard: {
    defaultValue: true,
    deserialize: (raw) => raw !== "false",
    serialize: (value) => String(value),
  },
  dailyGoalMinutes: {
    defaultValue: 30,
    deserialize: (raw) => parseNumberOrFallback(raw, 30),
    serialize: (value) => String(value),
  },
  midiConfig: {
    defaultValue: defaultMidiConfig,
    deserialize: (raw) => parseJsonOrFallback(raw, defaultMidiConfig),
    serialize: (value) => JSON.stringify(value),
  },
  selectedMidi: {
    defaultValue: defaultSelectedMidi,
    deserialize: (raw) => parseJsonOrFallback(raw, defaultSelectedMidi),
    serialize: (value) => JSON.stringify(value),
  },
  midiPlaylist: {
    defaultValue: [],
    deserialize: (raw) => parseJsonOrFallback(raw, []),
    serialize: (value) => JSON.stringify(value),
  },
  adaptiveTargetCpm: {
    defaultValue: DEFAULT_TARGET_CPM,
    deserialize: (raw) => parseNumberOrFallback(raw, DEFAULT_TARGET_CPM),
    serialize: (value) => String(value),
  },
  adaptiveRecoverKeys: {
    defaultValue: DEFAULT_RECOVER_KEYS,
    deserialize: (raw) => raw === "true",
    serialize: (value) => String(value),
  },
  adaptiveForcedKeys: {
    defaultValue: [],
    deserialize: (raw) => parseJsonOrFallback(raw, []),
    serialize: (value) => JSON.stringify(value),
  },
  adaptiveUnlocked: {
    defaultValue: defaultUnlockedKeys,
    deserialize: (raw) => parseJsonOrFallback(raw, defaultUnlockedKeys),
    serialize: (value) => JSON.stringify(value),
  },
  adaptivePhase: {
    defaultValue: "progressive" as const,
    deserialize: (raw) => (raw === "reinforcement" ? "reinforcement" : "progressive"),
    serialize: (value) => value,
  },
}

export const DEFAULT_APP_SETTINGS: AppSettingsSnapshot = {
  showKeyboard: appSettingDefinitions.showKeyboard.defaultValue,
  dailyGoalMinutes: appSettingDefinitions.dailyGoalMinutes.defaultValue,
  midiConfig: appSettingDefinitions.midiConfig.defaultValue,
  selectedMidi: appSettingDefinitions.selectedMidi.defaultValue,
  midiPlaylist: appSettingDefinitions.midiPlaylist.defaultValue,
  adaptiveTargetCpm: appSettingDefinitions.adaptiveTargetCpm.defaultValue,
  adaptiveRecoverKeys: appSettingDefinitions.adaptiveRecoverKeys.defaultValue,
  adaptiveForcedKeys: appSettingDefinitions.adaptiveForcedKeys.defaultValue,
  adaptiveUnlocked: appSettingDefinitions.adaptiveUnlocked.defaultValue,
  adaptivePhase: appSettingDefinitions.adaptivePhase.defaultValue,
}

// ── Legacy key migration ───────────────────────────────

const legacySettingKeys: Partial<Record<SettingKey, string[]>> = {
  adaptiveTargetCpm: ["adaptive_targetCpm"],
  adaptiveRecoverKeys: ["adaptive_recoverKeys"],
  adaptiveForcedKeys: ["adaptive_forcedKeys"],
  adaptiveUnlocked: ["adaptive_unlocked"],
}

// ── Low-level DB access ────────────────────────────────

async function getRawSetting(key: SettingKey): Promise<string | undefined> {
  const entry = await db.settings.where("key").equals(key).first()
  if (entry) return entry.value

  const aliases = legacySettingKeys[key] ?? []
  for (const alias of aliases) {
    const legacyEntry = await db.settings.where("key").equals(alias).first()
    if (legacyEntry) return legacyEntry.value
  }

  return undefined
}

function resolveRawFromMap(entryMap: Map<string, string>, key: SettingKey): string | undefined {
  const direct = entryMap.get(key)
  if (direct !== undefined) return direct

  const aliases = legacySettingKeys[key] ?? []
  for (const alias of aliases) {
    const legacy = entryMap.get(alias)
    if (legacy !== undefined) return legacy
  }
  return undefined
}

async function setRawSetting(key: SettingKey, value: string): Promise<void> {
  await db.transaction("rw", db.settings, async () => {
    const existing = await db.settings.where("key").equals(key).first()
    if (existing) {
      await db.settings.update(existing.id!, { value })
    } else {
      await db.settings.add({ key, value })
    }
  })
}

// ── Public API ─────────────────────────────────────────

export async function getAppSetting<K extends SettingKey>(
  key: K,
): Promise<AppSettingsSnapshot[K]> {
  const raw = await getRawSetting(key)
  return appSettingDefinitions[key].deserialize(raw)
}

export async function setAppSetting<K extends SettingKey>(
  key: K,
  value: AppSettingsSnapshot[K],
): Promise<void> {
  const raw = appSettingDefinitions[key].serialize(value)
  await setRawSetting(key, raw)
}

export async function getAppSettingsSnapshot(): Promise<AppSettingsSnapshot> {
  const entries = await db.settings.toArray()
  const entryMap = new Map(entries.map((entry) => [entry.key, entry.value]))

  const resolve = <K extends SettingKey>(key: K) =>
    appSettingDefinitions[key].deserialize(resolveRawFromMap(entryMap, key))

  return {
    showKeyboard: resolve("showKeyboard"),
    dailyGoalMinutes: resolve("dailyGoalMinutes"),
    midiConfig: resolve("midiConfig"),
    selectedMidi: resolve("selectedMidi"),
    midiPlaylist: resolve("midiPlaylist"),
    adaptiveTargetCpm: resolve("adaptiveTargetCpm"),
    adaptiveRecoverKeys: resolve("adaptiveRecoverKeys"),
    adaptiveForcedKeys: resolve("adaptiveForcedKeys"),
    adaptiveUnlocked: resolve("adaptiveUnlocked"),
    adaptivePhase: resolve("adaptivePhase"),
  }
}

export async function resetAppSettings(): Promise<void> {
  await db.settings.clear()

  const writeDefault = <K extends SettingKey>(key: K) =>
    setRawSetting(key, appSettingDefinitions[key].serialize(DEFAULT_APP_SETTINGS[key]))

  const keys = Object.keys(appSettingDefinitions) as SettingKey[]
  await Promise.all(keys.map(writeDefault))
}

export function useAppSetting<K extends SettingKey>(key: K): AppSettingsSnapshot[K] {
  return useLiveQuery(
    () => getAppSetting(key),
    [key],
    appSettingDefinitions[key].defaultValue,
  ) as AppSettingsSnapshot[K]
}
