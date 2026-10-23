import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { DEFAULT_BIO_DESIGN } from "../../../contracts/bio-design.ts"
import { addMusicTrack, removeMusicTrack, renameMusicTrack, setActiveMusicTrack, titleFromFileName } from "./music-tracks.ts"

const empty = DEFAULT_BIO_DESIGN.audio.music

describe("music tracks", () => {
  it("makes the first added track active and enables music", () => {
    const music = addMusicTrack(empty, { assetId: "1", title: "One" }, "a")
    assert.equal(music.assetId, "1")
    assert.equal(music.title, "One")
    assert.equal(music.enabled, true)
    assert.deepEqual(music.tracks.map((track) => track.id), ["a"])
  })

  it("keeps the active track when adding more and caps the list at four", () => {
    let music = addMusicTrack(empty, { assetId: "1", title: "One" }, "a")
    for (const n of [2, 3, 4, 5]) music = addMusicTrack(music, { assetId: String(n), title: `T${n}` }, `id${n}`)
    assert.equal(music.tracks.length, 4)
    assert.equal(music.assetId, "1")
  })

  it("materialises legacy single-track data", () => {
    const legacy = { ...empty, enabled: true, assetId: "9", title: "Old" }
    const music = addMusicTrack(legacy, { assetId: "2", title: "New" }, "b")
    assert.deepEqual(music.tracks.map((track) => track.assetId), ["9", "2"])
    assert.equal(music.assetId, "9")
  })

  it("switches, renames and removes the active track", () => {
    let music = addMusicTrack(empty, { assetId: "1", title: "One" }, "a")
    music = addMusicTrack(music, { assetId: "2", title: "Two" }, "b")
    music = setActiveMusicTrack(music, "b")
    assert.equal(music.assetId, "2")
    music = renameMusicTrack(music, "b", "Second song with a very long title indeed")
    assert.equal(music.title.length, 30)
    music = removeMusicTrack(music, "b")
    assert.equal(music.assetId, "1")
    assert.equal(music.title, "One")
    music = removeMusicTrack(music, "a")
    assert.equal(music.assetId, null)
    assert.equal(music.enabled, false)
    assert.equal(music.tracks.length, 0)
  })

  it("re-selecting a file already in the list makes it active instead of duplicating", () => {
    let music = addMusicTrack(empty, { assetId: "1", title: "One" }, "a")
    music = addMusicTrack(music, { assetId: "2", title: "Two" }, "b")
    music = addMusicTrack(music, { assetId: "2", title: "Again" }, "c")
    assert.equal(music.tracks.length, 2)
    assert.equal(music.assetId, "2")
  })

  it("derives a title from the file name", () => {
    assert.equal(titleFromFileName("after_the-storm.mp3"), "after the storm")
  })
})
