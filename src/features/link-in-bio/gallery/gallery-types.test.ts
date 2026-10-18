import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeContentOrder,
  normalizeGalleryImages,
} from "./gallery-types.ts";

describe("Link-in-bio content and gallery ordering", () => {
  it("migrates incomplete legacy order without duplicates or lost blocks", () => {
    const result = normalizeContentOrder(
      [
        { type: "bank-details", id: "bank-1" },
        { type: "link", id: "link-1" },
        { type: "link", id: "link-1" },
        { type: "link", id: "missing" },
      ],
      {
        socials: [{ id: "social-1" }],
        widgets: [{ id: "widget-1" }],
        galleries: [{ id: "gallery-1" }],
        dividers: [{ id: "divider-1" }],
        bankDetails: [{ id: "bank-1" }],
        textBlocks: [{ id: "text-1" }],
        links: [{ id: "link-1" }],
      },
    );
    assert.deepEqual(result, [
      { type: "bank-details", id: "bank-1" },
      { type: "link", id: "link-1" },
      { type: "social", id: "socials" },
      { type: "widget", id: "widget-1" },
      { type: "gallery", id: "gallery-1" },
      { type: "divider", id: "divider-1" },
      { type: "text", id: "text-1" },
    ]);
  });

  it("reassigns contiguous sort order after image drag and drop", () => {
    const images = normalizeGalleryImages([
      { id: "b", fileId: "2", url: "/2", sortOrder: 9 },
      { id: "a", fileId: "1", url: "/1", sortOrder: 4 },
    ]);
    assert.deepEqual(images.map((image) => image.sortOrder), [0, 1]);
  });
});
