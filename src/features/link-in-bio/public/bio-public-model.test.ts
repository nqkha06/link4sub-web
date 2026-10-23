import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_BIO_DESIGN } from "../../../contracts/bio-design.ts";
import {
  getProfileBadges,
  getTiltTransform,
  parseDiscordInvite,
  parseDiscordTarget,
  parseLanyardPresence,
  resolveBioDesign,
  withBuiltinDesignAssets,
  withOpacity,
} from "./bio-public-model.ts";

describe("public bio page model", () => {
  it("falls back to the default design when the API does not send one", () => {
    const resolved = resolveBioDesign({} as never);
    assert.equal(resolved.design, DEFAULT_BIO_DESIGN);
    assert.equal(resolved.hasDesign, false);
    assert.deepEqual(resolved.assets, {});
  });

  it("applies opacity with color-mix and keeps fully opaque colors", () => {
    assert.equal(withOpacity("#FFFFFF", 30), "color-mix(in srgb, #FFFFFF 30%, transparent)");
    assert.equal(withOpacity("#000000", 120), "#000000");
  });

  it("derives badges from enabled platforms only", () => {
    assert.deepEqual(
      getProfileBadges(
        [
          { platform: "Discord", url: "https://discord.gg/x" },
          { platform: "Twitch", url: "https://twitch.tv/x", enabled: false },
          { platform: "TikTok", url: "https://tiktok.com/@x" },
        ],
        [{ type: "spotify-track", url: "https://open.spotify.com/track/1" }],
      ),
      ["creator", "music", "community"],
    );
  });

  it("recognises Discord profiles and invites", () => {
    assert.equal(parseDiscordTarget("https://discord.com/users/123456789012345678")?.kind, "user");
    assert.deepEqual(parseDiscordTarget("https://discord.gg/abc"), { kind: "invite", code: "abc", url: "https://discord.gg/abc" });
    assert.equal(parseDiscordTarget("https://example.com/x"), null);
  });

  it("normalises Discord invite and Lanyard payloads", () => {
    const invite = parseDiscordInvite("abc", {
      guild: { id: "9", name: "Crew", icon: "ic" },
      approximate_member_count: 120,
      approximate_presence_count: 14,
    });
    assert.deepEqual(invite, { code: "abc", name: "Crew", iconUrl: "https://cdn.discordapp.com/icons/9/ic.png?size=128", members: 120, online: 14 });
    assert.equal(parseDiscordInvite("abc", { message: "Unknown Invite" }), null);

    const presence = parseLanyardPresence({
      discord_status: "idle",
      discord_user: { id: "1", username: "kha", global_name: null, avatar: null },
      activities: [{ type: 0, name: "Valorant" }],
    });
    assert.equal(presence?.status, "idle");
    assert.equal(presence?.displayName, "kha");
    assert.equal(presence?.activity, "Playing Valorant");
    assert.equal(parseLanyardPresence({ discord_user: { id: "1" } }), null);
  });

  it("tilts away from the pointer up to the intensity at the edges", () => {
    assert.equal(getTiltTransform(0, 0, 100, 100, 10), "perspective(1000px) rotateX(-10deg) rotateY(10deg) scale3d(1, 1, 1)");
    assert.equal(getTiltTransform(100, 100, 100, 100, 10), "perspective(1000px) rotateX(10deg) rotateY(-10deg) scale3d(1, 1, 1)");
    assert.equal(getTiltTransform(50, 50, 100, 100, 10), "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  });

  it("resolves built-in template assets for the editor preview", () => {
    const design = structuredClone(DEFAULT_BIO_DESIGN);
    design.background.videoAssetId = "builtin:templates/aura/background.mp4";
    design.audio.music.assetId = "42";
    const assets = withBuiltinDesignAssets(design, { musicUrl: "/media/user/x.mp3", backgroundVideoUrl: "/old.mp4" });
    assert.equal(assets.backgroundVideoUrl, "/assets/bio/templates/aura/background.mp4");
    assert.equal(assets.musicUrl, "/media/user/x.mp3");
  });
});
