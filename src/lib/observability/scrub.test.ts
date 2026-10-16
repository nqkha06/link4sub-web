import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scrubBreadcrumb, scrubErrorEvent, scrubUrl } from "./scrub.ts";

const JWT =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJlLXZhbHVl";

describe("web error event scrubbing", () => {
  it("removes secrets and personal data before an event leaves the app", () => {
    const scrubbed = scrubErrorEvent({
      message: "Failed for jane.doe@example.com password=hunter2",
      user: { id: "42", email: "jane.doe@example.com", ip_address: "203.0.113.9" },
      request: {
        method: "GET",
        url: "https://example.com/reset-password?token=secret-value",
        headers: { cookie: `stu_access_token=${JWT}` },
        cookies: { stu_access_token: JWT },
      },
      extra: { accessToken: JWT, recipientEmail: "jane.doe@example.com", step: 2 },
      exception: { values: [{ type: "Error", value: `Bearer ${JWT} rejected` }] },
      breadcrumbs: [
        { category: "fetch", data: { url: "/api/backend/x?visitToken=abc-secret" } },
      ],
    });
    const serialized = JSON.stringify(scrubbed);

    for (const leaked of [
      "jane.doe@example.com",
      "hunter2",
      "203.0.113.9",
      JWT,
      "secret-value",
      "abc-secret",
    ]) {
      assert.equal(serialized.includes(leaked), false, `leaked: ${leaked}`);
    }
    assert.deepEqual(scrubbed.user, { id: "42" });
    assert.deepEqual(scrubbed.request, {
      method: "GET",
      url: "https://example.com/reset-password",
    });
    assert.equal((scrubbed.extra as Record<string, unknown>).step, 2);
  });

  it("strips query strings and id-like tokens from URLs", () => {
    assert.equal(
      scrubUrl("/l/abc/3f2b8c1e-9a4d-4c7b-8e21-5d6f7a8b9c0d?x=1#top"),
      "/l/abc/[ID]",
    );
    assert.deepEqual(
      scrubBreadcrumb({ message: "apiKey=zq9", data: { to: "/a?b=c" } }),
      { message: "apiKey=[REDACTED]", data: { to: "/a" } },
    );
  });
});
