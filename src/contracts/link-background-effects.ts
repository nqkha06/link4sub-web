export type LinkBackgroundEffects = {
  opacity: number;
  blur: number;
  saturation: number;
  contrast: number;
  grayscale: number;
};

/**
 * Balanced wallpaper treatment: keeps the artwork visible while moving it
 * behind the unlock UI and glass surfaces.
 */
export const DEFAULT_LINK_BACKGROUND_EFFECTS: Readonly<LinkBackgroundEffects> = Object.freeze({
  opacity: 82,
  blur: 8,
  saturation: 88,
  contrast: 92,
  grayscale: 0,
});

const LEGACY_NEUTRAL_LINK_BACKGROUND_EFFECTS: Readonly<LinkBackgroundEffects> = Object.freeze({
  opacity: 100,
  blur: 0,
  saturation: 100,
  contrast: 100,
  grayscale: 0,
});

export function resolveLinkBackgroundEffects(
  effects?: Partial<LinkBackgroundEffects> | null,
): LinkBackgroundEffects {
  if (
    effects &&
    effects.opacity === LEGACY_NEUTRAL_LINK_BACKGROUND_EFFECTS.opacity &&
    effects.blur === LEGACY_NEUTRAL_LINK_BACKGROUND_EFFECTS.blur &&
    effects.saturation === LEGACY_NEUTRAL_LINK_BACKGROUND_EFFECTS.saturation &&
    effects.contrast === LEGACY_NEUTRAL_LINK_BACKGROUND_EFFECTS.contrast &&
    effects.grayscale === LEGACY_NEUTRAL_LINK_BACKGROUND_EFFECTS.grayscale
  ) {
    return { ...DEFAULT_LINK_BACKGROUND_EFFECTS };
  }

  return {
    opacity: effects?.opacity ?? DEFAULT_LINK_BACKGROUND_EFFECTS.opacity,
    blur: effects?.blur ?? DEFAULT_LINK_BACKGROUND_EFFECTS.blur,
    saturation: effects?.saturation ?? DEFAULT_LINK_BACKGROUND_EFFECTS.saturation,
    contrast: effects?.contrast ?? DEFAULT_LINK_BACKGROUND_EFFECTS.contrast,
    grayscale: effects?.grayscale ?? DEFAULT_LINK_BACKGROUND_EFFECTS.grayscale,
  };
}
