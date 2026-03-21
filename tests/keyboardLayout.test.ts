import { describe, expect, it } from "vitest"
import {
  SPECIAL_CHARACTER_CHARS,
  getLogicalCandidatesForPhysicalKey,
  getLogicalCharCategory,
  getPhysicalKeyForLogicalChar,
  getRequiredPhysicalKeysForLogicalChar,
} from "../src/lib/keyboardLayout"

describe("keyboardLayout", () => {
  it("maps shifted punctuation to the correct physical key plus shift", () => {
    expect(getPhysicalKeyForLogicalChar("?")).toMatchObject({
      physicalKey: "/",
      shift: true,
    })
    expect(getRequiredPhysicalKeysForLogicalChar("!")).toEqual(["1", "shift"])
  })

  it("exposes both logical candidates for ambiguous physical keys", () => {
    expect(getLogicalCandidatesForPhysicalKey("/")).toEqual(["/", "?"])
    expect(getLogicalCandidatesForPhysicalKey("1")).toEqual(["1", "!"])
  })

  it("classifies special characters separately from prose punctuation", () => {
    expect(getLogicalCharCategory("?")).toBe("punctuation")
    expect(getLogicalCharCategory("/")).toBe("special")
    expect(SPECIAL_CHARACTER_CHARS).toContain("/")
    expect(SPECIAL_CHARACTER_CHARS).not.toContain("?")
  })
})
