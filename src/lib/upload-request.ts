export type UploadErrorCode = "timeout" | "network" | "emptyFile";

export class UploadError extends Error {
  readonly code: UploadErrorCode;
  constructor(code: UploadErrorCode) {
    super(code);
    this.name = "UploadError";
    this.code = code;
  }
}

export class UploadHttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.status = status; this.name = "UploadHttpError"; }
}

export function canRetryDirectPart(error: unknown) {
  return (error instanceof UploadError && ["timeout", "network"].includes(error.code)) ||
    (error instanceof UploadHttpError && (error.status === 403 || error.status === 408 || error.status === 429 || error.status >= 500));
}

export async function waitForUploadRetry(attempt: number, signal?: AbortSignal, random = Math.random) {
  signal?.throwIfAborted();
  const delay = Math.round(500 * 2 ** Math.min(attempt, 3) * (0.5 + 0.5 * random()));
  await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); reject(signal?.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, delay);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export function uploadErrorMessage(error: unknown, translate: (key: UploadErrorCode) => string, fallback: string) {
  return error instanceof UploadError ? translate(error.code) : error instanceof Error ? error.message : fallback;
}

// Includes response-body consumption; receiving headers alone must not clear the timer.
export async function withUploadDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
  timeoutMs = 120_000,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(new UploadError("timeout")), timeoutMs);
  try {
    controller.signal.throwIfAborted();
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export function uploadPart(
  url: string,
  chunk: Blob,
  signal: AbortSignal | undefined,
  onProgress: (loaded: number) => void,
  apiError: (text: string) => string,
  idleMs = 90_000,
  direct = false,
) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const xhr = new XMLHttpRequest();
    let timer: ReturnType<typeof setTimeout>;
    let lastLoaded = 0;
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    };
    const fail = (error: unknown) => { cleanup(); reject(error); };
    const abort = () => { fail(signal?.reason ?? new DOMException("Aborted", "AbortError")); xhr.abort(); };
    const armTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { fail(new UploadError("timeout")); xhr.abort(); }, idleMs);
    };
    xhr.open(direct ? "PUT" : "POST", url);
    xhr.withCredentials = !direct;
    xhr.upload.onprogress = (event) => {
      if (event.loaded > lastLoaded) { lastLoaded = event.loaded; armTimer(); }
      // FormData progress includes multipart headers; normalize it to chunk bytes.
      if (event.lengthComputable && event.total > 0) onProgress(chunk.size * Math.min(1, event.loaded / event.total));
    };
    xhr.upload.onload = armTimer;
    xhr.onprogress = armTimer;
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) { onProgress(chunk.size); resolve(); }
      else reject(new UploadHttpError(xhr.status, apiError(xhr.responseText)));
    };
    xhr.onerror = () => fail(new UploadError("network"));
    xhr.onabort = () => fail(new DOMException("Aborted", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    const formData = direct ? undefined : new FormData();
    formData?.append("chunk", chunk, "part");
    armTimer();
    // No app cookies, Authorization, FormData or manually assigned Content-Length
    // may cross to object storage. The browser supplies the signed byte length.
    try { xhr.send(formData ?? chunk); } catch (error) { fail(error); }
  });
}
