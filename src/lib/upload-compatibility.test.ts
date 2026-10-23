import assert from "node:assert/strict";
import { test } from "node:test";
import { getUploadMimeType } from "./upload-compatibility.ts";

// File providers on iOS may omit MIME metadata even for a valid audio filename.
test("audio uploads infer missing provider metadata without overriding an explicit MIME", () => {
  for (const [name, type, expected] of [
    ["Song.MP3", "", "audio/mpeg"],
    ["song.m4a", "application/octet-stream", "audio/mp4"],
    ["song.wav", "", "audio/wav"],
    ["photo.JPG", "", "image/jpeg"],
    ["clip.MOV", "application/octet-stream", "video/quicktime"],
    ["song.mp3", "audio/mp3", "audio/mp3"],
    ["document.mp3", "application/pdf", "application/pdf"],
    ["song.mp3.exe", "", ""],
  ]) assert.equal(getUploadMimeType({ name, type }), expected);
});
