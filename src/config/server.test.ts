import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertServerConfig, joinUrl, loadServerConfig } from "./server.ts";

const secret = "internal-secret-that-is-at-least-32-chars";

describe("web server config", () => {
  it("derives the internal API URL from API_URL without double slashes", () => {
    for (const apiUrl of ["http://localhost:4000", "http://localhost:4000/", "http://localhost:4000//"]) {
      const config = loadServerConfig({ API_URL: apiUrl });
      assert.equal(config.apiUrl, "http://localhost:4000");
      assert.equal(config.apiInternalUrl, "http://localhost:4000/api");
    }
    assert.equal(joinUrl("https://api.example.com/", "/api"), "https://api.example.com/api");
  });

  it("applies cookie and visitor-country defaults", () => {
    const config = loadServerConfig({});
    assert.equal(config.isProduction, false);
    assert.equal(config.accessCookieName, "stu_access_token");
    assert.equal(config.refreshCookieName, "stu_refresh_token");
    assert.equal(config.authCookiePath, "/");
    assert.equal(config.authCookieDomain, undefined);
    assert.equal(config.authCookieSecure, false);
    assert.equal(config.authCookieSameSite, "lax");
    assert.equal(config.defaultVisitorCountry, "VN");
    assert.equal(config.siteIconDir, "var/site-icons");
    assert.equal(
      loadServerConfig({ SITE_ICON_DIR: "/srv/stu-icons" }).siteIconDir,
      "/srv/stu-icons",
    );
    assert.equal(loadServerConfig({ DEFAULT_VISITOR_COUNTRY: "id" }).defaultVisitorCountry, "ID");
    assert.equal(loadServerConfig({ NODE_ENV: "production" }).isProduction, true);
    assert.equal(loadServerConfig({ NODE_ENV: "production" }).authCookieSecure, true);
    assert.throws(
      () => loadServerConfig({ AUTH_COOKIE_SAME_SITE: "none" }),
      /AUTH_COOKIE_SECURE/,
    );
    assert.throws(() => loadServerConfig({ DEFAULT_VISITOR_COUNTRY: "VNM" }), /DEFAULT_VISITOR_COUNTRY/);
  });

  it("fails fast when required variables are missing or invalid", () => {
    assert.throws(() => loadServerConfig({ API_URL: "not a url" }), /API_URL/);
    assert.throws(() => assertServerConfig({ INTERNAL_API_SECRET: secret }), /API_URL/);
    assert.throws(() => assertServerConfig({ API_URL: "http://localhost:4000" }), /INTERNAL_API_SECRET/);
    assert.doesNotThrow(() => assertServerConfig({ API_URL: "http://localhost:4000", INTERNAL_API_SECRET: secret }));
  });
});
