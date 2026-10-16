import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { LinkActionDto } from "./api-client";
import {
  recordMonetizationActionClick,
  visibleActionsAfterCooldown,
} from "./monetization-action-cooldown.ts";

function action(
  id: string,
  rank: number,
  behavior: "replace" | "hide" = "replace",
): LinkActionDto {
  return {
    id,
    platform: "other",
    action: "other-visit",
    url: `https://example.com/${id}`,
    monetization: {
      adId: id,
      cooldownMinutes: 60,
      cooldownBehavior: behavior,
      cooldownScope: "visitor",
      displayMode: "sequential",
      rotationGroup: "sponsor",
      rotationRank: rank,
    },
  };
}

describe("Ads action click cooldown", () => {
  it("uses the next eligible action from a rotation group", () => {
    const primary = action("primary", 0);
    const fallback = action("fallback", 1);
    const history = recordMonetizationActionClick({}, primary, "link-a", 1_000);

    assert.deepEqual(
      visibleActionsAfterCooldown([primary, fallback], history, "link-a", 2_000)
        .map((item) => item.id),
      ["fallback"],
    );
  });

  it("leaves the slot empty when the clicked action requests it", () => {
    const primary = action("primary", 0, "hide");
    const fallback = action("fallback", 1);
    const history = recordMonetizationActionClick({}, primary, "link-a", 1_000);
    assert.deepEqual(
      visibleActionsAfterCooldown([primary, fallback], history, "link-a", 2_000),
      [],
    );
  });

  it("supports link-only history and shows the action again after expiry", () => {
    const primary = action("primary", 0);
    primary.monetization!.cooldownScope = "link";
    const history = recordMonetizationActionClick({}, primary, "link-a", 1_000);

    assert.equal(
      visibleActionsAfterCooldown([primary], history, "link-b", 2_000).length,
      1,
    );
    assert.equal(
      visibleActionsAfterCooldown([primary], history, "link-a", 3_602_000).length,
      1,
    );
  });

  it("shows every eligible action in all mode", () => {
    const first = action("first", 0);
    const second = action("second", 1);
    first.monetization!.displayMode = "all";
    second.monetization!.displayMode = "all";

    assert.deepEqual(
      visibleActionsAfterCooldown([first, second], {}, "link-a", 2_000)
        .map((item) => item.id),
      ["first", "second"],
    );

    const history = recordMonetizationActionClick({}, first, "link-a", 1_000);
    assert.deepEqual(
      visibleActionsAfterCooldown([first, second], history, "link-a", 2_000)
        .map((item) => item.id),
      ["second"],
    );
  });

  it("resets a sequential group when the first action cooldown expires", () => {
    const first = action("first", 0);
    const second = action("second", 1);
    let history = recordMonetizationActionClick({}, first, "link-a", 1_000);
    history = recordMonetizationActionClick(history, second, "link-a", 2_000);

    assert.deepEqual(
      visibleActionsAfterCooldown([first, second], history, "link-a", 3_000),
      [],
    );
    assert.deepEqual(
      visibleActionsAfterCooldown([first, second], history, "link-a", 3_601_001)
        .map((item) => item.id),
      ["first"],
    );
  });
});
