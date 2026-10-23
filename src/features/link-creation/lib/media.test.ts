import assert from "node:assert/strict";
import test from "node:test";

import {
  getYouTubeVideoId,
  getYouTubeWatchEmbedUrl,
} from "./media.ts";

test("recognizes supported YouTube video URLs for watch actions", () => {
  const id = "dQw4w9WgXcQ";

  assert.equal(getYouTubeVideoId(`https://www.youtube.com/watch?v=${id}`), id);
  assert.equal(getYouTubeVideoId(`https://youtu.be/${id}`), id);
  assert.equal(getYouTubeVideoId(`https://www.youtube.com/shorts/${id}`), id);
  assert.equal(getYouTubeVideoId(`https://www.youtube.com/embed/${id}`), id);
});

test("rejects channel and non-YouTube URLs for watch actions", () => {
  assert.equal(getYouTubeVideoId("https://www.youtube.com/@example"), "");
  assert.equal(getYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ"), "");
  assert.equal(getYouTubeVideoId("not-a-url"), "");
});

test("builds a controllable YouTube player for watch actions", () => {
  const embedUrl = getYouTubeWatchEmbedUrl("https://youtu.be/dQw4w9WgXcQ");

  assert.match(embedUrl, /^https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ\?/);
  assert.match(embedUrl, /controls=1/);
  assert.match(embedUrl, /autoplay=1/);
});
