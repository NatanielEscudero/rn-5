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

// Nuevo: Tamaño base del canvas más grande
export const canvasBaseSize = {
  width: 1000,
  height: 750
};