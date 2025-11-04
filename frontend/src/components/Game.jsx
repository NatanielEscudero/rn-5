// src/components/Game.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/game.css';

// Importar sistemas modularizados
import { config, baseSpawnRates, canvasBaseSize } from '../utils/gameConfig';
import { 
  adjustSpawnRates, 
  spawnIslands, 
  spawnCannonIslands, 
  spawnEnemies, 
  spawnPlanes, 
  spawnPowerUps 
} from '../systems/spawnSystem';
import { 
  updateBoat, 
  updateShield, 
  updateDisabledEnemies, 
  updateCannonIslands, 
  updateEnemies, 
  updatePlanes, 
  updateBullets, 
  updateBombs, 
  updatePowerUps,
  checkCollisions 
} from '../systems/updateSystem';
import { activatePowerUp } from '../systems/powerUpSystem';
import { 
  drawNormalIsland, 
  drawCannonIsland, 
  drawEnemyBoat, 
  drawPlane, 
  drawPlayerBoat, 
  drawPowerUp, 
  drawShield, 
  drawBoatTrail,
  drawProjectiles 
} from '../systems/renderSystem';
import { loadAllImages, gameImages } from '../utils/imageLoader'; // Nuevo import

const Game = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // Cambiado a false para cargar imágenes primero
  const [notifications, setNotifications] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ 
    width: canvasBaseSize.width, 
    height: canvasBaseSize.height 
  });

  // Cargar imágenes al montar el componente
  useEffect(() => {
    const loadGameImages = async () => {
      const success = await loadAllImages();
      setImagesLoaded(success);
      if (success) {
        addNotification('¡Imágenes cargadas! Listo para jugar', 'info');
      } else {
        addNotification('Error cargando imágenes. Usando gráficos básicos', 'warning');
      }
    };

    loadGameImages();
  }, []);

  // Sistema de notificaciones mejorado
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const newNotification = { 
      id, 
      message, 
      type, 
      timestamp: Date.now() 
    };
    
    setNotifications(prev => {
      const updated = [...prev, newNotification];
      return updated.slice(-3);
    });
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 2500);
  };

  // Estado del juego
  const gameState = useRef({
    boat: {
      x: canvasBaseSize.width / 2, 
      y: canvasBaseSize.height - 100, 
      width: 50,
      height: 75, 
      angle: 0, 
      speed: 4,
      rotationSpeed: 4,
      hasEmergencyShield: false,
      isInvulnerable: false,
      invulnerabilityTimer: 0
    },
    islands: [], cannonIslands: [], enemyBoats: [], planes: [], bullets: [], bombs: [], powerUps: [],
    frameCount: 0,
    lastIslandSpawn: 0, lastCannonIslandSpawn: 0, lastEnemySpawn: 0, lastPlaneSpawn: 0, lastPowerUpSpawn: 0,
    keys: { left: false, right: false },
    cannonIslandsUnlocked: false, enemyBoatsUnlocked: false, planesUnlocked: false,
    baseSpawnRates: baseSpawnRates, 
    currentSpawnRates: { ...baseSpawnRates },
    disabledEnemies: []
  });

  // Ajustar tamaño del canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.querySelector('.canvas-container');
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const targetHeight = Math.min(containerHeight * 0.9, canvasBaseSize.height);
        const targetWidth = (targetHeight * canvasBaseSize.width) / canvasBaseSize.height;
        
        const finalWidth = Math.min(targetWidth, containerWidth * 0.95);
        const finalHeight = (finalWidth * canvasBaseSize.height) / canvasBaseSize.width;
        
        setCanvasSize({
          width: finalWidth,
          height: finalHeight
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Control de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = gameState.current;
      switch(e.key) {
        case 'ArrowLeft':
          state.keys.left = true;
          break;
        case 'ArrowRight':
          state.keys.right = true;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      const state = gameState.current;
      switch(e.key) {
        case 'ArrowLeft':
          state.keys.left = false;
          break;
        case 'ArrowRight':
          state.keys.right = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const checkEnemyUnlocks = () => {
    const state = gameState.current;
    
    if (!state.cannonIslandsUnlocked && score >= config.cannonIslandSpawnScore) {
      state.cannonIslandsUnlocked = true;
      addNotification('¡Islas con cañón apareciendo!', 'warning');
    }
    
    if (!state.enemyBoatsUnlocked && score >= config.enemySpawnScore) {
      state.enemyBoatsUnlocked = true;
      addNotification('¡Barcos perseguidores!', 'danger');
    }
    
    if (!state.planesUnlocked && score >= config.planeSpawnScore) {
      state.planesUnlocked = true;
      addNotification('¡Aviones bombardeadores!', 'danger');
    }
  };

  const updateGame = () => {
    const state = gameState.current;
    const frameCount = state.frameCount;
    
    updateBoat(state, canvasSize);
    
    const shieldNotifications = updateShield(state, config);
    shieldNotifications.forEach(notification => addNotification(notification, 'warning'));
    
    const enemyNotifications = updateDisabledEnemies(state);
    enemyNotifications.forEach(notification => addNotification(notification, 'danger'));
    
    adjustSpawnRates(state);
    
    spawnIslands(state, frameCount, canvasSize);
    spawnPowerUps(state, frameCount, canvasSize);
    
    checkEnemyUnlocks();
    
    if (state.cannonIslandsUnlocked) {
      spawnCannonIslands(state, frameCount, canvasSize);
      updateCannonIslands(state, state.boat, config);
    }
    
    if (state.enemyBoatsUnlocked) {
      spawnEnemies(state, frameCount, canvasSize, config);
      updateEnemies(state, state.boat, canvasSize);
    }
    
    if (state.planesUnlocked) {
      spawnPlanes(state, frameCount, canvasSize);
      updatePlanes(state, state.boat, config);
    }
    
    updateBullets(state, canvasSize);
    updateBombs(state, canvasSize);
    
    const activatedPowerUps = updatePowerUps(state, state.boat);
    activatedPowerUps.forEach(powerUpType => {
      const powerUpNotifications = activatePowerUp(powerUpType, state, config);
      powerUpNotifications.forEach(notification => addNotification(notification, 'info'));
    });
    
    const shouldGameOver = checkCollisions(state, config, addNotification);
    if (shouldGameOver) {
      setGameOver(true);
    }
    
    if (frameCount % 10 === 0) {
      setScore(prev => prev + 1);
    }
  };

  const renderGame = (ctx) => {
    const state = gameState.current;

    // Limpiar canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Dibujar elementos con imágenes
    state.powerUps.forEach(powerUp => drawPowerUp(ctx, powerUp));
    state.islands.forEach(island => drawNormalIsland(ctx, island));
    state.cannonIslands.forEach(island => drawCannonIsland(ctx, island));
    state.enemyBoats.forEach(enemy => drawEnemyBoat(ctx, enemy));
    state.planes.forEach(plane => drawPlane(ctx, plane));

    // Dibujar proyectiles con imágenes
    drawProjectiles(ctx, state.bullets, state.bombs);

    // Dibujar jugador y efectos
    drawPlayerBoat(ctx, state.boat);
    drawShield(ctx, state.boat);
    drawBoatTrail(ctx, state.boat);
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const gameLoop = () => {
      gameState.current.frameCount++;
      updateGame();
      renderGame(ctx);
      
      if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, score, canvasSize]);

  const startGame = () => {
    if (!imagesLoaded) {
      addNotification('Espera a que carguen las imágenes...', 'warning');
      return;
    }

    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setNotifications([]);
    
    gameState.current = {
      boat: {
        x: canvasSize.width / 2, 
        y: canvasSize.height - 100, 
        width: 50, 
        height: 75, 
        angle: 0, 
        speed: 4, 
        rotationSpeed: 4,
        hasEmergencyShield: false,
        isInvulnerable: false,
        invulnerabilityTimer: 0
      },
      islands: [], 
      cannonIslands: [], 
      enemyBoats: [], 
      planes: [], 
      bullets: [], 
      bombs: [], 
      powerUps: [],
      frameCount: 0,
      lastIslandSpawn: 0, 
      lastCannonIslandSpawn: 0, 
      lastEnemySpawn: 0, 
      lastPlaneSpawn: 0, 
      lastPowerUpSpawn: 0,
      keys: { left: false, right: false },
      cannonIslandsUnlocked: false, 
      enemyBoatsUnlocked: false, 
      planesUnlocked: false,
      baseSpawnRates: baseSpawnRates, 
      currentSpawnRates: { ...baseSpawnRates },
      disabledEnemies: []
    };
  };

  // Pantalla de inicio
  if (!gameStarted) {
    return (
      <div className="game-container">
        <div className="game-start-screen">
          <h1>🌊 Esquiva Islas 🏝️</h1>
          <p>🚤 Usa las flechas ← → para girar</p>
          <p>🎯 Esquiva islas y enemigos</p>
          <p>🛡️ Escudo de emergencia: Te salva una vez del daño</p>
          <p>⚡ Desactiva enemigos: Congela barcos perseguidores</p>
          <p>🏹 Islas con cañón a los {config.cannonIslandSpawnScore} puntos</p>
          <p>⚡ Barcos perseguidores a los {config.enemySpawnScore} puntos</p>
          <p>✈️ Aviones bombardeadores a los {config.planeSpawnScore} puntos</p>
          
          <div className="loading-status">
            {!imagesLoaded ? (
              <p>🔄 Cargando imágenes...</p>
            ) : (
              <p>✅ ¡Imágenes listas!</p>
            )}
          </div>
          
          <button 
            className="retro-btn" 
            onClick={startGame}
            disabled={!imagesLoaded}
          >
            {imagesLoaded ? '🎮 Comenzar Juego' : '⏳ Cargando...'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Notificaciones en la parte superior */}
      <div className="notifications-top">
        {notifications.map((notification, index) => (
          <div 
            key={notification.id} 
            className={`notification-top ${notification.type}`}
            style={{ top: `${60 + index * 50}px` }}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="game-ui">
        <div className="score">Puntuación: {score}</div>
        
        <div className="enemy-indicators">
          {gameState.current.cannonIslandsUnlocked && (
            <div className="enemy-indicator cannon">Islas con Cañón</div>
          )}
          {gameState.current.enemyBoatsUnlocked && (
            <div className="enemy-indicator enemy">Barcos Perseguidores</div>
          )}
          {gameState.current.planesUnlocked && (
            <div className="enemy-indicator plane">Aviones Bombarderos</div>
          )}
        </div>

        {gameState.current.boat.hasEmergencyShield && !gameState.current.boat.isInvulnerable && (
          <div className="shield-indicator available">🛡️ Escudo listo</div>
        )}
        
        {gameState.current.boat.isInvulnerable && (
          <div className="shield-indicator active">
            ✨ INVULNERABLE ({Math.ceil(gameState.current.boat.invulnerabilityTimer / 60)}s)
          </div>
        )}
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="game-canvas"
          tabIndex="0"
        />
      </div>

      {/* Modal de Game Over */}
      {gameOver && (
        <div className="game-over-modal">
          <div className="game-over-content">
            <h2>💀 ¡Juego Terminado! 💀</h2>
            <p>Puntuación final: {score}</p>
            <button className="retro-btn" onClick={startGame}>
              🔄 Jugar de Nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;