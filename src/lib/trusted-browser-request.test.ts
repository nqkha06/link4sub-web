import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isCrossSiteSubrequest,
  isTrustedBrowserRequest,
  toPublicUrl,
} from "./trusted-browser-request.ts";

const publicOrigin = "https://app.4sub.me";

function request(
  method: string,
  headers: Record<string, string> = {},
) {
  return new Request("http://web:3000/api/backend/auth/login", {
    method,
    headers,
  });
}

describe("trusted browser request", () => {
  it("accepts the configured public origin behind an internal reverse-proxy URL", () => {
    assert.equal(
      isTrustedBrowserRequest(
        request("POST", {
          origin: publicOrigin,
          "sec-fetch-site": "same-origin",
        }),
        publicOrigin,
      ),
      true,
    );
  });

  it("rejects cross-site and unexpected origins", () => {
    assert.equal(
      isTrustedBrowserRequest(
        request("POST", {
          origin: publicOrigin,
          "sec-fetch-site": "cross-site",
        }),
        publicOrigin,
      ),
      false,
    );
    assert.equal(
      isTrustedBrowserRequest(
        request("POST", { origin: "https://evil.example" }),
        publicOrigin,
      ),
      false,
    );
  });

  it("keeps safe reads and non-browser clients compatible", () => {
    assert.equal(
      isTrustedBrowserRequest(request("GET"), publicOrigin),
      true,
    );
    assert.equal(
      isTrustedBrowserRequest(request("POST"), publicOrigin),
      true,
    );
  });
});

describe("toPublicUrl", () => {
  it("resolves redirects against the public origin, not the internal listener", () => {
    assert.equal(
      toPublicUrl("/member/bio?tab=create", publicOrigin).toString(),
      "https://app.4sub.me/member/bio?tab=create",
    );
  });

  it("falls back to the root for non-relative paths", () => {
    assert.equal(toPublicUrl("//evil.example", publicOrigin).toString(), "https://app.4sub.me/");
    assert.equal(toPublicUrl("https://evil.example", publicOrigin).toString(), "https://app.4sub.me/");
  });
});

describe("isCrossSiteSubrequest", () => {
  it("allows cross-site top-level navigations", () => {
    assert.equal(
      isCrossSiteSubrequest(new Headers({ "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate" })),
      false,
    );
  });

  it("blocks cross-site fetch and embedded requests", () => {
    assert.equal(isCrossSiteSubrequest(new Headers({ "sec-fetch-site": "cross-site", "sec-fetch-mode": "cors" })), true);
    assert.equal(isCrossSiteSubrequest(new Headers({ "sec-fetch-site": "cross-site", "sec-fetch-mode": "no-cors" })), true);
  });

  it("ignores same-origin and legacy requests", () => {
    assert.equal(isCrossSiteSubrequest(new Headers({ "sec-fetch-site": "same-origin" })), false);
    assert.equal(isCrossSiteSubrequest(new Headers()), false);
  });
});
