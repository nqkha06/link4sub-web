import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { copyToClipboard } from "./clipboard.ts";

type FakeNode = { parent: FakeNode | null; role?: string; children: FakeNode[] };

/** DOM tối giản, đủ cho các nhánh của copyToClipboard. */
function setupDom(options: {
  secure?: boolean;
  writeText?: (text: string) => Promise<void>;
  execResult?: boolean | "throw";
  focusInDialog?: boolean;
}) {
  const calls = { writeText: [] as string[], exec: 0, copiedValue: "", appendedTo: "", removed: 0, refocused: 0 };
  const body: FakeNode & Record<string, unknown> = { parent: null, children: [] };
  const dialog: FakeNode & Record<string, unknown> = { parent: body, role: "dialog", children: [] };
  let current: { value: string } | null = null;

  const append = (owner: FakeNode & Record<string, unknown>, name: string) => (child: FakeNode & { value: string }) => {
    child.parent = owner;
    owner.children.push(child);
    calls.appendedTo = name;
    current = child;
  };
  body.appendChild = append(body, "body");
  dialog.appendChild = append(dialog, "dialog");

  const button = {
    focus: () => { calls.refocused += 1; },
    closest: () => (options.focusInDialog ? dialog : null),
  };

  const doc = {
    body,
    activeElement: button,
    getSelection: () => ({ rangeCount: 0, getRangeAt: () => null, removeAllRanges() {}, addRange() {} }),
    createElement: () => {
      const el: FakeNode & Record<string, unknown> = {
        parent: null,
        children: [],
        value: "",
        style: {},
        setAttribute() {},
        focus() {},
        select() {},
        setSelectionRange() {},
        remove() {
          calls.removed += 1;
          const parent = el.parent;
          if (parent) parent.children = parent.children.filter((node) => node !== el);
        },
      };
      return el;
    },
    execCommand: () => {
      calls.exec += 1;
      if (options.execResult === "throw") throw new Error("blocked");
      calls.copiedValue = current?.value ?? "";
      return options.execResult ?? true;
    },
  };

  const nav = options.writeText
    ? { clipboard: { writeText: (text: string) => { calls.writeText.push(text); return options.writeText!(text); } } }
    : {};

  Object.defineProperty(globalThis, "window", { value: { isSecureContext: options.secure ?? true }, configurable: true, writable: true });
  Object.defineProperty(globalThis, "document", { value: doc, configurable: true, writable: true });
  Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true, writable: true });
  return { calls, body, dialog };
}

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).document;
  if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
});

describe("copyToClipboard", () => {
  it("returns false on the server", async () => {
    assert.equal(await copyToClipboard("hello"), false);
  });

  it("returns false for empty text", async () => {
    const { calls } = setupDom({ writeText: async () => {} });
    assert.equal(await copyToClipboard(""), false);
    assert.equal(calls.writeText.length, 0);
  });

  it("uses the Clipboard API in a secure context", async () => {
    const { calls } = setupDom({ writeText: async () => {} });
    assert.equal(await copyToClipboard("hello"), true);
    assert.deepEqual(calls.writeText, ["hello"]);
    assert.equal(calls.exec, 0);
  });

  it("falls back to execCommand when the Clipboard API rejects", async () => {
    const { calls, body } = setupDom({ writeText: async () => { throw new Error("NotAllowedError"); } });
    assert.equal(await copyToClipboard("hello"), true);
    assert.equal(calls.exec, 1);
    assert.equal(calls.copiedValue, "hello");
    assert.equal(body.children.length, 0, "textarea is removed");
  });

  it("skips the Clipboard API on HTTP", async () => {
    const { calls } = setupDom({ secure: false, writeText: async () => {} });
    assert.equal(await copyToClipboard("hello"), true);
    assert.equal(calls.writeText.length, 0);
    assert.equal(calls.exec, 1);
  });

  it("returns false and cleans up when execCommand fails or throws", async () => {
    for (const execResult of [false, "throw"] as const) {
      const { calls, body } = setupDom({ secure: false, execResult });
      assert.equal(await copyToClipboard("hello"), false);
      assert.equal(calls.removed, 1);
      assert.equal(body.children.length, 0);
      assert.equal(calls.refocused, 1, "focus returns to the trigger");
    }
  });

  it("mounts the fallback textarea inside an open dialog to survive focus traps", async () => {
    const { calls } = setupDom({ secure: false, focusInDialog: true });
    assert.equal(await copyToClipboard("hello"), true);
    assert.equal(calls.appendedTo, "dialog");
  });
});
