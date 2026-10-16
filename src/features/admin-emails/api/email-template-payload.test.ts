import assert from "node:assert/strict";
import { it } from "node:test";

import { toEmailTemplatePayload } from "./email-template-payload.ts";

it("removes read-only template and translation fields before saving", () => {
  const form = {
    code: "welcome_email",
    id: 12,
    name: "Welcome email",
    description: "Greeting",
    category: "transactional",
    status: "active",
    subject: "Welcome",
    preheader: "Hello",
    htmlContent: "<p>Hello</p>",
    textContent: "Hello",
    variables: [{ key: "user.name", label: "Name", type: "string", required: true, example: "An", id: 15 }],
    senderId: null,
    translations: [{
      id: 30,
      templateId: 12,
      locale: "vi",
      subject: "Chào mừng",
      preheader: "Xin chào",
      htmlContent: "<p>Xin chào</p>",
      textContent: "Xin chào",
      createdAt: "2026-09-18T00:00:00.000Z",
      updatedAt: "2026-09-18T00:00:00.000Z",
    }],
  } as unknown as Parameters<typeof toEmailTemplatePayload>[0];

  const payload = JSON.parse(JSON.stringify(toEmailTemplatePayload(form)));
  assert.equal("code" in payload, false);
  assert.equal("id" in payload, false);
  assert.deepEqual(payload.variables, [{ key: "user.name", label: "Name", type: "string", required: true, example: "An" }]);
  assert.deepEqual(payload.translations, [{
    locale: "vi",
    subject: "Chào mừng",
    preheader: "Xin chào",
    htmlContent: "<p>Xin chào</p>",
    textContent: "Xin chào",
  }]);
});
