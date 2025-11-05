// src/systems/spawnSystem.js
import { checkSpawnCollision } from '../utils/gameMath';

export const adjustSpawnRates = (state) => {
  const baseRates = state.baseSpawnRates;
  state.currentSpawnRates = { ...baseRates };

  if (state.cannonIslandsUnlocked) {
    state.currentSpawnRates.island = baseRates.island * 2;
  }

  if (state.enemyBoatsUnlocked) {
    state.currentSpawnRates.island = baseRates.island * 3;
    state.currentSpawnRates.cannonIsland = baseRates.cannonIsland * 2;
  }

  if (state.planesUnlocked) {
    state.currentSpawnRates.island = baseRates.island * 4;
    state.currentSpawnRates.cannonIsland = baseRates.cannonIsland * 3;
    state.currentSpawnRates.enemy = baseRates.enemy * 2;
  }
};

export const spawnIslands = (state, frameCount, canvasSize) => {
  const spawnRate = state.currentSpawnRates.island;
  
  // Asegurarse de que islands sea un array
  if (!state.islands) state.islands = [];
  
  if (frameCount - state.lastIslandSpawn > spawnRate) {
    const size = Math.random() * 60 + 40;
    const newIsland = {
      x: Math.random() * (canvasSize.width - size),
      y: -size,
      width: size,
      height: size,
      speed: 2 + Math.random() * 1,
      type: 'normal'
    };
    
    const existingObjects = [...(state.islands || []), ...(state.cannonIslands || [])];
    if (!checkSpawnCollision(newIsland, existingObjects, 30)) {
      state.islands.push(newIsland);
      state.lastIslandSpawn = frameCount;
    }
  }

  state.islands = (state.islands || []).filter(island => {
    if (!island) return false;
    island.y += island.speed;
    return island.y < canvasSize.height + 50;
  });
};

export const spawnCannonIslands = (state, frameCount, canvasSize) => {
  const spawnRate = state.currentSpawnRates.cannonIsland;
  
  // Asegurarse de que cannonIslands sea un array
  if (!state.cannonIslands) state.cannonIslands = [];
  
  if (frameCount - state.lastCannonIslandSpawn > spawnRate) {
    const size = Math.random() * 50 + 60;
    const newCannonIsland = {
      x: Math.random() * (canvasSize.width - size),
      y: -size,
      width: size,
      height: size,
      speed: 1.5 + Math.random() * 0.5,
      type: 'cannon',
      bulletCooldown: 0,
      maxBulletCooldown: 100
    };
    
    const existingObjects = [...(state.islands || []), ...(state.cannonIslands || [])];
    if (!checkSpawnCollision(newCannonIsland, existingObjects, 30)) {
      state.cannonIslands.push(newCannonIsland);
      state.lastCannonIslandSpawn = frameCount;
    }
  }

  state.cannonIslands = (state.cannonIslands || []).filter(island => {
    if (!island) return false;
    island.y += island.speed;
    return island.y < canvasSize.height + 50;
  });
};

export const spawnEnemies = (state, frameCount, canvasSize, config) => {
  const spawnRate = state.currentSpawnRates.enemy;
  
  // Asegurarse de que enemyBoats sea un array
  if (!state.enemyBoats) state.enemyBoats = [];
  if (!state.planes) state.planes = [];
  
  if (frameCount - state.lastEnemySpawn > spawnRate && 
      state.enemyBoats.length < config.maxEnemyBoats) {
    
    const spawnLeft = Math.random() > 0.5;
    const newEnemy = {
      x: spawnLeft ? -50 : canvasSize.width + 50,
      y: Math.random() * (canvasSize.height - 200) + 100,
      width: 35,
      height: 50,
      speed: config.enemySpeed + Math.random() * 0.3,
      type: 'chaser',
      angle: 0
    };
    
    const allEnemies = [...(state.enemyBoats || []), ...(state.planes || [])];
    if (!checkSpawnCollision(newEnemy, allEnemies, 60)) {
      state.enemyBoats.push(newEnemy);
      state.lastEnemySpawn = frameCount;
    }
  }
};

export const spawnPlanes = (state, frameCount, canvasSize) => {
  const spawnRate = state.currentSpawnRates.plane;
  
  // Asegurarse de que planes sea un array
  if (!state.planes) state.planes = [];
  if (!state.enemyBoats) state.enemyBoats = [];
  
  if (frameCount - state.lastPlaneSpawn > spawnRate) {
    const newPlane = {
      x: Math.random() * (canvasSize.width - 200) + 100,
      y: -40,
      width: 45,
      height: 25,
      speed: 2.5 + Math.random() * 0.5,
      bombCooldown: 0,
      maxBombCooldown: 120,
      type: 'bomber'
    };
    
    const allEnemies = [...(state.enemyBoats || []), ...(state.planes || [])];
    if (!checkSpawnCollision(newPlane, allEnemies, 50)) {
      state.planes.push(newPlane);
      state.lastPlaneSpawn = frameCount;
    }
  }

  state.planes = (state.planes || []).filter(plane => {
    if (!plane) return false;
    plane.y += plane.speed;
    return plane.y < canvasSize.height + 50;
  });
};

export const spawnPowerUps = (state, frameCount, canvasSize) => {
  const spawnRate = state.currentSpawnRates.powerUp;
  
  // Asegurarse de que powerUps sea un array
  if (!state.powerUps) state.powerUps = [];
  
  if (frameCount - state.lastPowerUpSpawn > spawnRate && state.powerUps.length < 2) {
    const powerUpTypes = ['shield', 'disableEnemies'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const newPowerUp = {
      x: Math.random() * (canvasSize.width - 30),
      y: -30,
      width: 30,
      height: 30,
      speed: 2,
      type: type
    };
    
    state.powerUps.push(newPowerUp);
    state.lastPowerUpSpawn = frameCount;
  }

  state.powerUps = (state.powerUps || []).filter(powerUp => {
    if (!powerUp) return false;
    powerUp.y += powerUp.speed;
    return powerUp.y < canvasSize.height + 50;
  });
};