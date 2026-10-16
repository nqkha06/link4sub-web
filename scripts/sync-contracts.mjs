/**
 * Đồng bộ kiểu dùng chung từ repo stu-api (bản gốc) sang `src/contracts`.
 *
 *   pnpm contracts:sync            chép đè src/contracts từ API
 *   pnpm contracts:check           chỉ so sánh, exit 1 nếu lệch
 *
 * Mặc định đọc `../stu-api/src/contracts`; đặt CONTRACTS_SOURCE để đổi đường dẫn.
 * Không sửa tay file trong src/contracts: sửa ở stu-api rồi chạy lại lệnh này.
 */
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(webRoot, "src/contracts");
const source = resolve(
  webRoot,
  process.env.CONTRACTS_SOURCE ?? "../stu-api/src/contracts",
);
const checkOnly = process.argv.includes("--check");
// README chỉ có ở bản sao (nhắc không sửa tay), không so với bản gốc.
const LOCAL_ONLY = new Set(["README.md"]);

if (!existsSync(source)) {
  console.error(
    `Không tìm thấy contracts gốc tại ${source}. Clone stu-api cạnh repo này hoặc đặt CONTRACTS_SOURCE.`,
  );
  process.exit(1);
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else files.push(relative(root, path));
    }
  };
  walk(root);
  return files.filter((file) => !LOCAL_ONLY.has(file)).sort();
}

const sourceFiles = listFiles(source);
const targetFiles = listFiles(target);
const differences = [
  ...sourceFiles.filter((file) => !targetFiles.includes(file)).map((file) => `+ ${file}`),
  ...targetFiles.filter((file) => !sourceFiles.includes(file)).map((file) => `- ${file}`),
  ...sourceFiles
    .filter((file) => targetFiles.includes(file))
    .filter(
      (file) =>
        !readFileSync(join(source, file)).equals(readFileSync(join(target, file))),
    )
    .map((file) => `~ ${file}`),
];

if (differences.length === 0) {
  console.log("src/contracts đã khớp với stu-api.");
  process.exit(0);
}

if (checkOnly) {
  console.error("src/contracts lệch với stu-api:\n" + differences.join("\n"));
  console.error("Chạy `pnpm contracts:sync` để cập nhật.");
  process.exit(1);
}

for (const file of targetFiles) rmSync(join(target, file));
cpSync(source, target, { recursive: true });
console.log("Đã đồng bộ src/contracts từ stu-api:\n" + differences.join("\n"));
