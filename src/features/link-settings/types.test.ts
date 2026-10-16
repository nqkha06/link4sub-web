import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { linkPath, linkUrl } from "./types.ts";

const settings = {
  publicDomain: "https://go.example.com",
  socialPrefix: "",
  bioPrefix: "me",
};

describe("public link URL helpers", () => {
  it("uses domain/alias when the Social Link prefix is blank", () => {
    assert.equal(linkPath(settings, "social", "AbC123"), "/AbC123");
    assert.equal(linkUrl(settings, "social", "AbC123"), "https://go.example.com/AbC123");
  });

  it("keeps a separate configurable Bio prefix", () => {
    assert.equal(linkPath(settings, "bio", "creator"), "/me/creator");
    assert.equal(linkUrl(settings, "bio", "creator"), "https://go.example.com/me/creator");
  });
});
