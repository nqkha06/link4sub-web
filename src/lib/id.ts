const DEFAULT_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

interface GenerateIdOptions {
  alphabet?: string;
  length?: number;
}

export function generateId(
  prefixOrOptions?: string | GenerateIdOptions,
  inputOptions: GenerateIdOptions = {},
): string {
  const options =
    typeof prefixOrOptions === "object" ? prefixOrOptions : inputOptions;

  const { alphabet = DEFAULT_ALPHABET, length = 12 } = options;

  const chars = new Array(length);

  for (let i = 0; i < length; i++) {
    chars[i] = alphabet[(Math.random() * alphabet.length) | 0];
  }

  return chars.join("");
}

export function generateUuid(): string {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof cryptoApi?.getRandomValues === "function") {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}
