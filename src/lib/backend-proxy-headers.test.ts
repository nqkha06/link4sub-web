import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { copyBackendResponseHeaders } from "./backend-response-headers.ts";

describe("backend file proxies", () => {
  it("forwards safe response metadata and strips backend-only headers", () => {
    const headers = copyBackendResponseHeaders(new Headers({
      "content-type": "image/png",
      "x-content-type-options": "nosniff",
      "set-cookie": "secret=value",
      "x-powered-by": "backend",
    }));

    assert.equal(headers.get("content-type"), "image/png");
    assert.equal(headers.get("x-content-type-options"), "nosniff");
    assert.equal(headers.get("cache-control"), "no-store");
    assert.equal(headers.has("set-cookie"), false);
    assert.equal(headers.has("x-powered-by"), false);
  });

  it("forwards route-specific metadata only when explicitly allowed", () => {
    const source = new Headers({
      location: "/login",
      "server-timing": "api;dur=12",
    });

    assert.equal(copyBackendResponseHeaders(source).has("location"), false);
    const headers = copyBackendResponseHeaders(source, ["location", "server-timing"]);
    assert.equal(headers.get("location"), "/login");
    assert.equal(headers.get("server-timing"), "api;dur=12");
  });
});
