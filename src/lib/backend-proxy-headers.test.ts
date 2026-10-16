import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("backend file proxies", () => {
  it("forward x-content-type-options to the browser", () => {
    // Hai proxy chỉ chuyển tiếp một danh sách header cố định; thiếu header
    // này thì nosniff do API đặt bị rơi trước khi tới trình duyệt.
    for (const path of [
      "./backend-binary-proxy.ts",
      "../app/api/backend/[...path]/route.ts",
    ]) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      assert.match(source, /"x-content-type-options"/, path);
    }
  });
});
