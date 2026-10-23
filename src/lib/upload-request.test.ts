import assert from "node:assert/strict";
import { test } from "node:test";
import { UploadError, uploadPart, withUploadDeadline } from "./upload-request.ts";

test("a hung upload request times out, including when waiting for its response body", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const result = withUploadDeadline(async (signal) => {
    await new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
  });
  const rejected = assert.rejects(result, (error) => error instanceof UploadError && error.code === "timeout");
  t.mock.timers.tick(120_000);
  await rejected;
});

test("cancellation remains distinguishable from timeout and successful requests leave no timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const controller = new AbortController();
  controller.abort();
  let called = false;
  await assert.rejects(withUploadDeadline(async () => { called = true; }, controller.signal), { name: "AbortError" });
  assert.equal(called, false);
  let requestSignal: AbortSignal | undefined;
  assert.equal(await withUploadDeadline(async (signal) => { requestSignal = signal; return 42; }), 42);
  t.mock.timers.tick(120_000);
  assert.equal(requestSignal?.aborted, false);
});

class FakeXhr {
  static current: FakeXhr;
  upload: { onprogress?: (event: object) => void; onload?: () => void } = {};
  onload?: () => void;
  onabort?: () => void;
  onerror?: () => void;
  onprogress?: () => void;
  withCredentials = false;
  status = 200;
  responseText = "";
  aborted = false;
  constructor() { FakeXhr.current = this; }
  open() {}
  send() {}
  abort() { this.aborted = true; this.onabort?.(); }
}

test("part upload tolerates a slow progressing connection but stops on inactivity", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const original = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;
  t.after(() => { globalThis.XMLHttpRequest = original; });
  const progress: number[] = [];
  const result = uploadPart("/upload", new Blob(["test"]), undefined, (value) => progress.push(value), () => "error");
  const rejected = assert.rejects(result, (error) => error instanceof UploadError && error.code === "timeout");
  t.mock.timers.tick(80_000);
  FakeXhr.current.upload.onprogress?.({ loaded: 50, total: 100, lengthComputable: true });
  assert.deepEqual(progress, [2]);
  t.mock.timers.tick(80_000);
  assert.equal(FakeXhr.current.aborted, false);
  t.mock.timers.tick(10_000);
  await rejected;
  assert.equal(FakeXhr.current.aborted, true);
});

test("part upload waits for server acknowledgement and preserves HTTP errors", async (t) => {
  const original = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;
  t.after(() => { globalThis.XMLHttpRequest = original; });
  const result = uploadPart("/upload", new Blob(["test"]), undefined, () => {}, () => "quota exceeded");
  FakeXhr.current.upload.onload?.();
  FakeXhr.current.status = 413;
  FakeXhr.current.onload?.();
  await assert.rejects(result, { message: "quota exceeded" });
});

test("cancelling an active part aborts the transport; a successful part clears its watchdog", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const original = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;
  t.after(() => { globalThis.XMLHttpRequest = original; });
  const controller = new AbortController();
  const cancelled = uploadPart("/upload", new Blob(["test"]), controller.signal, () => {}, () => "error");
  controller.abort();
  await assert.rejects(cancelled, { name: "AbortError" });
  assert.equal(FakeXhr.current.aborted, true);

  const progress: number[] = [];
  const completed = uploadPart("/upload", new Blob(["test"]), undefined, (value) => progress.push(value), () => "error");
  FakeXhr.current.onload?.();
  await completed;
  t.mock.timers.tick(90_000);
  assert.equal(FakeXhr.current.aborted, false);
  assert.deepEqual(progress, [4]);
});
