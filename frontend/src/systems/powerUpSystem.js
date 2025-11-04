// src/systems/powerUpSystem.js
export const activatePowerUp = (type, state, config) => {
  const notifications = [];
  
  // Asegurarse de que los arrays existan
  if (!state.enemyBoats) state.enemyBoats = [];
  if (!state.disabledEnemies) state.disabledEnemies = [];
  
  switch(type) {
    case 'shield':
      // Permitir múltiples escudos (podemos limitar a un máximo si queremos)
      state.boat.hasEmergencyShield = true;
      notifications.push('¡Escudo de emergencia obtenido!');
      break;
      
    case 'disableEnemies':
      const disabledCount = state.enemyBoats.length;
      
      // Filtrar solo enemigos válidos
      state.enemyBoats.forEach(enemy => {
        if (enemy) {
          state.disabledEnemies.push({
            data: enemy,
            timer: config.enemyDisableDuration
          });
        }
      });
      
      state.enemyBoats = [];
      if (disabledCount > 0) {
        notifications.push(`¡${disabledCount} enemigos desactivados!`);
      }
      break;
      
    default:
      break;
  }
  
  return notifications;
};

// Nueva función para activar el escudo de emergencia cuando recibes daño
export const activateEmergencyShield = (state, config) => {
  if (state.boat.hasEmergencyShield && !state.boat.isInvulnerable) {
    state.boat.hasEmergencyShield = false; // Se usa el escudo
    state.boat.isInvulnerable = true;
    state.boat.invulnerabilityTimer = config.invulnerabilityDuration;
    return '¡Escudo de emergencia activado! Eres invulnerable por unos segundos';
  }
  return null;
};