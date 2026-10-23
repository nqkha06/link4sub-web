import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findContentIssues, summarizeIssueLabels } from "./content-issues.ts";

describe("content issues", () => {
  it("flags unfilled social templates, empty links and bad urls", () => {
    const issues = findContentIssues({
      socialLinks: [
        { id: "a", platform: "Facebook", url: "https://facebook.com/" },
        { id: "b", platform: "TikTok", url: "https://tiktok.com/@me" },
        { id: "c", platform: "Twitter", url: "x.com/me" },
      ],
      customLinks: [{ id: "l", title: "Website của tôi", url: "" }],
      widgets: [],
    });
    assert.deepEqual(issues.map((issue) => issue.fieldId), ["content-social-url-a", "content-social-url-c", "content-link-url-l"]);
    assert.equal(issues[2].blockKey, "link:l");
  });

  it("summarises labels", () => {
    const issue = (label: string) => ({ blockKey: "x", fieldId: label, label, message: "" });
    assert.equal(summarizeIssueLabels([issue("A"), issue("A"), issue("B")]), "A, B");
    assert.equal(summarizeIssueLabels(["A", "B", "C", "D", "E"].map(issue)), "A, B, C và 2 mục khác");
  });
});
