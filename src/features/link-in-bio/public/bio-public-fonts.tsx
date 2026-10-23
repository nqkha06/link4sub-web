"use client";

import { Suspense, useEffect, useState } from "react";

import { bioDesignFontFamilies, type BioDesignFontFamily } from "@/contracts";

/** Font chữ Việt dự phòng cho các font chỉ có bảng chữ Latin (vd. Chillax, Minecraft). */
const VIETNAMESE_FALLBACK = "Lexend";

/**
 * Nguồn của từng font:
 * - google:    Google Fonts (`spec` là phần `family=` của css2)
 * - fontshare: Fontshare (`slug@weights`)
 * - local:     file tự host ở `public/assets/bio/fonts/<file>` (font riêng, không có
 *              trên Google/Fontshare). `fallback`: font Google gần giống, dùng khi
 *              font chưa được cài (xem INSTALLED_LOCAL_FONTS) hoặc tải lỗi.
 */
type FontSource =
  | { kind: "google"; css: string; spec: string }
  | { kind: "fontshare"; css: string; spec: string }
  | { kind: "local"; css: string; file: string; fallback: { css: string; spec: string } };

const FONT_SOURCES: Record<BioDesignFontFamily, FontSource> = {
  Poppins: { kind: "google", css: "Poppins", spec: "Poppins:wght@400;500;600;700" },
  "JetBrains Mono": { kind: "google", css: "JetBrains Mono", spec: "JetBrains+Mono:wght@400;500;600;700" },
  Satoshi: { kind: "fontshare", css: "Satoshi", spec: "satoshi@400,500,700" },
  Outfit: { kind: "google", css: "Outfit", spec: "Outfit:wght@400;500;600;700" },
  Chillax: { kind: "fontshare", css: "Chillax", spec: "chillax@400,500,600,700" },
  Starborn: { kind: "local", css: "Starborn", file: "starborn.woff2", fallback: { css: "Luckiest Guy", spec: "Luckiest+Guy" } },
  Drippy: { kind: "local", css: "Drippy", file: "drippy.woff2", fallback: { css: "Creepster", spec: "Creepster" } },
  Vampiro: { kind: "google", css: "Vampiro One", spec: "Vampiro+One" },
  Pixelify: { kind: "google", css: "Pixelify Sans", spec: "Pixelify+Sans:wght@400;500;600;700" },
  Array: { kind: "fontshare", css: "Array", spec: "array@400,500,600,700" },
  Minecraft: { kind: "local", css: "Minecraft", file: "minecraft.woff2", fallback: { css: "Silkscreen", spec: "Silkscreen:wght@400;700" } },
  MetalGothic: { kind: "local", css: "MetalGothic", file: "metalgothic.woff2", fallback: { css: "Pirata One", spec: "Pirata+One" } },
  Sakura: { kind: "local", css: "Sakura", file: "sakura.woff2", fallback: { css: "Sniglet", spec: "Sniglet:wght@400;800" } },
  Mansalva: { kind: "google", css: "Mansalva", spec: "Mansalva" },
  UnifrakturMaguntia: { kind: "google", css: "UnifrakturMaguntia", spec: "UnifrakturMaguntia" },
  Inter: { kind: "google", css: "Inter", spec: "Inter:wght@400;500;600;700" },
  Manrope: { kind: "google", css: "Manrope", spec: "Manrope:wght@400;500;600;700" },
  "Space Grotesk": { kind: "google", css: "Space Grotesk", spec: "Space+Grotesk:wght@400;500;600;700" },
  Orbitron: { kind: "google", css: "Orbitron", spec: "Orbitron:wght@400;500;600;700" },
};

const LOCAL_FONT_DIR = "/assets/bio/fonts";

/**
 * Font tự host ĐÃ có file trong `public/assets/bio/fonts/` (kèm giấy phép, xem
 * README ở đó). Font chưa có trong danh sách dùng thẳng font Google gần giống và
 * KHÔNG tải file — tránh request 404 (ở chế độ dev, 404 đầu tiên khiến Next.js
 * biên dịch trang not-found và có thể tải lại trang).
 *
 * Chưa cài: Starborn, MetalGothic (giấy phép thương mại phải mua), Drippy, Sakura
 * (chưa xác định được font gốc).
 */
const INSTALLED_LOCAL_FONTS: ReadonlySet<BioDesignFontFamily> = new Set<BioDesignFontFamily>(["Minecraft"]);

function sourceOf(family: BioDesignFontFamily): FontSource {
  return FONT_SOURCES[family] ?? FONT_SOURCES.Chillax;
}

function isInstalledLocal(family: BioDesignFontFamily) {
  return sourceOf(family).kind === "local" && INSTALLED_LOCAL_FONTS.has(family);
}

export function getBioFontStack(family: BioDesignFontFamily) {
  const source = sourceOf(family);
  if (source.kind === "local") {
    // Font tự host đứng trước, font gần giống ngay sau: tải lỗi thì trình duyệt tự dùng font sau.
    const own = isInstalledLocal(family) ? `"${source.css}", ` : "";
    return `${own}"${source.fallback.css}", "${VIETNAMESE_FALLBACK}", ui-sans-serif, system-ui, sans-serif`;
  }
  return `"${source.css}", "${VIETNAMESE_FALLBACK}", ui-sans-serif, system-ui, sans-serif`;
}

/* -------------------------------------------------------------------------- */
/* Thẻ nạp font                                                               */
/* -------------------------------------------------------------------------- */

/*
 * Mỗi font một thẻ, URL cố định → React 19 khử trùng lặp thẻ <link>/<style> có
 * `precedence` theo `href` trên toàn trang: cùng một font dùng ở trang bio, ô
 * chọn font, bộ chọn hiệu ứng tên… chỉ tải một lần.
 */
function googleHref(spec: string, text?: string) {
  return `https://fonts.googleapis.com/css2?family=${spec}${text ? `&text=${encodeURIComponent(text)}` : ""}&display=swap`;
}

function fontshareHref(spec: string) {
  return `https://api.fontshare.com/v2/css?f[]=${spec}&display=swap`;
}

function localFontFace(source: Extract<FontSource, { kind: "local" }>) {
  return `@font-face{font-family:"${source.css}";src:url("${LOCAL_FONT_DIR}/${source.file}") format("woff2");font-display:swap;}`;
}

/**
 * Theo dõi font tự host: nếu file không tải được (404, lỗi mạng…) thì trả về
 * true để nạp font Google gần giống làm dự phòng.
 */
function useLocalFontFailed(family: BioDesignFontFamily, enabled: boolean) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || typeof document === "undefined" || !document.fonts?.load) return;
    let active = true;
    const source = sourceOf(family);
    document.fonts
      .load(`16px "${source.css}"`)
      .then((faces) => { if (active && faces.length === 0) setFailed(true); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [family, enabled]);
  return failed;
}

function FontTags({ family, text }: { family: BioDesignFontFamily; text?: string }) {
  const source = sourceOf(family);
  const installed = isInstalledLocal(family);
  const localFailed = useLocalFontFailed(family, installed);

  if (source.kind === "google") {
    return <link rel="stylesheet" href={googleHref(source.spec, text)} precedence="default" />;
  }
  if (source.kind === "fontshare") {
    return <link rel="stylesheet" href={fontshareHref(source.spec)} precedence="default" />;
  }
  return (
    <>
      {installed ? (
        <style href={`bio-font-${source.file}`} precedence="default">
          {localFontFace(source)}
        </style>
      ) : null}
      {/* Chưa cài, hoặc file tải lỗi → nạp font gần giống. */}
      {!installed || localFailed ? (
        <link rel="stylesheet" href={googleHref(source.fallback.spec, text)} precedence="default" />
      ) : null}
    </>
  );
}

/*
 * Quan trọng: thẻ <link rel="stylesheet" precedence> render ở client (sau khi
 * trang đã tải) khiến React 19 SUSPEND tới khi stylesheet tải xong. Không có
 * Suspense riêng thì React treo tới boundary gần nhất của route (loading của
 * Next) → cả trang chuyển sang trạng thái tải, trông như bị reload. Bọc riêng
 * để chỉ phần thẻ font (không hiển thị gì) chờ.
 */
function FontBoundary({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

/**
 * Nạp font của trang bio (chỉ các font đang dùng). Bộ chữ Việt dự phòng chỉ nạp
 * một lần cho cả trang.
 */
export function BioPublicFonts({ families }: { families: BioDesignFontFamily[] }) {
  return (
    <FontBoundary>
      <link rel="stylesheet" href={googleHref(`${VIETNAMESE_FALLBACK}:wght@400;500;600;700`)} precedence="default" />
      {[...new Set(families)].map((family) => <FontTags key={family} family={family} />)}
    </FontBoundary>
  );
}

/** Ký tự cần để vẽ tên font trong ô chọn font (Google chỉ tải đúng các ký tự này). */
const PICKER_TEXT = [...new Set(bioDesignFontFamilies.join(""))].join("");

/**
 * Nạp font cho danh sách trong ô chọn font: chỉ gọi khi danh sách đang mở. Font
 * Google chỉ tải các ký tự của tên font (vài KB mỗi font).
 */
export function BioFontPickerFonts() {
  return (
    <FontBoundary>
      {bioDesignFontFamilies.map((family) => <FontTags key={family} family={family} text={PICKER_TEXT} />)}
    </FontBoundary>
  );
}
