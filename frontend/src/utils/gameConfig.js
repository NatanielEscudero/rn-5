// Configuración del juego
// src/utils/gameConfig.js
// Configuración del juego
export const config = {
  bulletSpeed: 4,
  bombSpeed: 4,
  enemySpeed: 1.8,
  cannonIslandSpawnScore: 100,
  enemySpawnScore: 200,
  planeSpawnScore: 300,
  maxEnemyBoats: 3,
  invulnerabilityDuration: 180, // 3 segundos de invulnerabilidad (60fps * 3)
  enemyDisableDuration: 450
};

export const baseSpawnRates = {
  island: 80,
  cannonIsland: 120,
  enemy: 160,
  plane: 200,
  powerUp: 600
};

// Tamaño base del canvas - FIJO, no se adapta
export const canvasBaseSize = {
  width: 1000,
  height: 750
};

// Tamaños VISUALES estándar (para renderizar las imágenes)
// Estos son los tamaños que ocuparán visualmente en el canvas
export const visualSizes = {
  playerBoat: { width: 50, height: 40 },
  normalIsland: { width: 80, height: 80 },
  cannonIsland: { width: 100, height: 100 },
  enemyBoat: { width: 50, height: 40 },
  plane: { width: 60, height: 40 },
  powerUp: { width: 30, height: 30 },
  bullet: { width: 8, height: 12 },
  bomb: { width: 12, height: 12 }
};

// Tamaños de HITBOX (más pequeños que lo visual, dentro del contenedor)
// Factor: 0.8 = 80% del tamaño visual
export const hitboxSizes = {
  playerBoat: { width: 40, height: 32, offsetX: 5, offsetY: 4 },
  normalIsland: { width: 64, height: 64, offsetX: 8, offsetY: 8 },
  cannonIsland: { width: 80, height: 80, offsetX: 10, offsetY: 10 },
  enemyBoat: { width: 40, height: 32, offsetX: 5, offsetY: 4 },
  plane: { width: 48, height: 32, offsetX: 6, offsetY: 4 },
  powerUp: { width: 24, height: 24, offsetX: 3, offsetY: 3 },
  bullet: { width: 6, height: 10, offsetX: 1, offsetY: 1 },
  bomb: { width: 10, height: 10, offsetX: 1, offsetY: 1 }
};