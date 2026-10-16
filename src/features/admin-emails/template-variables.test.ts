import assert from "node:assert/strict";
import { it } from "node:test";

import { insertTemplateVariable, templateVariableUsage } from "./template-variables.ts";

it("finds variables used across email fields and reports missing declarations", () => {
  assert.deepEqual(
    templateVariableUsage(
      ["Chào {{ user.name }}", '<a href="{{verifyUrl}}">{{user.name}}</a>'],
      ["user.name"],
    ),
    { used: ["user.name", "verifyUrl"], undeclared: ["verifyUrl"] },
  );
});

it("inserts a variable at the cursor or replaces the selection", () => {
  assert.deepEqual(insertTemplateVariable("Xin chào ", "user.name"), {
    value: "Xin chào {{user.name}}",
    cursor: 22,
  });
  assert.deepEqual(insertTemplateVariable("Hi name!", "user.name", { start: 3, end: 7 }), {
    value: "Hi {{user.name}}!",
    cursor: 16,
  });
});
