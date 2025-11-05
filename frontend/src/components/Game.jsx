// src/components/Game.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/game.css';
import { supabase } from '../config/supabase';
import { supabaseGameService } from '../services/supabaseGameService';

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
import { loadAllImages } from '../utils/imageLoader';

const Game = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ 
    width: canvasBaseSize.width, 
    height: canvasBaseSize.height 
  });
  const [user, setUser] = useState(null);

  // 🔊 SFX disparo y música de fondo
  const cannonSfxRef = useRef(null);
  const bgMusicRef = useRef(null);

  // Obtener usuario al cargar
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getCurrentUser();
  }, []);

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

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.src = "";
        bgMusicRef.current = null;
      }
      if (cannonSfxRef.current) {
        cannonSfxRef.current.pause();
        cannonSfxRef.current.src = "";
        cannonSfxRef.current = null;
      }
    };
  }, []);

  // Pausar música y sfx si termina la partida
  useEffect(() => {
    if (gameOver) {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
      if (cannonSfxRef.current) {
        cannonSfxRef.current.pause();
        cannonSfxRef.current.currentTime = 0;
      }
    }
  }, [gameOver]);

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

  // Función para guardar puntuación
  const saveScore = async (finalScore) => {
    if (!user) {
      console.log('Usuario no autenticado, no se guarda la puntuación');
      return;
    }

    try {
      await supabaseGameService.saveScore(user.id, {
        score: finalScore,
        duration: Math.floor(gameState.current.frameCount / 60), // Convertir frames a segundos
        gameName: 'esquiva_islas'
      });
      addNotification('🏆 Puntuación guardada en el ranking', 'info');
    } catch (error) {
      console.error('Error guardando puntuación:', error);
      addNotification('❌ Error guardando puntuación', 'danger');
    }
  };

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
      // 🔊 Disparo: saber si disparó y reproducir el SFX
      const cannonFired = updateCannonIslands(state, state.boat, config);
      if (cannonFired && cannonSfxRef.current) {
        cannonSfxRef.current.currentTime = 0;
        cannonSfxRef.current.play()
          .catch((e) => {
            console.warn("Play SFX rechazado:", e?.name, e?.message);
          });
      }
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
      // Guardar puntuación cuando termina el juego
      saveScore(score);
    }
    
    if (frameCount % 10 === 0) {
      setScore(prev => prev + 1);
    }
  };

  const renderGame = (ctx) => {
    const state = gameState.current;

    // LIMPIAR CANVAS - AHORA TRANSPARENTE PARA VER EL FONDO DE AGUA
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

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

    // 🔊 Crear/desbloquear SFX disparo (si todavía no existe)
    if (!cannonSfxRef.current) {
      cannonSfxRef.current = new Audio("sounds/cannon.mp3");
      cannonSfxRef.current.preload = "auto";
      cannonSfxRef.current.volume = 0.7;

      // desbloqueo por gesto
      cannonSfxRef.current.muted = true;
      cannonSfxRef.current.play()
        .then(() => {
          cannonSfxRef.current.pause();
          cannonSfxRef.current.currentTime = 0;
          cannonSfxRef.current.muted = false;
        })
        .catch((e) => {
          console.warn("No se pudo desbloquear SFX en startGame:", e);
        });

      cannonSfxRef.current.addEventListener("error", () => {
        console.error("No se pudo cargar sounds/cannon.mp3. Verificá que esté en public/sounds/");
      });
    }

    // 🎵 Crear/desbloquear Música de fondo (loop)
    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio("sounds/background.mp3");
      bgMusicRef.current.preload = "auto";
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.35;

      // desbloqueo por gesto
      bgMusicRef.current.muted = true;
      bgMusicRef.current.play()
        .then(() => {
          bgMusicRef.current.pause();
          bgMusicRef.current.currentTime = 0;
          bgMusicRef.current.muted = false;
        })
        .catch((e) => {
          console.warn("No se pudo desbloquear música en startGame:", e);
        });

      bgMusicRef.current.addEventListener("error", () => {
        console.error("No se pudo cargar sounds/background.mp3. Verificá que esté en public/sounds/");
      });
    }

    // Iniciar música (por si ya existía de una partida anterior)
    if (bgMusicRef.current) {
      try {
        bgMusicRef.current.currentTime = 0;
        bgMusicRef.current.play().catch((e) => {
          console.warn("Play música rechazado:", e?.name, e?.message);
        });
      } catch {}
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

  // Función para volver al dashboard (paramos música/SFX)
  const goToDashboard = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
    if (cannonSfxRef.current) {
      cannonSfxRef.current.pause();
      cannonSfxRef.current.currentTime = 0;
    }
    navigate('/dashboard');
  };

  // Pantalla de inicio
  if (!gameStarted) {
    return (
      <div className="game-container">
        {/* FONDO DE AGUA ANIMADO SOLO EN EL CONTENEDOR DEL CANVAS */}
        <div className="canvas-background-container">
          <img
            src="/imagenes/agua.gif"
            alt="Fondo agua animado"
            className="canvas-background"
          />
        </div>
        
        <div className="game-start-screen">
          <h1>🌊 Esquiva Islas 🏝️</h1>
          <p>🚤 Usa las flechas ← → para girar</p>
          <p>🎯 Esquiva islas y enemigos</p>
          <p>🛡️ Escudo de emergencia: Te salva una vez del daño</p>
          <p>⚡ Desactiva enemigos: Congela barcos perseguidores</p>
          <p>🏹 Islas con cañón a los {config.cannonIslandSpawnScore} puntos</p>
          <p>⚡ Barcos perseguidores a los {config.enemySpawnScore} puntos</p>
          <p>✈️ Aviones bombardeadores a los {config.planeSpawnScore} puntos</p>
          
          {/* Información del usuario */}
          <div className="user-game-info">
            {user ? (
              <p>✅ Jugando como: <strong>{user.user_metadata?.username || user.email}</strong></p>
            ) : (
              <p className="guest-warning">⚠️ Modo invitado - Las puntuaciones no se guardarán</p>
            )}
          </div>
          
          <div className="loading-status">
            {!imagesLoaded ? (
              <p>🔄 Cargando imágenes...</p>
            ) : (
              <p>✅ ¡Imágenes listas!</p>
            )}
          </div>
          
          <div className="start-screen-buttons">
            <button 
              className="retro-btn" 
              onClick={startGame}
              disabled={!imagesLoaded}
            >
              {imagesLoaded ? '🎮 Comenzar Juego' : '⏳ Cargando...'}
            </button>
            
            <button 
              className="retro-btn back-btn"
              onClick={goToDashboard}
            >
              🏠 Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* FONDO DE AGUA ANIMADO SOLO EN EL CONTENEDOR DEL CANVAS */}
      <div className="canvas-background-container">
        <img
          src="/imagenes/agua.gif"
          alt="Fondo agua animado"
          className="canvas-background"
        />
      </div>

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
            {user ? (
              <p>✅ Puntuación guardada en el ranking</p>
            ) : (
              <p>⚠️ Inicia sesión para guardar tus puntuaciones</p>
            )}
            
            <div className="game-over-buttons">
              <button className="retro-btn play-again-btn" onClick={startGame}>
                🔄 Jugar de Nuevo
              </button>
              
              <button 
                className="retro-btn dashboard-btn"
                onClick={goToDashboard}
              >
                🏠 Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;