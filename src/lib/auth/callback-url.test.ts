import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getLoginUrl,
  getRefreshSessionUrl,
  getSafeCallbackUrl,
} from "./callback-url.ts";

describe("auth callback URL", () => {
  it("keeps safe internal paths and their query string", () => {
    for (const value of [
      "/",
      "/register",
      "/member/settings",
      "/payment-proof/abc",
      "/b/example",
      "/foo/bar?tab=1&ref=abc",
    ]) {
      assert.equal(getSafeCallbackUrl(value, "/fallback"), value);
    }
  });

  it("rejects external, protocol-relative and executable URLs", () => {
    for (const value of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
    ]) {
      assert.equal(getSafeCallbackUrl(value, "/fallback"), "/fallback");
    }
  });

  it("rejects callbacks pointing back to the refresh endpoint", () => {
    assert.equal(
      getSafeCallbackUrl("/api/auth/refresh-session", "/fallback"),
      "/fallback",
    );
    assert.equal(
      getSafeCallbackUrl(
        "/api/auth/refresh-session?callbackUrl=/member",
        "/fallback",
      ),
      "/fallback",
    );
  });

  it("encodes callback and session mode without losing its query string", () => {
    const refreshUrl = new URL(
      getRefreshSessionUrl("/foo/bar?tab=1&ref=abc", "optional"),
      "http://localhost:3000",
    );
    assert.equal(refreshUrl.pathname, "/api/auth/refresh-session");
    assert.equal(refreshUrl.searchParams.get("callbackUrl"), "/foo/bar?tab=1&ref=abc");
    assert.equal(refreshUrl.searchParams.get("mode"), "optional");

    const loginUrl = new URL(
      getLoginUrl("/member/settings?tab=security", "session-expired"),
      "http://localhost:3000",
    );
    assert.equal(loginUrl.searchParams.get("callbackUrl"), "/member/settings?tab=security");
    assert.equal(loginUrl.searchParams.get("reason"), "session-expired");
  });
});
