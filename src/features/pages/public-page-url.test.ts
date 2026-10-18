import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canViewPublicPage, publicPagePath } from "./public-page-url.ts";

describe("public page URLs", () => {
  it("builds paths only for valid published pages", () => {
    assert.equal(publicPagePath("chinh-sach-bao-mat"), "/chinh-sach-bao-mat");
    assert.equal(publicPagePath("  DIEU-KHOAN  "), "/dieu-khoan");
    assert.equal(publicPagePath("slug không hợp lệ"), null);
    assert.equal(
      canViewPublicPage({ slug: "chinh-sach-bao-mat", status: "PUBLISHED" }),
      true,
    );
    assert.equal(
      canViewPublicPage({ slug: "chinh-sach-bao-mat", status: "DRAFT" }),
      false,
    );
    assert.equal(
      canViewPublicPage({ slug: "chinh-sach-bao-mat", status: "ARCHIVED" }),
      false,
    );
  });
});
