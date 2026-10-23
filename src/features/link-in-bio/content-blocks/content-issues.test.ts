import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findContentIssues, issuesFromServerDetails, isValidContentUrl, summarizeIssueLabels } from "./content-issues.ts";

describe("content issues", () => {
  it("accepts template urls, flags empty fields and bad urls", () => {
    const issues = findContentIssues({
      socialLinks: [
        { id: "a", platform: "Facebook", url: "https://facebook.com/" },
        { id: "d", platform: "Reddit", url: "" },
        { id: "b", platform: "TikTok", url: "https://tiktok.com/@me" },
        { id: "c", platform: "Twitter", url: "x.com/me" },
      ],
      customLinks: [{ id: "l", title: "Website của tôi", url: "" }],
      widgets: [],
    });
    assert.deepEqual(issues.map((issue) => issue.fieldId), ["content-social-url-d", "content-social-url-c", "content-link-url-l"]);
    assert.equal(issues[2].blockKey, "link:l");
    assert.deepEqual(issues.map((issue) => issue.kind), ["unfilled", "invalid", "unfilled"]);
  });

  it("summarises labels", () => {
    const issue = (label: string) => ({ blockKey: "x", fieldId: label, label, message: "", kind: "invalid" as const });
    assert.equal(summarizeIssueLabels([issue("A"), issue("A"), issue("B")]), "A, B");
    assert.equal(summarizeIssueLabels(["A", "B", "C", "D", "E"].map(issue)), "A, B, C và 2 mục khác");
  });

  it("matches the API url rules", () => {
    assert.equal(isValidContentUrl("https://facebook.com/"), true);
    assert.equal(isValidContentUrl("https://tiktok.com/@"), true);
    assert.equal(isValidContentUrl("https://abc"), false);
    assert.equal(isValidContentUrl("https://my site.com"), false);
    assert.equal(isValidContentUrl("example.com"), false);
    assert.equal(isValidContentUrl("https://1.2.3.4/x"), true);
  });

  it("maps API validation details to editor fields", () => {
    const { issues, other } = issuesFromServerDetails(
      { "customLinks.0.url": ["url must be a URL address"], name: ["name should not be empty"] },
      { socialLinks: [], customLinks: [{ id: "l1", title: "Web", url: "bad" }], widgets: [] },
    );
    assert.equal(issues[0].fieldId, "content-link-url-l1");
    assert.equal(issues[0].blockKey, "link:l1");
    assert.equal(issues[0].code, "url");
    assert.equal(issues[1].fieldId, "bio-name");
    assert.equal(issues[1].section, "details");
    assert.deepEqual(other, []);
  });

  it("allows incomplete drafts but preserves invalid entered URLs as errors", () => {
    const input = { name: "Creator", status: "draft" as const, socialLinks: [], customLinks: [{ id: "a", title: "", url: "" }], widgets: [] };
    assert.deepEqual(findContentIssues(input), []);
    assert.equal(findContentIssues({ ...input, customLinks: [{ id: "a", title: "", url: "bad" }] })[0].fieldId, "content-link-url-a");
    assert.deepEqual(findContentIssues({ ...input, status: "published" }).map((issue) => issue.fieldId), ["content-link-title-a", "content-link-url-a"]);
  });

  it("requires a download file when publishing, without requiring an external URL", () => {
    const input = { socialLinks: [], widgets: [], customLinks: [{ id: "d", kind: "download" as const, title: "Guide", url: "", fileId: null as string | null }] };
    assert.deepEqual(findContentIssues(input).map((issue) => issue.fieldId), ["content-link-fileId-d"]);
    assert.deepEqual(findContentIssues({ ...input, status: "draft" }), []);
    assert.deepEqual(findContentIssues({ ...input, customLinks: [{ ...input.customLinks[0], fileId: "42" }] }), []);
  });

  it("checks profile limits and targets nested bank, gallery and design errors", () => {
    const input = { name: " ", title: "x".repeat(161), socialLinks: [], customLinks: [], widgets: [], galleries: [{ id: "g", images: [{ linkUrl: "bad" }] }] };
    assert.deepEqual(findContentIssues(input).map((issue) => issue.fieldId), ["bio-name", "bio-title", "gallery-title-g"]);
    const result = issuesFromServerDetails({ "design.profile.maxWidth": ["Too big"] }, input);
    assert.equal(result.issues[0].section, "appearance");
  });
});
