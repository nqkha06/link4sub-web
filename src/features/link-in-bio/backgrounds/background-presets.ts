export type BioBackgroundPresetCategory =
  | "abstract"
  | "retro"
  | "winter"
  | "holiday"
  | "vietnam"
  | "nature"
  | "dreamy"
  | "modern"
  | "culture"
  | "lifestyle"
  | "solid";

export type BioBackgroundPreset = {
  id: string;
  name: string;
  category: BioBackgroundPresetCategory;
  /** Rỗng với mẫu đơn sắc (không dùng ảnh nền). */
  imageUrl: string;
  /** Màu nền trang cho mẫu đơn sắc. */
  backgroundColor?: string;
  /** Gradient phủ lên màu nền của mẫu đơn sắc. */
  backgroundGradient?: string;
  theme: BioBackgroundPresetTheme;
};

export type BioBackgroundPresetTheme = {
  accentColor: string;
  surfaceColor: string;
  surfaceBorderColor: string;
  textColor: string;
  mutedTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonBorderColor: string;
  iconColor: string;
  iconTextColor: string;
  sectionColor: string;
  sectionBorderColor: string;
};

export const defaultBioPresetTheme: BioBackgroundPresetTheme = {
  accentColor: "#2563eb",
  surfaceColor: "rgba(255, 255, 255, 0.90)",
  surfaceBorderColor: "rgba(255, 255, 255, 0.64)",
  textColor: "#0f172a",
  mutedTextColor: "#64748b",
  buttonColor: "#0f172a",
  buttonTextColor: "#ffffff",
  buttonBorderColor: "#0f172a",
  iconColor: "#ffffff",
  iconTextColor: "#0f172a",
  sectionColor: "rgba(255, 255, 255, 0.86)",
  sectionBorderColor: "rgba(148, 163, 184, 0.38)",
};

function darkImageTheme(
  accentColor: string,
  buttonColor: string,
  buttonTextColor = "#ffffff",
): BioBackgroundPresetTheme {
  return {
    accentColor,
    surfaceColor: "rgba(8, 15, 28, 0.84)",
    surfaceBorderColor: "rgba(255, 255, 255, 0.20)",
    textColor: "#f8fafc",
    mutedTextColor: "#cbd5e1",
    buttonColor,
    buttonTextColor,
    buttonBorderColor: accentColor,
    iconColor: "rgba(255, 255, 255, 0.90)",
    iconTextColor: buttonColor,
    sectionColor: "rgba(15, 23, 42, 0.76)",
    sectionBorderColor: "rgba(255, 255, 255, 0.18)",
  };
}

function lightImageTheme(
  accentColor: string,
  textColor: string,
  buttonColor: string,
  buttonTextColor = "#ffffff",
): BioBackgroundPresetTheme {
  return {
    accentColor,
    surfaceColor: "rgba(255, 255, 255, 0.88)",
    surfaceBorderColor: "rgba(255, 255, 255, 0.72)",
    textColor,
    mutedTextColor: "#475569",
    buttonColor,
    buttonTextColor,
    buttonBorderColor: accentColor,
    iconColor: "rgba(255, 255, 255, 0.92)",
    iconTextColor: buttonColor,
    sectionColor: "rgba(255, 255, 255, 0.78)",
    sectionBorderColor: "rgba(148, 163, 184, 0.30)",
  };
}

export const DEFAULT_BIO_BACKGROUND_PRESET_ID = "preset:sunset-bubbles";

export const bioBackgroundPresetCategoryLabels: Record<
  BioBackgroundPresetCategory,
  string
> = {
  abstract: "Trừu tượng",
  retro: "Hoài cổ",
  winter: "Mùa đông",
  holiday: "Lễ hội",
  vietnam: "Việt Nam",
  nature: "Thiên nhiên",
  dreamy: "Mộng mơ",
  modern: "Hiện đại",
  culture: "Văn hóa",
  lifestyle: "Phong cách sống",
  solid: "Màu chuyển",
};

export const bioBackgroundPresets: BioBackgroundPreset[] = [
  {
    id: "preset:sunset-bubbles",
    name: "Bong bóng hoàng hôn",
    category: "abstract",
    imageUrl: "/assets/images/bios/21-sunset-bubbles-9x16.jpg",
    theme: {
      accentColor: "#f9736a",
      surfaceColor: "rgba(255, 247, 242, 0.90)",
      surfaceBorderColor: "rgba(255, 237, 213, 0.82)",
      textColor: "#431407",
      mutedTextColor: "#9a513c",
      buttonColor: "#9a3412",
      buttonTextColor: "#fff7ed",
      buttonBorderColor: "#fdba74",
      iconColor: "#ffedd5",
      iconTextColor: "#9a3412",
      sectionColor: "rgba(255, 237, 213, 0.84)",
      sectionBorderColor: "rgba(251, 146, 60, 0.34)",
    },
  },
  {
    id: "preset:retro-desktop",
    name: "Desktop hoài cổ",
    category: "retro",
    imageUrl: "/assets/images/bios/22-retro-desktop-9x16.jpg",
    theme: {
      accentColor: "#2f8f8a",
      surfaceColor: "rgba(239, 253, 250, 0.92)",
      surfaceBorderColor: "rgba(153, 246, 228, 0.70)",
      textColor: "#134e4a",
      mutedTextColor: "#467b77",
      buttonColor: "#155e75",
      buttonTextColor: "#ecfeff",
      buttonBorderColor: "#5eead4",
      iconColor: "#ccfbf1",
      iconTextColor: "#115e59",
      sectionColor: "rgba(204, 251, 241, 0.84)",
      sectionBorderColor: "rgba(20, 184, 166, 0.30)",
    },
  },
  {
    id: "preset:orange-sparkles",
    name: "Lấp lánh cam",
    category: "abstract",
    imageUrl: "/assets/images/bios/23-orange-sparkles-9x16.jpg",
    theme: {
      accentColor: "#f97316",
      surfaceColor: "rgba(255, 251, 235, 0.91)",
      surfaceBorderColor: "rgba(254, 215, 170, 0.78)",
      textColor: "#431407",
      mutedTextColor: "#92400e",
      buttonColor: "#c2410c",
      buttonTextColor: "#fff7ed",
      buttonBorderColor: "#fdba74",
      iconColor: "#ffedd5",
      iconTextColor: "#c2410c",
      sectionColor: "rgba(254, 243, 199, 0.86)",
      sectionBorderColor: "rgba(245, 158, 11, 0.34)",
    },
  },
  {
    id: "preset:crimson-lantern-glow",
    name: "Đèn lồng đỏ",
    category: "holiday",
    imageUrl: "/assets/images/bios/24-crimson-lantern-glow-9x16.jpg",
    theme: {
      accentColor: "#ef4444",
      surfaceColor: "rgba(34, 10, 12, 0.90)",
      surfaceBorderColor: "rgba(248, 113, 113, 0.34)",
      textColor: "#fff7ed",
      mutedTextColor: "#fecaca",
      buttonColor: "#fef2f2",
      buttonTextColor: "#7f1d1d",
      buttonBorderColor: "#fca5a5",
      iconColor: "#fee2e2",
      iconTextColor: "#991b1b",
      sectionColor: "rgba(69, 10, 10, 0.78)",
      sectionBorderColor: "rgba(248, 113, 113, 0.32)",
    },
  },
  {
    id: "preset:cobalt-snowfall",
    name: "Tuyết xanh cobalt",
    category: "winter",
    imageUrl: "/assets/images/bios/25-cobalt-snowfall-9x16.jpg",
    theme: {
      accentColor: "#60a5fa",
      surfaceColor: "rgba(8, 30, 73, 0.90)",
      surfaceBorderColor: "rgba(96, 165, 250, 0.36)",
      textColor: "#eff6ff",
      mutedTextColor: "#bfdbfe",
      buttonColor: "#dbeafe",
      buttonTextColor: "#1e3a8a",
      buttonBorderColor: "#93c5fd",
      iconColor: "#bfdbfe",
      iconTextColor: "#1e40af",
      sectionColor: "rgba(30, 58, 138, 0.74)",
      sectionBorderColor: "rgba(147, 197, 253, 0.32)",
    },
  },
  {
    id: "preset:arctic-mist-snowflakes",
    name: "Sương tuyết Bắc Cực",
    category: "winter",
    imageUrl: "/assets/images/bios/26-arctic-mist-snowflakes-9x16.jpg",
    theme: {
      accentColor: "#38bdf8",
      surfaceColor: "rgba(248, 252, 255, 0.93)",
      surfaceBorderColor: "rgba(186, 230, 253, 0.82)",
      textColor: "#0c4a6e",
      mutedTextColor: "#47728a",
      buttonColor: "#0369a1",
      buttonTextColor: "#f0f9ff",
      buttonBorderColor: "#7dd3fc",
      iconColor: "#e0f2fe",
      iconTextColor: "#0369a1",
      sectionColor: "rgba(224, 242, 254, 0.88)",
      sectionBorderColor: "rgba(56, 189, 248, 0.28)",
    },
  },
  {
    id: "preset:emerald-lantern-garland",
    name: "Đèn lồng rừng xanh",
    category: "holiday",
    imageUrl: "/assets/images/bios/27-emerald-lantern-garland-9x16.jpg",
    theme: {
      accentColor: "#fbbf24",
      surfaceColor: "rgba(4, 47, 46, 0.90)",
      surfaceBorderColor: "rgba(52, 211, 153, 0.30)",
      textColor: "#ecfdf5",
      mutedTextColor: "#a7f3d0",
      buttonColor: "#fef3c7",
      buttonTextColor: "#064e3b",
      buttonBorderColor: "#fcd34d",
      iconColor: "#fde68a",
      iconTextColor: "#065f46",
      sectionColor: "rgba(6, 78, 59, 0.76)",
      sectionBorderColor: "rgba(52, 211, 153, 0.30)",
    },
  },
  {
    id: "preset:midnight-red-garland",
    name: "Vòng lá đỏ",
    category: "holiday",
    imageUrl: "/assets/images/bios/28-midnight-red-garland-9x16.jpg",
    theme: {
      accentColor: "#fb7185",
      surfaceColor: "rgba(2, 36, 43, 0.91)",
      surfaceBorderColor: "rgba(251, 113, 133, 0.34)",
      textColor: "#fff1f2",
      mutedTextColor: "#fecdd3",
      buttonColor: "#be123c",
      buttonTextColor: "#fff1f2",
      buttonBorderColor: "#fda4af",
      iconColor: "#ffe4e6",
      iconTextColor: "#9f1239",
      sectionColor: "rgba(76, 5, 25, 0.72)",
      sectionBorderColor: "rgba(251, 113, 133, 0.30)",
    },
  },
  {
    id: "preset:forest-gold-garland",
    name: "Vòng lá ánh kim",
    category: "holiday",
    imageUrl: "/assets/images/bios/29-forest-gold-garland-9x16.jpg",
    theme: {
      accentColor: "#d6ad55",
      surfaceColor: "rgba(3, 48, 34, 0.91)",
      surfaceBorderColor: "rgba(214, 173, 85, 0.38)",
      textColor: "#fffbea",
      mutedTextColor: "#e8d7a6",
      buttonColor: "#d6ad55",
      buttonTextColor: "#173c2c",
      buttonBorderColor: "#f5d98f",
      iconColor: "#fff1bd",
      iconTextColor: "#24513c",
      sectionColor: "rgba(6, 78, 59, 0.76)",
      sectionBorderColor: "rgba(214, 173, 85, 0.32)",
    },
  },
  {
    id: "preset:gradient-sunset",
    name: "Hoàng hôn",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#ff7e5f",
    backgroundGradient:
      "radial-gradient(at 12% 8%, #ffd166 0px, transparent 55%), radial-gradient(at 88% 12%, #ff5e8a 0px, transparent 55%), radial-gradient(at 80% 92%, #7b2ff7 0px, transparent 60%), radial-gradient(at 10% 90%, #ff9a3c 0px, transparent 55%), linear-gradient(160deg, #ff9a5a, #ef4f8b)",
    theme: {
      accentColor: "#e11d74",
      surfaceColor: "rgba(255, 255, 255, 0.82)",
      surfaceBorderColor: "rgba(255, 255, 255, 0.70)",
      textColor: "#3b0a2a",
      mutedTextColor: "#8a3a5e",
      buttonColor: "#3b0a2a",
      buttonTextColor: "#fff4ec",
      buttonBorderColor: "#3b0a2a",
      iconColor: "rgba(255, 255, 255, 0.92)",
      iconTextColor: "#c2185b",
      sectionColor: "rgba(255, 255, 255, 0.72)",
      sectionBorderColor: "rgba(225, 29, 116, 0.26)",
    },
  },
  {
    id: "preset:gradient-ocean",
    name: "Đại dương",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#1e90ff",
    backgroundGradient:
      "radial-gradient(at 10% 10%, #5ef0e0 0px, transparent 55%), radial-gradient(at 90% 15%, #3b82f6 0px, transparent 55%), radial-gradient(at 85% 90%, #4f46e5 0px, transparent 60%), radial-gradient(at 8% 88%, #06b6d4 0px, transparent 55%), linear-gradient(160deg, #22d3ee, #4338ca)",
    theme: {
      accentColor: "#2563eb",
      surfaceColor: "rgba(255, 255, 255, 0.82)",
      surfaceBorderColor: "rgba(255, 255, 255, 0.70)",
      textColor: "#0b1f4d",
      mutedTextColor: "#3f5b94",
      buttonColor: "#0b1f4d",
      buttonTextColor: "#eef6ff",
      buttonBorderColor: "#0b1f4d",
      iconColor: "rgba(255, 255, 255, 0.92)",
      iconTextColor: "#1d4ed8",
      sectionColor: "rgba(255, 255, 255, 0.72)",
      sectionBorderColor: "rgba(37, 99, 235, 0.26)",
    },
  },
  {
    id: "preset:gradient-candy",
    name: "Kẹo ngọt",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#f9a8d4",
    backgroundGradient:
      "radial-gradient(at 15% 12%, #ff8fd8 0px, transparent 55%), radial-gradient(at 88% 10%, #8ec5ff 0px, transparent 55%), radial-gradient(at 82% 88%, #c4a1ff 0px, transparent 60%), radial-gradient(at 10% 92%, #ffd3a5 0px, transparent 55%), linear-gradient(160deg, #ffc6e8, #b9c8ff)",
    theme: {
      accentColor: "#c026d3",
      surfaceColor: "rgba(255, 255, 255, 0.82)",
      surfaceBorderColor: "rgba(255, 255, 255, 0.70)",
      textColor: "#3b0764",
      mutedTextColor: "#7e4a99",
      buttonColor: "#86198f",
      buttonTextColor: "#fdf4ff",
      buttonBorderColor: "#86198f",
      iconColor: "rgba(255, 255, 255, 0.92)",
      iconTextColor: "#a21caf",
      sectionColor: "rgba(255, 255, 255, 0.72)",
      sectionBorderColor: "rgba(192, 38, 211, 0.24)",
    },
  },
  {
    id: "preset:gradient-lime",
    name: "Chanh bạc hà",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#5eead4",
    backgroundGradient:
      "radial-gradient(at 12% 10%, #d9f99d 0px, transparent 55%), radial-gradient(at 90% 14%, #34d399 0px, transparent 55%), radial-gradient(at 84% 90%, #06b6d4 0px, transparent 60%), radial-gradient(at 8% 90%, #a3e635 0px, transparent 55%), linear-gradient(160deg, #bef264, #14b8a6)",
    theme: {
      accentColor: "#059669",
      surfaceColor: "rgba(255, 255, 255, 0.82)",
      surfaceBorderColor: "rgba(255, 255, 255, 0.70)",
      textColor: "#052e2b",
      mutedTextColor: "#3d6b5f",
      buttonColor: "#064e3b",
      buttonTextColor: "#f0fdf4",
      buttonBorderColor: "#064e3b",
      iconColor: "rgba(255, 255, 255, 0.92)",
      iconTextColor: "#047857",
      sectionColor: "rgba(255, 255, 255, 0.72)",
      sectionBorderColor: "rgba(5, 150, 105, 0.26)",
    },
  },
  {
    id: "preset:gradient-peach",
    name: "Đào mật",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#fdba74",
    backgroundGradient:
      "radial-gradient(at 14% 10%, #fff1a8 0px, transparent 55%), radial-gradient(at 88% 14%, #ff9a8b 0px, transparent 55%), radial-gradient(at 84% 90%, #ff6a88 0px, transparent 60%), radial-gradient(at 10% 90%, #ffc37a 0px, transparent 55%), linear-gradient(160deg, #ffd9a0, #ff8a80)",
    theme: {
      accentColor: "#ea580c",
      surfaceColor: "rgba(255, 255, 255, 0.82)",
      surfaceBorderColor: "rgba(255, 255, 255, 0.70)",
      textColor: "#431407",
      mutedTextColor: "#8f5234",
      buttonColor: "#7c2d12",
      buttonTextColor: "#fff7ed",
      buttonBorderColor: "#7c2d12",
      iconColor: "rgba(255, 255, 255, 0.92)",
      iconTextColor: "#c2410c",
      sectionColor: "rgba(255, 255, 255, 0.72)",
      sectionBorderColor: "rgba(234, 88, 12, 0.26)",
    },
  },
  {
    id: "preset:gradient-aurora",
    name: "Cực quang",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#0b1026",
    backgroundGradient:
      "radial-gradient(at 15% 12%, #22d3a6 0px, transparent 50%), radial-gradient(at 85% 18%, #7c3aed 0px, transparent 55%), radial-gradient(at 75% 88%, #ec4899 0px, transparent 50%), radial-gradient(at 12% 85%, #2563eb 0px, transparent 50%), linear-gradient(160deg, #0b1026, #05070f)",
    theme: {
      accentColor: "#5eead4",
      surfaceColor: "rgba(10, 14, 36, 0.78)",
      surfaceBorderColor: "rgba(94, 234, 212, 0.28)",
      textColor: "#f0fdfa",
      mutedTextColor: "#b6c9e6",
      buttonColor: "#5eead4",
      buttonTextColor: "#062a2a",
      buttonBorderColor: "#99f6e4",
      iconColor: "#ccfbf1",
      iconTextColor: "#0f766e",
      sectionColor: "rgba(17, 24, 56, 0.66)",
      sectionBorderColor: "rgba(94, 234, 212, 0.26)",
    },
  },
  {
    id: "preset:gradient-neon",
    name: "Tím neon",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#1a0b2e",
    backgroundGradient:
      "radial-gradient(at 12% 10%, #ff2fb3 0px, transparent 50%), radial-gradient(at 88% 14%, #7c3aed 0px, transparent 55%), radial-gradient(at 82% 90%, #2563eb 0px, transparent 50%), radial-gradient(at 10% 88%, #c026d3 0px, transparent 50%), linear-gradient(160deg, #1a0b2e, #0a0414)",
    theme: {
      accentColor: "#f472b6",
      surfaceColor: "rgba(24, 10, 44, 0.78)",
      surfaceBorderColor: "rgba(244, 114, 182, 0.30)",
      textColor: "#fdf2f8",
      mutedTextColor: "#e9c4e6",
      buttonColor: "#f472b6",
      buttonTextColor: "#2a0a2e",
      buttonBorderColor: "#f9a8d4",
      iconColor: "#fce7f3",
      iconTextColor: "#be185d",
      sectionColor: "rgba(46, 16, 78, 0.66)",
      sectionBorderColor: "rgba(244, 114, 182, 0.28)",
    },
  },
  {
    id: "preset:gradient-jungle",
    name: "Rừng đêm",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#052e2b",
    backgroundGradient:
      "radial-gradient(at 14% 12%, #84cc16 0px, transparent 48%), radial-gradient(at 88% 16%, #10b981 0px, transparent 55%), radial-gradient(at 80% 90%, #0891b2 0px, transparent 50%), radial-gradient(at 10% 88%, #15803d 0px, transparent 50%), linear-gradient(160deg, #052e2b, #021412)",
    theme: {
      accentColor: "#a3e635",
      surfaceColor: "rgba(4, 34, 30, 0.80)",
      surfaceBorderColor: "rgba(163, 230, 53, 0.28)",
      textColor: "#f7fee7",
      mutedTextColor: "#c5e3b5",
      buttonColor: "#a3e635",
      buttonTextColor: "#132a05",
      buttonBorderColor: "#bef264",
      iconColor: "#ecfccb",
      iconTextColor: "#3f6212",
      sectionColor: "rgba(6, 60, 50, 0.66)",
      sectionBorderColor: "rgba(163, 230, 53, 0.26)",
    },
  },
  {
    id: "preset:gradient-ember",
    name: "Than hồng",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#1a0a0a",
    backgroundGradient:
      "radial-gradient(at 12% 10%, #f97316 0px, transparent 50%), radial-gradient(at 88% 14%, #dc2626 0px, transparent 55%), radial-gradient(at 82% 90%, #be185d 0px, transparent 50%), radial-gradient(at 10% 90%, #f59e0b 0px, transparent 45%), linear-gradient(160deg, #1f0a0a, #0a0303)",
    theme: {
      accentColor: "#fb923c",
      surfaceColor: "rgba(32, 10, 8, 0.80)",
      surfaceBorderColor: "rgba(251, 146, 60, 0.30)",
      textColor: "#fff7ed",
      mutedTextColor: "#f1c9ae",
      buttonColor: "#fb923c",
      buttonTextColor: "#2a0f03",
      buttonBorderColor: "#fdba74",
      iconColor: "#ffedd5",
      iconTextColor: "#c2410c",
      sectionColor: "rgba(64, 18, 10, 0.66)",
      sectionBorderColor: "rgba(251, 146, 60, 0.28)",
    },
  },
  {
    id: "preset:gradient-graphite",
    name: "Than chì",
    category: "solid",
    imageUrl: "",
    backgroundColor: "#0b0b0d",
    backgroundGradient:
      "radial-gradient(at 15% 10%, #6b7280 0px, transparent 50%), radial-gradient(at 88% 20%, #334155 0px, transparent 55%), radial-gradient(at 80% 92%, #52525b 0px, transparent 50%), linear-gradient(160deg, #18181b, #000000)",
    theme: {
      accentColor: "#e5e7eb",
      surfaceColor: "rgba(20, 20, 23, 0.82)",
      surfaceBorderColor: "rgba(255, 255, 255, 0.16)",
      textColor: "#fafafa",
      mutedTextColor: "#b4b4bd",
      buttonColor: "#fafafa",
      buttonTextColor: "#0b0b0d",
      buttonBorderColor: "#fafafa",
      iconColor: "#27272a",
      iconTextColor: "#fafafa",
      sectionColor: "rgba(39, 39, 42, 0.74)",
      sectionBorderColor: "rgba(255, 255, 255, 0.16)",
    },
  },
  {
    id: "preset:vietnam-hoi-an-lanterns",
    name: "Đêm đèn lồng Hội An",
    category: "vietnam",
    imageUrl: "/assets/images/bios/30-vietnam-hoi-an-lanterns-9x16.jpg",
    theme: darkImageTheme("#fbbf24", "#b45309"),
  },
  {
    id: "preset:vietnam-ha-long-dawn",
    name: "Bình minh Hạ Long",
    category: "vietnam",
    imageUrl: "/assets/images/bios/31-vietnam-ha-long-dawn-9x16.jpg",
    theme: lightImageTheme("#14b8a6", "#083344", "#0f766e"),
  },
  {
    id: "preset:vietnam-sapa-terraces",
    name: "Mây ruộng bậc thang Sa Pa",
    category: "vietnam",
    imageUrl: "/assets/images/bios/32-vietnam-sapa-terraces-9x16.jpg",
    theme: lightImageTheme("#22c55e", "#14532d", "#15803d"),
  },
  {
    id: "preset:vietnam-radiant-flag",
    name: "Việt Nam rực rỡ",
    category: "vietnam",
    imageUrl: "/assets/images/bios/50-vietnam.jpg",
    theme: darkImageTheme("#fbbf24", "#b91c1c"),
  },
  {
    id: "preset:vietnam-golden-drum",
    name: "Trống đồng ánh vàng",
    category: "vietnam",
    imageUrl: "/assets/images/bios/51-vietnam.jpg",
    theme: darkImageTheme("#fbbf24", "#92400e"),
  },
  {
    id: "preset:cosmic-nebula",
    name: "Tinh vân vô tận",
    category: "dreamy",
    imageUrl: "/assets/images/bios/33-cosmic-nebula-9x16.jpg",
    theme: darkImageTheme("#c084fc", "#7e22ce"),
  },
  {
    id: "preset:botanical-ivory",
    name: "Lá nhiệt đới trên giấy ngà",
    category: "nature",
    imageUrl: "/assets/images/bios/34-botanical-ivory-9x16.jpg",
    theme: lightImageTheme("#788c4a", "#35411f", "#556b2f"),
  },
  {
    id: "preset:sakura-moon",
    name: "Trăng hoa anh đào",
    category: "culture",
    imageUrl: "/assets/images/bios/35-sakura-moon-9x16.jpg",
    theme: darkImageTheme("#fda4af", "#be185d"),
  },
  {
    id: "preset:mediterranean-lemons",
    name: "Chanh vàng Địa Trung Hải",
    category: "nature",
    imageUrl: "/assets/images/bios/36-mediterranean-lemons-9x16.jpg",
    theme: lightImageTheme("#eab308", "#172554", "#1d4ed8"),
  },
  {
    id: "preset:desert-crescent",
    name: "Trăng non sa mạc",
    category: "nature",
    imageUrl: "/assets/images/bios/37-desert-crescent-9x16.jpg",
    theme: darkImageTheme("#fb923c", "#9a3412"),
  },
  {
    id: "preset:neon-city",
    name: "Thành phố neon",
    category: "modern",
    imageUrl: "/assets/images/bios/38-neon-city-9x16.jpg",
    theme: darkImageTheme("#22d3ee", "#c026d3"),
  },
  {
    id: "preset:pastel-clouds",
    name: "Mây ngọc trai",
    category: "dreamy",
    imageUrl: "/assets/images/bios/39-pastel-clouds-9x16.jpg",
    theme: lightImageTheme("#a78bfa", "#4c1d95", "#7c3aed"),
  },
  {
    id: "preset:bioluminescent-ocean",
    name: "Đại dương phát sáng",
    category: "dreamy",
    imageUrl: "/assets/images/bios/40-bioluminescent-ocean-9x16.jpg",
    theme: darkImageTheme("#22d3ee", "#0369a1"),
  },
  {
    id: "preset:nordic-aurora",
    name: "Cực quang phương Bắc",
    category: "nature",
    imageUrl: "/assets/images/bios/41-nordic-aurora-9x16.jpg",
    theme: darkImageTheme("#34d399", "#047857"),
  },
  {
    id: "preset:black-gold-marble",
    name: "Cẩm thạch đen ánh kim",
    category: "modern",
    imageUrl: "/assets/images/bios/42-black-gold-marble-9x16.jpg",
    theme: darkImageTheme("#d4af37", "#d4af37", "#17120a"),
  },
  {
    id: "preset:moroccan-riad",
    name: "Sân trong Morocco",
    category: "culture",
    imageUrl: "/assets/images/bios/43-moroccan-riad-9x16.jpg",
    theme: lightImageTheme("#14b8a6", "#134e4a", "#0f766e"),
  },
  {
    id: "preset:cozy-coffee",
    name: "Góc cà phê nắng sớm",
    category: "lifestyle",
    imageUrl: "/assets/images/bios/44-cozy-coffee-9x16.jpg",
    theme: lightImageTheme("#b45309", "#422006", "#78350f"),
  },
  {
    id: "preset:koi-lotus",
    name: "Cá Koi và hoa sen",
    category: "culture",
    imageUrl: "/assets/images/bios/45-koi-lotus-9x16.jpg",
    theme: darkImageTheme("#fb923c", "#c2410c"),
  },
  {
    id: "preset:lavender-sunset",
    name: "Đồng oải hương hoàng hôn",
    category: "nature",
    imageUrl: "/assets/images/bios/46-lavender-sunset-9x16.jpg",
    theme: lightImageTheme("#8b5cf6", "#4c1d95", "#7c3aed"),
  },
  {
    id: "preset:tropical-lagoon",
    name: "Đầm phá nhiệt đới",
    category: "nature",
    imageUrl: "/assets/images/bios/47-tropical-lagoon-9x16.jpg",
    theme: lightImageTheme("#06b6d4", "#083344", "#0e7490"),
  },
  {
    id: "preset:celestial-gold",
    name: "Thiên thể ánh vàng",
    category: "dreamy",
    imageUrl: "/assets/images/bios/48-celestial-gold-9x16.jpg",
    theme: darkImageTheme("#eab308", "#d4af37", "#17120a"),
  },
  {
    id: "preset:liquid-chrome",
    name: "Chrome ánh tím",
    category: "modern",
    imageUrl: "/assets/images/bios/49-liquid-chrome-9x16.jpg",
    theme: darkImageTheme("#a78bfa", "#7c3aed"),
  },
];

export function getBioBackgroundPresetById(id?: string | null) {
  return bioBackgroundPresets.find((preset) => preset.id === id);
}

export function getBioBackgroundPresetByImage(imageUrl?: string | null) {
  if (!imageUrl) return undefined;
  return bioBackgroundPresets.find((preset) => preset.imageUrl === imageUrl);
}

export function getBioPresetTheme(
  presetId?: string | null,
  backgroundImage?: string | null,
  legacyAccentColor?: string | null,
): BioBackgroundPresetTheme {
  const presetTheme = (
    getBioBackgroundPresetById(presetId) ||
    getBioBackgroundPresetByImage(backgroundImage)
  )?.theme;

  if (presetTheme) return presetTheme;

  const legacyAccent = legacyAccentColor && /^#[0-9a-f]{6}$/i.test(legacyAccentColor)
    && legacyAccentColor.toLowerCase() !== "#ffffff"
    ? legacyAccentColor
    : undefined;

  return legacyAccent
    ? {
      ...defaultBioPresetTheme,
      accentColor: legacyAccent,
      buttonColor: legacyAccent,
      buttonBorderColor: legacyAccent,
      iconTextColor: legacyAccent,
    }
    : defaultBioPresetTheme;
}
