function getTerrainPalette(terrainDefinition) {
  const hue = Number(terrainDefinition?.oklchHue ?? 132)
  const category = terrainDefinition?.category ?? 'field'
  const isWalkable = terrainDefinition?.walkable !== false

  const profile = {
    field: {
      lightness1: 70,
      lightness2: 62,
      chroma1: 0.12,
      chroma2: 0.1,
      lightnessVariance: 4,
      chromaVariance: 0.012,
      hueVariance: 9,
    },
    forest: {
      lightness1: 56,
      lightness2: 46,
      chroma1: 0.1,
      chroma2: 0.08,
      lightnessVariance: 4,
      chromaVariance: 0.012,
      hueVariance: 8,
    },
    water: {
      lightness1: 64,
      lightness2: 54,
      chroma1: 0.16,
      chroma2: 0.14,
      lightnessVariance: 4,
      chromaVariance: 0.012,
      hueVariance: 7,
    },
    earth: {
      lightness1: 66,
      lightness2: 56,
      chroma1: 0.08,
      chroma2: 0.07,
      lightnessVariance: 4,
      chromaVariance: 0.009,
      hueVariance: 6,
    },
    road: {
      lightness1: 64,
      lightness2: 56,
      chroma1: 0.06,
      chroma2: 0.05,
      lightnessVariance: 3,
      chromaVariance: 0.007,
      hueVariance: 5,
    },
    structure: {
      lightness1: 58,
      lightness2: 48,
      chroma1: 0.05,
      chroma2: 0.04,
      lightnessVariance: 3,
      chromaVariance: 0.006,
      hueVariance: 5,
    },
    rock: {
      lightness1: 62,
      lightness2: 52,
      chroma1: 0.03,
      chroma2: 0.02,
      lightnessVariance: 3,
      chromaVariance: 0.004,
      hueVariance: 4,
    },
    cold: {
      lightness1: 92,
      lightness2: 86,
      chroma1: 0.03,
      chroma2: 0.02,
      lightnessVariance: 2,
      chromaVariance: 0.003,
      hueVariance: 4,
    },
    hazard: {
      lightness1: 58,
      lightness2: 44,
      chroma1: 0.18,
      chroma2: 0.15,
      lightnessVariance: 5,
      chromaVariance: 0.014,
      hueVariance: 8,
    },
  }[category] ?? {
    lightness1: 70,
    lightness2: 62,
    chroma1: 0.12,
    chroma2: 0.1,
    lightnessVariance: 4,
    chromaVariance: 0.012,
    hueVariance: 8,
  }

  if (isWalkable || category === 'hazard') {
    return {
      ...profile,
      hue1: hue,
      hue2: hue - Math.max(4, Math.round(profile.hueVariance * 0.8)),
    }
  }

  return {
    ...profile,
    lightness1: profile.lightness1 - 12,
    lightness2: profile.lightness2 - 12,
    chroma1: Math.max(0.02, profile.chroma1 - 0.01),
    chroma2: Math.max(0.015, profile.chroma2 - 0.01),
    hue1: hue,
    hue2: hue - Math.max(4, Math.round(profile.hueVariance * 0.8)),
  }
}

export { getTerrainPalette }
