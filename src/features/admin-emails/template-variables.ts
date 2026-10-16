const VARIABLE_PATTERN = /{{\s*([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*)\s*}}/g;

export function templateVariableUsage(contents: readonly string[], declaredKeys: readonly string[]) {
  const used = new Set<string>();
  for (const content of contents) {
    for (const match of content.matchAll(VARIABLE_PATTERN)) used.add(match[1]);
  }
  const declared = new Set(declaredKeys);
  return {
    used: [...used],
    undeclared: [...used].filter((key) => !declared.has(key)),
  };
}

export function insertTemplateVariable(
  content: string,
  key: string,
  selection?: { start: number; end: number },
) {
  const start = Math.max(0, Math.min(selection?.start ?? content.length, content.length));
  const end = Math.max(start, Math.min(selection?.end ?? start, content.length));
  const token = `{{${key}}}`;
  return {
    value: `${content.slice(0, start)}${token}${content.slice(end)}`,
    cursor: start + token.length,
  };
}
