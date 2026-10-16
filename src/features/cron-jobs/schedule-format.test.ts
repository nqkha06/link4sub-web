import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCronPattern,
  describeSchedule,
  formatDurationShort,
  parseCronPreset,
  splitEvery,
} from "./schedule-format.ts";

describe("describeSchedule", () => {
  it("describes intervals", () => {
    assert.deepEqual(describeSchedule({ mode: "every", pattern: null, everyMs: 60_000 }), {
      key: "everyMinutes",
      values: { count: 1 },
    });
    assert.equal(describeSchedule({ mode: "every", pattern: null, everyMs: 86_400_000 }).key, "everyDays");
    assert.equal(describeSchedule({ mode: "every", pattern: null, everyMs: 15_000 }).key, "everySeconds");
  });

  it("describes common cron patterns", () => {
    const cron = (pattern: string) => describeSchedule({ mode: "cron", pattern, everyMs: null });
    assert.deepEqual(cron("0 0 * * *"), { key: "dailyAt", values: { time: "00:00" } });
    assert.deepEqual(cron("30 7 * * 1"), { key: "weeklyAt", values: { time: "07:30", weekday: 1 } });
    assert.deepEqual(cron("5 * * * *"), { key: "hourlyAt", values: { minute: "05" } });
    assert.deepEqual(cron("*/15 * * * *"), { key: "everyMinutes", values: { count: 15 } });
    assert.deepEqual(cron("0 */6 * * *"), { key: "everyHours", values: { count: 6 } });
    assert.deepEqual(cron("0 3 1 * *"), { key: "monthlyAt", values: { time: "03:00", day: 1 } });
    assert.deepEqual(cron("0 9-17 * * 1-5"), { key: "custom", values: { pattern: "0 9-17 * * 1-5" } });
    assert.equal(cron("0 0 0 * * *").key, "custom");
  });
});

describe("cron presets", () => {
  it("round-trips preset patterns", () => {
    for (const pattern of ["15 * * * *", "0 7 * * *", "30 2 * * 0", "0 1 15 * *"]) {
      assert.equal(buildCronPattern(parseCronPreset(pattern)), pattern);
    }
    assert.equal(parseCronPreset("0 9-17 * * 1-5").preset, "custom");
    assert.equal(buildCronPattern(parseCronPreset(null)), null);
  });
});

describe("helpers", () => {
  it("splits intervals and formats durations", () => {
    assert.deepEqual(splitEvery(7_200_000), { amount: 2, unit: "hours" });
    assert.deepEqual(splitEvery(90_000), { amount: 90, unit: "seconds" });
    assert.equal(formatDurationShort(850), "850 ms");
    assert.equal(formatDurationShort(2_500), "2.5 s");
    assert.equal(formatDurationShort(125_000), "2m 05s");
  });
});
