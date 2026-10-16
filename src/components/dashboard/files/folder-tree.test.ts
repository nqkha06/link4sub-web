import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { childFolders, folderPath, withDescendants } from "./folder-tree.ts";

const folders = [
  { id: "1", parentId: null, name: "Ảnh" },
  { id: "2", parentId: "1", name: "2025" },
  { id: "3", parentId: "2", name: "Tháng 1" },
  { id: "4", parentId: null, name: "Tài liệu" },
  { id: "5", parentId: "1", name: "10" },
];

describe("folder tree", () => {
  it("builds breadcrumb paths", () => {
    assert.deepEqual(folderPath(folders, "3").map((folder) => folder.id), ["1", "2", "3"]);
    assert.deepEqual(folderPath(folders, null), []);
    assert.deepEqual(folderPath(folders, "missing"), []);
  });

  it("lists children in natural order", () => {
    assert.deepEqual(childFolders(folders, "1").map((folder) => folder.name), ["10", "2025"]);
    assert.deepEqual(childFolders(folders, null).map((folder) => folder.id), ["1", "4"]);
  });

  it("collects descendants", () => {
    assert.deepEqual([...withDescendants(folders, ["1"])].sort(), ["1", "2", "3", "5"]);
    assert.deepEqual([...withDescendants(folders, ["4"])], ["4"]);
  });
});
