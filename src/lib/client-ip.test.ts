import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickClientIp } from "./client-ip.ts";

const headers = (values: Record<string, string>) => new Headers(values);

describe("web client IP resolution", () => {
  it("trusts no header by default", () => {
    assert.equal(
      pickClientIp(
        headers({
          "x-forwarded-for": "203.0.113.9",
          "x-real-ip": "203.0.113.9",
          "cf-connecting-ip": "203.0.113.9",
        }),
        { trustProxyHops: 0, clientIpHeader: undefined },
      ),
      null,
    );
  });

  it("takes the address seen by the outermost trusted proxy", () => {
    const config = { trustProxyHops: 1, clientIpHeader: undefined };
    assert.equal(
      pickClientIp(headers({ "x-forwarded-for": "198.51.100.7" }), config),
      "198.51.100.7",
    );
    // Client tự gửi X-Forwarded-For: proxy nối địa chỉ thật vào bên phải.
    assert.equal(
      pickClientIp(headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" }), config),
      "198.51.100.7",
    );
  });

  it("skips the inner proxies when there are two trusted hops", () => {
    assert.equal(
      pickClientIp(
        headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7, 10.0.0.5" }),
        { trustProxyHops: 2, clientIpHeader: undefined },
      ),
      "198.51.100.7",
    );
  });

  it("uses only the configured header when one is set", () => {
    const config = { trustProxyHops: 0, clientIpHeader: "cf-connecting-ip" };
    assert.equal(
      pickClientIp(
        headers({ "cf-connecting-ip": "198.51.100.7", "x-forwarded-for": "1.2.3.4" }),
        config,
      ),
      "198.51.100.7",
    );
    assert.equal(pickClientIp(headers({ "x-forwarded-for": "1.2.3.4" }), config), null);
  });

  it("rejects values that are not IP addresses", () => {
    assert.equal(
      pickClientIp(headers({ "x-forwarded-for": "not-an-ip" }), {
        trustProxyHops: 1,
        clientIpHeader: undefined,
      }),
      null,
    );
    assert.equal(
      pickClientIp(headers({ "x-forwarded-for": "::ffff:198.51.100.7" }), {
        trustProxyHops: 1,
        clientIpHeader: undefined,
      }),
      "198.51.100.7",
    );
  });
});
