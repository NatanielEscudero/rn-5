// src/systems/renderSystem.js
import { gameImages } from '../utils/imageLoader';

// Agrega al inicio del renderSystem.js
let debugLogged = false;

export const drawPlayerBoat = (ctx, boat) => {
  // Debug una sola vez
  if (!debugLogged) {
    console.log('🎨 RenderSystem - Estado de imágenes:', {
      playerBoat: !!gameImages.playerBoat,
      normalIsland: !!gameImages.normalIsland,
      cannonIsland: !!gameImages.cannonIsland,
      enemyBoat: !!gameImages.enemyBoat,
      plane: !!gameImages.plane,
      powerUp: !!gameImages.powerUp,
      bullet: !!gameImages.bullet,
      bomb: !!gameImages.bomb
    });
    debugLogged = true;
  }

  if (gameImages.playerBoat) {
    console.log('🚤 Dibujando barco con imagen');
    ctx.save();
    ctx.translate(boat.x + boat.width / 2, boat.y + boat.height / 2);
    ctx.rotate((boat.angle * Math.PI) / 180);
    ctx.drawImage(
      gameImages.playerBoat,
      -boat.width / 2,
      -boat.height / 2,
      boat.width,
      boat.height
    );
    ctx.restore();
  } else {
    console.log('🚤 Dibujando barco con fallback');
    // Fallback a tu código original
    ctx.save();
    ctx.translate(boat.x + boat.width / 2, boat.y + boat.height / 2);
    ctx.rotate((boat.angle * Math.PI) / 180);
    
    ctx.fillStyle = '#1E90FF';
    ctx.fillRect(-boat.width / 2, -boat.height / 2, boat.width, boat.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-boat.width / 2 + 5, -boat.height / 2 + 5, boat.width - 10, 15);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-3, -boat.height / 2 - 25, 6, 30);
    
    ctx.restore();
  }
};

export const drawNormalIsland = (ctx, island) => {
  if (gameImages.normalIsland) {
    ctx.drawImage(
      gameImages.normalIsland,
      island.x,
      island.y,
      island.width,
      island.height
    );
  } else {
    // Fallback a tu código original
    ctx.fillStyle = '#228B22';
    ctx.fillRect(island.x, island.y, island.width, island.height);
    
    ctx.fillStyle = '#F4A460';
    ctx.fillRect(island.x + 5, island.y + 5, island.width - 10, 10);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(island.x + island.width/2 - 2, island.y + 10, 4, 15);
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(island.x + island.width/2, island.y + 8, 8, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const drawCannonIsland = (ctx, island) => {
  if (gameImages.cannonIsland) {
    ctx.drawImage(
      gameImages.cannonIsland,
      island.x,
      island.y,
      island.width,
      island.height
    );
  } else {
    // Fallback a tu código original
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(island.x, island.y, island.width, island.height);
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(island.x + island.width/2 - 15, island.y + 10, 30, 10);
    ctx.fillRect(island.x + island.width/2 - 5, island.y, 10, 15);
    
    ctx.fillStyle = '#666666';
    ctx.fillRect(island.x + 10, island.y + 25, island.width - 20, 10);
  }
};

export const drawEnemyBoat = (ctx, enemy) => {
  if (gameImages.enemyBoat) {
    ctx.save();
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    ctx.rotate((enemy.angle * Math.PI) / 180);
    ctx.drawImage(
      gameImages.enemyBoat,
      -enemy.width / 2,
      -enemy.height / 2,
      enemy.width,
      enemy.height
    );
    ctx.restore();
  } else {
    // Fallback a tu código original
    ctx.save();
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    ctx.rotate((enemy.angle * Math.PI) / 180);
    
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
    
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(-enemy.width / 2 + 5, -enemy.height / 2 + 5, enemy.width - 10, 12);
    
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(enemy.width / 2 - 8, -enemy.height / 4, 8, enemy.height / 2);
    
    ctx.restore();
  }
};

export const drawPlane = (ctx, plane) => {
  if (gameImages.plane) {
    ctx.save();
    ctx.translate(plane.x + plane.width / 2, plane.y + plane.height / 2);
    
    // Invertir si va hacia la izquierda
    if (plane.direction === -1) {
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(
      gameImages.plane,
      -plane.width / 2,
      -plane.height / 2,
      plane.width,
      plane.height
    );
    ctx.restore();
  } else {
    // Fallback a tu código original
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(plane.x, plane.y, plane.width, plane.height);
    
    ctx.fillRect(plane.x - 8, plane.y + 8, 8, 4);
    ctx.fillRect(plane.x + plane.width, plane.y + 8, 8, 4);
    
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(plane.x + 10, plane.y + 5, 8, 6);
  }
};

export const drawPowerUp = (ctx, powerUp) => {
  if (gameImages.powerUp) {
    ctx.drawImage(
      gameImages.powerUp,
      powerUp.x,
      powerUp.y,
      powerUp.width,
      powerUp.height
    );
  } else {
    // Fallback a tu código original
    ctx.save();
    
    switch(powerUp.type) {
      case 'shield':
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2 - 2, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case 'disableEnemies':
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/4, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      default:
        // Caso por defecto para cualquier tipo de power-up no manejado
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
};

export const drawShield = (ctx, boat) => {
  ctx.save();
  
  if (boat.isInvulnerable) {
    // Escudo activo (invulnerabilidad) - efecto más visible
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    ctx.arc(boat.x + boat.width/2, boat.y + boat.height/2, Math.max(boat.width, boat.height) + 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Efecto de brillo adicional
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.arc(boat.x + boat.width/2, boat.y + boat.height/2, Math.max(boat.width, boat.height) + 18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (boat.hasEmergencyShield) {
    // Escudo disponible pero no activo - efecto más sutil
    ctx.strokeStyle = '#0088FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.arc(boat.x + boat.width/2, boat.y + boat.height/2, Math.max(boat.width, boat.height) + 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();
};

export const drawBoatTrail = (ctx, boat) => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  const angleInRadians = (boat.angle * Math.PI) / 180;
  for (let i = 0; i < 3; i++) {
    const trailX = boat.x - Math.sin(angleInRadians) * (20 + i * 15);
    const trailY = boat.y + Math.cos(angleInRadians) * (20 + i * 15);
    const size = 15 - i * 3;
    ctx.fillRect(trailX - size/2, trailY - size/4, size, size/2);
  }
};

// Función adicional para proyectiles
export const drawProjectiles = (ctx, bullets, bombs) => {
  // Dibujar balas
  bullets.forEach(bullet => {
    if (gameImages.bullet) {
      ctx.drawImage(gameImages.bullet, bullet.x, bullet.y, bullet.width, bullet.height);
    } else {
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  });
  
  // Dibujar bombas
  bombs.forEach(bomb => {
    if (gameImages.bomb) {
      ctx.drawImage(gameImages.bomb, bomb.x, bomb.y, bomb.width, bomb.height);
    } else {
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(bomb.x, bomb.y, bomb.width, bomb.height);
    }
  });
};