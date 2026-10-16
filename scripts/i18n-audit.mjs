#!/usr/bin/env node
/**
 * Kiểm tra hệ thống đa ngôn ngữ (next-intl) của stu-web.
 *
 *   node scripts/i18n-audit.mjs                       # parity + key thiếu + key thừa
 *   node scripts/i18n-audit.mjs --hardcoded admin     # thêm: text chưa i18n trong đường dẫn chứa "admin"
 *   node scripts/i18n-audit.mjs --files features/admin-users   # chỉ báo cáo file có đường dẫn chứa chuỗi này
 *
 * Exit code 1 nếu có key bị thiếu hoặc vi/en lệch nhau.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = join(ROOT, "src");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;

function flatten(source, prefix = "", output = {}) {
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, path, output);
    else if (typeof value === "string") output[path] = value;
  }
  return output;
}

function loadMessages(locale) {
  return flatten(JSON.parse(readFileSync(join(ROOT, "messages", `${locale}.json`), "utf8")));
}

function walk(directory, output = []) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path, output);
    else if (/\.(ts|tsx)$/.test(name)) output.push(path);
  }
  return output;
}

const messages = { vi: loadMessages("vi"), en: loadMessages("en"), id: loadMessages("id") };
const files = walk(SRC);
const only = option("--files");
const inScope = (path) => !only || relative(SRC, path).includes(only);
let failed = false;

// 1. Parity giữa các ngôn ngữ (id được phép thiếu vì fallback sang en).
const viKeys = new Set(Object.keys(messages.vi));
const enKeys = new Set(Object.keys(messages.en));
const onlyVi = [...viKeys].filter((key) => !enKeys.has(key));
const onlyEn = [...enKeys].filter((key) => !viKeys.has(key));
const idExtra = Object.keys(messages.id).filter((key) => !enKeys.has(key));
if (onlyVi.length || onlyEn.length || idExtra.length) {
  failed = true;
  console.log(`\n[parity] vi/en/id lệch nhau: chỉ vi=${onlyVi.length}, chỉ en=${onlyEn.length}, id thừa=${idExtra.length}`);
  for (const key of [...onlyVi.map((k) => `chỉ có trong vi: ${k}`), ...onlyEn.map((k) => `chỉ có trong en: ${k}`), ...idExtra.map((k) => `id thừa: ${k}`)].slice(0, 40)) console.log("  " + key);
}
const idMissing = [...enKeys].filter((key) => !(key in messages.id));
console.log(`[id] ${idMissing.length}/${enKeys.size} key chưa dịch sang tiếng Indonesia (đang fallback sang en)`);

// 2. Phân tích cách dùng key.
const DECL = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*?namespace:\s*)?(?:["']([^"']*)["']|(\w+))?/g;
const NS = /(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*?namespace:\s*)?(?:["']([^"']*)["'])?/g;
const NS2 = /namespace:\s*["']([^"']+)["']/g;
const LIT = /(["'`])((?:(?!\1)[^\\\n]|\\.){1,200}?)\1/g;

const globalLiterals = new Set();
const globalPrefixes = new Set();
const perFile = new Map();
const globalNamespaces = new Set();
const missing = [];
const missingCandidates = [];
const suffixes = new Set();
for (const key of Object.keys(messages.en)) {
  const parts = key.split(".");
  for (let i = 0; i < parts.length; i += 1) suffixes.add(parts.slice(i).join("."));
}
const adminModules = [...new Set(Object.keys(messages.en).filter((k) => k.startsWith("Admin.")).map((k) => k.split(".").slice(0, 2).join(".")))];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const namespaces = new Set([...text.matchAll(NS)].map((m) => m[1] ?? ""));
  for (const m of text.matchAll(NS2)) namespaces.add(m[1]);
  const literals = new Set();
  const prefixes = new Set();
  for (const m of text.matchAll(LIT)) {
    const value = m[2];
    if (value.includes("${")) {
      const prefix = value.split("${")[0];
      if (prefix) prefixes.add(prefix);
    } else if (/^[\w.\-]+$/.test(value)) literals.add(value);
  }
  perFile.set(file, { namespaces, literals, prefixes });
  for (const ns of namespaces) globalNamespaces.add(ns);
  for (const [, ns] of text.matchAll(/const\s+\w+\s*=\s*["']([\w.]+)["']/g)) globalNamespaces.add(ns);
  for (const value of literals) globalLiterals.add(value);
  for (const value of prefixes) globalPrefixes.add(value);

  // Key bị thiếu: mỗi biến dịch (t, tc, ...) có thể được khai báo nhiều lần trong cùng file với namespace khác nhau
  // (nhiều component). Một lời gọi t("literal") hợp lệ nếu key tồn tại dưới BẤT KỲ namespace nào của biến đó
  // (nếu biến chỉ là tham số hàm thì thử với mọi namespace trong file).
  const consts = new Map([...text.matchAll(/const\s+(\w+)\s*=\s*["']([\w.]+)["']/g)].map((m) => [m[1], m[2]]));
  const bindings = new Map();
  for (const declaration of text.matchAll(DECL)) {
    const variable = declaration[1];
    const namespace = declaration[2] ?? consts.get(declaration[3]) ?? "";
    if (!bindings.has(variable)) bindings.set(variable, new Set());
    bindings.get(variable).add(namespace);
  }
  const callNames = new Set([...bindings.keys(), "t", "tc"]);
  for (const variable of callNames) {
    const bound = bindings.get(variable);
    const candidates = bound ?? new Set([...namespaces, ...consts.values()]);
    const call = new RegExp(`(?<![\\w.])${variable}(?:\\.(?:rich|raw|has|markup))?\\(\\s*(["'\`])((?:(?!\\1)[^\\\\\\n]|\\\\.)*?)\\1`, "g");
    for (const use of text.matchAll(call)) {
      if (use[2].includes("${") || !/^[\\w.\\-]+$/.test(use[2])) continue;
      // Biến t chỉ là tham số hàm/props: không biết namespace, chỉ yêu cầu key tồn tại ở đâu đó (hậu tố của key bất kỳ).
      const found = bound || namespaces.size || consts.size
        ? [...candidates].some((namespace) => (namespace ? `${namespace}.${use[2]}` : use[2]) in messages.en) || (!bound && suffixes.has(use[2]))
        : suffixes.has(use[2]);
      if (!found) missingCandidates.push([...candidates].map((namespace) => (namespace ? `${namespace}.${use[2]}` : use[2])));
      if (!found && inScope(file)) missing.push(`${relative(SRC, file)}: ${variable}("${use[2]}") [ns: ${[...candidates].slice(0, 3).join(" | ") || "-"}]`);
    }
  }
}

if (option("--missing-json")) writeFileSync(option("--missing-json"), JSON.stringify(missingCandidates));
if (missing.length) {
  failed = true;
  console.log(`\n[missing] ${missing.length} key được gọi trong code nhưng không có trong messages:`);
  for (const line of missing.slice(0, 200)) console.log("  " + line);
}

function usage(key) {
  if (globalLiterals.has(key)) return "full";
  const segments = key.split(".");
  for (let i = 1; i < segments.length - 1; i += 1) {
    if (globalLiterals.has(segments.slice(i).join("."))) return "suffix";
  }
  for (const prefix of globalPrefixes) {
    if (prefix.length < 3) continue;
    if (key.startsWith(prefix)) return "prefix";
    for (let i = 1; i < segments.length; i += 1) {
      if (segments.slice(i).join(".").startsWith(prefix)) return "prefix";
    }
  }
  // t được truyền qua props/tham số: namespace được bind ở file khác, literal nằm ở file dùng t.
  for (let i = 1; i < segments.length; i += 1) {
    const parent = segments.slice(0, i).join(".");
    if (globalNamespaces.has(parent) && globalLiterals.has(segments.slice(i).join("."))) return "param";
  }
  for (const { namespaces, literals, prefixes } of perFile.values()) {
    for (const namespace of namespaces) {
      if (namespace !== "" && !key.startsWith(`${namespace}.`)) continue;
      const rest = namespace === "" ? key : key.slice(namespace.length + 1);
      if (literals.has(rest)) return "namespace";
      for (const prefix of prefixes) if (rest.startsWith(prefix)) return "namespace";
    }
  }
  return null;
}

const unused = [...enKeys].filter((key) => !usage(key)).sort();
console.log(`\n[unused] ${unused.length}/${enKeys.size} key có vẻ không được dùng (heuristic; kiểm tra thủ công key dựng động).`);
if (flag("--list-unused")) for (const key of unused) console.log("  " + key);

// 3. Text chưa đa ngôn ngữ.
const hardcodedScope = option("--hardcoded");
if (hardcodedScope) {
  const findings = new Map();
  const add = (file, line, text) => {
    const list = findings.get(file) ?? [];
    list.push(`${line}: ${text.trim().slice(0, 110)}`);
    findings.set(file, list);
  };
  for (const file of files) {
    const rel = relative(SRC, file);
    if (!rel.includes(hardcodedScope) || /\.test\.tsx?$/.test(rel) || !inScope(file)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      const code = line.replace(/\/\/.*$/, "");
      if (/^\s*(\*|\/\*|import\s)/.test(line)) return;
      if (VI.test(code)) return add(rel, index + 1, code);
      if (/>\s*[A-Z][A-Za-z]+(?:\s+[A-Za-z][\w,.'!?-]*){1,}\s*</.test(code)) return add(rel, index + 1, code);
      if (/\b(?:placeholder|title|aria-label|alt|label|description)=["'][A-Za-z][^"']*\s[^"']*["']/.test(code)) add(rel, index + 1, code);
    });
  }
  const total = [...findings.values()].reduce((sum, list) => sum + list.length, 0);
  console.log(`\n[hardcoded] ${total} dòng chứa text chưa đa ngôn ngữ trong ${findings.size} file (đường dẫn chứa "${hardcodedScope}"):`);
  for (const [file, list] of [...findings].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${String(list.length).padStart(4)}  ${file}`);
    if (flag("--verbose")) for (const item of list) console.log("        " + item);
  }
}

process.exit(failed ? 1 : 0);
