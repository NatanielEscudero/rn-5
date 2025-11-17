// src/utils/gameMath.js
// Funciones matemáticas y de colisión
import { hitboxSizes } from './gameConfig';

// Obtener hitbox real basado en tamaño visual y tipo de objeto
const getHitboxRect = (object) => {
  if (!object) return null;

  const type = object.type;
  const hitbox = (type && hitboxSizes[type]) || null;

  // Si no hay hitbox específico, usar el objeto completo
  if (!hitbox) {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height
    };
  }

  const offsetX = hitbox.offsetX || 0;
  const offsetY = hitbox.offsetY || 0;

  return {
    x: object.x + offsetX,
    y: object.y + offsetY,
    width: hitbox.width,
    height: hitbox.height
  };
};

export const checkRectCollision = (rect1, rect2) => {
  if (!rect1 || !rect2) return false;
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
};

// --- NUEVO: colisión elipse vs rectángulo ---

// ellipseRectCollision: la elipse es A, el rectángulo es B
const ellipseRectCollision = (ellipseRect, rect) => {
  if (!ellipseRect || !rect) return false;

  // Centro y radios de la elipse
  const centerX = ellipseRect.x + ellipseRect.width / 2;
  const centerY = ellipseRect.y + ellipseRect.height / 2;
  const radiusX = ellipseRect.width / 2;
  const radiusY = ellipseRect.height / 2;

  if (radiusX <= 0 || radiusY <= 0) return false;

  // Punto más cercano del rectángulo a la elipse
  const closestX = Math.max(rect.x, Math.min(centerX, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(centerY, rect.y + rect.height));

  const dx = closestX - centerX;
  const dy = closestY - centerY;

  const nx = dx / radiusX;
  const ny = dy / radiusY;

  // Ecuación de la elipse normalizada: x² + y² <= 1 → colisión
  return (nx * nx + ny * ny) <= 1;
};

// Colisión usando hitbox
export const checkHitboxCollision = (obj1, obj2) => {
  const hitbox1 = getHitboxRect(obj1);
  const hitbox2 = getHitboxRect(obj2);

  if (!hitbox1 || !hitbox2) return false;

  const isPlayer1 = obj1 && obj1.type === 'playerBoat';
  const isPlayer2 = obj2 && obj2.type === 'playerBoat';

  // Player (elipse) contra rectángulo normal
  if (isPlayer1 && !isPlayer2) {
    return ellipseRectCollision(hitbox1, hitbox2);
  }
  if (isPlayer2 && !isPlayer1) {
    return ellipseRectCollision(hitbox2, hitbox1);
  }

  // Si ambos son playerBoat (caso raro) o ninguno lo es → rect vs rect como antes
  return checkRectCollision(hitbox1, hitbox2);
};

export const checkSpawnCollision = (newObject, existingObjects, margin = 20) => {
  if (!existingObjects || !Array.isArray(existingObjects)) return false;
  
  for (let obj of existingObjects) {
    const newObjWithMargin = {
      x: newObject.x - margin,
      y: newObject.y - margin,
      width: newObject.width + margin * 2,
      height: newObject.height + margin * 2
    };
    
    const objWithMargin = {
      x: obj.x - margin,
      y: obj.y - margin,
      width: obj.width + margin * 2,
      height: obj.height + margin * 2
    };
    
    if (checkRectCollision(newObjWithMargin, objWithMargin)) {
      return true;
    }
  }
  return false;
};

export const checkEnemyCollision = (enemy, otherEnemies) => {
  // Verificar que otherEnemies sea un array iterable
  if (!otherEnemies || !Array.isArray(otherEnemies)) return false;
  
  for (let other of otherEnemies) {
    if (!other) continue; // Saltar si other es undefined
    
    const enemyWithMargin = {
      x: enemy.x - 10,
      y: enemy.y - 10,
      width: enemy.width + 20,
      height: enemy.height + 20
    };
    
    const otherWithMargin = {
      x: other.x - 10,
      y: other.y - 10,
      width: other.width + 20,
      height: other.height + 20
    };
    
    if (checkRectCollision(enemyWithMargin, otherWithMargin)) {
      return true;
    }
  }
  return false;
};

export const calculateDistance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

export const calculateAngle = (x1, y1, x2, y2) => {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
};