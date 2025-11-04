// src/systems/updateSystem.js
import { checkEnemyCollision, calculateAngle } from '../utils/gameMath';
import { checkRectCollision } from '../utils/gameMath';
import { activateEmergencyShield } from './powerUpSystem';

export const updateBoat = (state, canvasSize) => {
  const boat = state.boat;
  
  if (state.keys.left) {
    boat.angle -= boat.rotationSpeed;
  }
  if (state.keys.right) {
    boat.angle += boat.rotationSpeed;
  }
  
  boat.angle = boat.angle % 360;
  
  const angleInRadians = (boat.angle * Math.PI) / 180;
  boat.x += Math.sin(angleInRadians) * boat.speed;
  boat.y -= Math.cos(angleInRadians) * boat.speed;
  
  const margin = 20;
  boat.x = Math.max(margin, Math.min(canvasSize.width - margin - boat.width, boat.x));
  boat.y = Math.max(margin, Math.min(canvasSize.height - margin - boat.height, boat.y));
};

export const updateShield = (state, config) => {
  const boat = state.boat;
  const notifications = [];
  
  // Actualizar temporizador de invulnerabilidad
  if (boat.isInvulnerable) {
    boat.invulnerabilityTimer--;
    if (boat.invulnerabilityTimer <= 0) {
      boat.isInvulnerable = false;
      boat.invulnerabilityTimer = 0;
      notifications.push('¡La invulnerabilidad ha terminado!');
    }
  }
  
  
  return notifications;
};

export const updateDisabledEnemies = (state) => {
  const notifications = [];
  
  // Asegurarse de que disabledEnemies sea un array
  if (!state.disabledEnemies) state.disabledEnemies = [];
  
  state.disabledEnemies = state.disabledEnemies.filter(enemy => {
    if (!enemy) return false;
    enemy.timer--;
    return enemy.timer > 0;
  });
  
  const reactivatedEnemies = state.disabledEnemies.filter(enemy => enemy && enemy.timer <= 0);
  reactivatedEnemies.forEach(enemy => {
    if (enemy && enemy.data) {
      state.enemyBoats.push(enemy.data);
      notifications.push('¡Enemigo reactivado!');
    }
  });
  
  state.disabledEnemies = state.disabledEnemies.filter(enemy => enemy && enemy.timer > 0);
  return notifications;
};

export const updateCannonIslands = (state, boat, config) => {
  // Asegurarse de que cannonIslands sea un array
  if (!state.cannonIslands) return;
  
  state.cannonIslands.forEach((island) => {
    if (!island) return;
    
    island.bulletCooldown--;
    
    const dx = boat.x - island.x;
    const dy = boat.y - island.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (island.bulletCooldown <= 0 && distance < 300) {
      const angle = Math.atan2(boat.y - island.y, boat.x - island.x);
      state.bullets.push({
        x: island.x + island.width / 2 - 4,
        y: island.y + island.height / 2 - 4,
        vx: Math.cos(angle) * config.bulletSpeed,
        vy: Math.sin(angle) * config.bulletSpeed,
        width: 8,
        height: 8,
        type: 'cannon'
      });
      island.bulletCooldown = island.maxBulletCooldown;
    }
  });
};

export const updateEnemies = (state, boat, canvasSize) => {
  // Asegurarse de que enemyBoats sea un array
  if (!state.enemyBoats || !Array.isArray(state.enemyBoats)) return;
  
  state.enemyBoats.forEach((enemy) => {
    if (!enemy) return;
    
    const dx = boat.x - enemy.x;
    const dy = boat.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    enemy.angle = calculateAngle(enemy.x, enemy.y, boat.x, boat.y);
    
    const prevX = enemy.x;
    const prevY = enemy.y;
    
    if (distance > 100) {
      enemy.x += (dx / distance) * enemy.speed;
      enemy.y += (dy / distance) * enemy.speed;
    }
    
    // Filtrar enemigos válidos para las colisiones
    const otherEnemies = state.enemyBoats.filter(e => e && e !== enemy);
    
    let collisionCount = 0;
    let pushX = 0;
    let pushY = 0;
    
    otherEnemies.forEach(other => {
      if (checkEnemyCollision(enemy, [other])) { // Pasar como array
        collisionCount++;
        const pushDx = enemy.x - other.x;
        const pushDy = enemy.y - other.y;
        const pushDist = Math.sqrt(pushDx * pushDx + pushDy * pushDy) || 1;
        
        pushX += (pushDx / pushDist) * 2;
        pushY += (pushDy / pushDist) * 2;
      }
    });
    
    if (collisionCount > 0) {
      enemy.x += pushX;
      enemy.y += pushY;
      
      let stillColliding = false;
      otherEnemies.forEach(other => {
        if (checkEnemyCollision(enemy, [other])) {
          stillColliding = true;
        }
      });
      
      if (stillColliding) {
        enemy.x = prevX;
        enemy.y = prevY;
      }
    }
    
    enemy.x = Math.max(-60, Math.min(canvasSize.width + 60, enemy.x));
    enemy.y = Math.max(-60, Math.min(canvasSize.height + 60, enemy.y));
  });
};

export const updatePlanes = (state, boat, config) => {
  // Asegurarse de que planes sea un array
  if (!state.planes) return;
  
  state.planes.forEach((plane) => {
    if (!plane) return;
    
    plane.y += plane.speed;
    
    plane.bombCooldown--;
    if (plane.bombCooldown <= 0 && Math.abs(plane.x - boat.x) < 150) {
      state.bombs.push({
        x: plane.x + plane.width / 2 - 6,
        y: plane.y + plane.height,
        width: 12,
        height: 12,
        speed: config.bombSpeed,
        type: 'plane'
      });
      plane.bombCooldown = plane.maxBombCooldown;
    }
  });

  state.planes = state.planes.filter(plane => plane && plane.y < 650);
};

export const updateBullets = (state, canvasSize) => {
  // Asegurarse de que bullets sea un array
  if (!state.bullets) return;
  
  state.bullets = state.bullets.filter(bullet => {
    if (!bullet) return false;
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    return bullet.x > -50 && bullet.x < canvasSize.width + 50 && 
           bullet.y > -50 && bullet.y < canvasSize.height + 50;
  });
};

export const updateBombs = (state, canvasSize) => {
  // Asegurarse de que bombs sea un array
  if (!state.bombs) return;
  
  state.bombs = state.bombs.filter(bomb => {
    if (!bomb) return false;
    bomb.y += bomb.speed;
    return bomb.y < canvasSize.height + 50;
  });
};

export const updatePowerUps = (state, boat) => {
  const activatedPowerUps = [];
  
  // Asegurarse de que powerUps sea un array
  if (!state.powerUps) return activatedPowerUps;
  
  state.powerUps = state.powerUps.filter(powerUp => {
    if (!powerUp) return false;
    if (checkRectCollision(boat, powerUp)) {
      activatedPowerUps.push(powerUp.type);
      return false;
    }
    return true;
  });
  
  return activatedPowerUps;
};

// Nueva función para verificar colisiones con el sistema de escudo de emergencia
export const checkCollisions = (state, config, addNotification) => {
  const boat = state.boat;
  
  // Solo verificar colisiones si no es invulnerable
  if (!boat.isInvulnerable) {
    // Verificar colisión con islas
    for (let island of [...(state.islands || []), ...(state.cannonIslands || [])]) {
      if (island && checkRectCollision(boat, island)) {
        const shieldNotification = activateEmergencyShield(state, config);
        if (shieldNotification) {
          addNotification(shieldNotification, 'info');
          return false; // No game over, se activó el escudo
        } else {
          return true; // Game over, no tenía escudo
        }
      }
    }

    // Verificar colisión con barcos enemigos
    for (let enemy of (state.enemyBoats || [])) {
      if (enemy && checkRectCollision(boat, enemy)) {
        const shieldNotification = activateEmergencyShield(state, config);
        if (shieldNotification) {
          addNotification(shieldNotification, 'info');
          return false; // No game over, se activó el escudo
        } else {
          return true; // Game over, no tenía escudo
        }
      }
    }

    // Verificar colisión con balas
    for (let bullet of (state.bullets || [])) {
      if (bullet && checkRectCollision(boat, bullet)) {
        const shieldNotification = activateEmergencyShield(state, config);
        if (shieldNotification) {
          addNotification(shieldNotification, 'info');
          return false; // No game over, se activó el escudo
        } else {
          return true; // Game over, no tenía escudo
        }
      }
    }

    // Verificar colisión con bombas
    for (let bomb of (state.bombs || [])) {
      if (bomb && checkRectCollision(boat, bomb)) {
        const shieldNotification = activateEmergencyShield(state, config);
        if (shieldNotification) {
          addNotification(shieldNotification, 'info');
          return false; // No game over, se activó el escudo
        } else {
          return true; // Game over, no tenía escudo
        }
      }
    }
  }
  
  return false; // No game over
};