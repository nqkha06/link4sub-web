export type LinkBackgroundImagePreset = {
  id: string
  name: string
  categories: string[]
  imageUrl: string
  desktopImageUrl: string
  enabled: true
}

const STU_WALLPAPER_BASE_URL = "/assets/images/stus"

function createWallpaperPreset(
  number: number,
  slug: string,
  name: string,
  categories: string[],
): LinkBackgroundImagePreset {
  const prefix = `stu-wallpaper-${String(number).padStart(2, "0")}-${slug}`

  return {
    id: prefix,
    name,
    categories,
    imageUrl: `${STU_WALLPAPER_BASE_URL}/${prefix}-mobile.png`,
    desktopImageUrl: `${STU_WALLPAPER_BASE_URL}/${prefix}-desktop.png`,
    enabled: true,
  }
}

export const LINK_BACKGROUND_IMAGE_PRESETS: LinkBackgroundImagePreset[] = [
  createWallpaperPreset(1, "rainbow-light-waves", "Rainbow Light Waves", ["Abstract", "Colorful"]),
  createWallpaperPreset(2, "futuristic-liquid-metal", "Futuristic Liquid Metal", ["Abstract", "Technology"]),
  createWallpaperPreset(3, "golden-energy-burst", "Golden Energy Burst", ["Abstract", "Energy"]),
  createWallpaperPreset(4, "cyberpunk-neon-glitch", "Cyberpunk Neon Glitch", ["Cyberpunk", "Technology"]),
  createWallpaperPreset(5, "volcanic-lava-rock", "Volcanic Lava Rock", ["Nature", "Dark"]),
  createWallpaperPreset(6, "retro-neon-crt", "Retro Neon CRT", ["Retro", "Technology"]),
  createWallpaperPreset(7, "neon-circuit-board", "Neon Circuit Board", ["Technology", "Neon"]),
  createWallpaperPreset(8, "neon-data-rain", "Neon Data Rain", ["Technology", "Cyberpunk"]),
  createWallpaperPreset(9, "neon-lightning-portal", "Neon Lightning Portal", ["Energy", "Neon"]),
  createWallpaperPreset(10, "minimal-tech-hexagons", "Minimal Tech Hexagons", ["Minimal", "Technology"]),
  createWallpaperPreset(11, "neon-sunset-grid", "Neon Sunset Grid", ["Retro", "Neon"]),
  createWallpaperPreset(12, "green-industrial-mist", "Green Industrial Mist", ["Industrial", "Dark"]),
  createWallpaperPreset(13, "red-carbon-fiber", "Red Carbon Fiber", ["Technology", "Dark"]),
  createWallpaperPreset(14, "neon-light-waves", "Neon Light Waves", ["Abstract", "Neon"]),
  createWallpaperPreset(15, "ambient-gaming-room", "Ambient Gaming Room", ["Gaming", "Interior"]),
  createWallpaperPreset(16, "neon-bay-city", "Neon Bay City", ["City", "Neon"]),
  createWallpaperPreset(17, "volcanic-dragon-scales", "Volcanic Dragon Scales", ["Fantasy", "Dark"]),
  createWallpaperPreset(18, "pixel-purple-mountain-sunset", "Pixel Purple Mountain Sunset", ["Pixel Art", "Landscape"]),
  createWallpaperPreset(19, "pixel-cloudy-starfield", "Pixel Cloudy Starfield", ["Pixel Art", "Space"]),
  createWallpaperPreset(20, "frost-crystal-frame", "Frost Crystal Frame", ["Nature", "Fantasy"]),
  createWallpaperPreset(21, "enchanted-cherry-blossom-night", "Enchanted Cherry Blossom Night", ["Nature", "Fantasy"]),
  createWallpaperPreset(22, "neon-mountain-valley", "Neon Mountain Valley", ["Landscape", "Neon"]),
  createWallpaperPreset(23, "purple-cyan-nebula-portal", "Purple Cyan Nebula Portal", ["Space", "Neon"]),
  createWallpaperPreset(24, "minimal-black-grain", "Minimal Black Grain", ["Minimal", "Dark"]),
]
