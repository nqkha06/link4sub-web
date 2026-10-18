import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  contentBlockRegistry,
  getContentBlockDefinition,
  normalizeContentBlockSearch,
} from "./content-block-registry.ts";
import {
  createBankDetailsBlock,
  hasCompleteBankDetails,
} from "./simple-content-types.ts";

describe("Link Bio content blocks", () => {
  it("keeps selectable definitions unique and complete", () => {
    assert.equal(
      new Set(contentBlockRegistry.map(({ type }) => type)).size,
      contentBlockRegistry.length,
    );
    for (const definition of contentBlockRegistry) {
      assert.equal(definition.enabled, true, definition.type);
      assert.ok(definition.title.trim(), definition.type);
      assert.ok(definition.keywords.length > 0, definition.type);
      assert.equal(getContentBlockDefinition(definition.type), definition);
    }
  });

  it("matches Vietnamese search with or without diacritics", () => {
    assert.equal(normalizeContentBlockSearch("Bộ sưu tập ẢNH"), "bo suu tap anh");
    assert.equal(normalizeContentBlockSearch("Đường dẫn"), "duong dan");
  });

  it("requires every bank field used by the public renderer", () => {
    const block = createBankDetailsBlock("bank-1");
    assert.equal(hasCompleteBankDetails(block), false);
    assert.equal(hasCompleteBankDetails({
      ...block,
      bankName: "Ngân hàng mẫu",
      accountName: "NGUYEN VAN A",
      accountNumber: "123456789",
    }), true);
  });
});
