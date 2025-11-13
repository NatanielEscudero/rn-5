// src/components/Game.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/game.css';
import { supabase } from '../config/supabase';
import { supabaseGameService } from '../services/supabaseGameService';

// Importar sistemas modularizados
import { config, baseSpawnRates, canvasBaseSize, visualSizes } from '../utils/gameConfig';
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
import { drawHitboxes } from '../systems/renderSystem';
import { loadAllImages } from '../utils/imageLoader';

const Game = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  // Canvas SIEMPRE es 1000x750, lo que cambia es la escala CSS
  const [canvasSize] = useState({ 
    width: canvasBaseSize.width, 
    height: canvasBaseSize.height 
  });
  const [canvasScale, setCanvasScale] = useState(1);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);

  // Ref para evitar guardar la puntuación dos veces en el mismo evento
  const savingScoreRef = useRef(false);

  // 🔊 SFX disparo y música de fondo
  const cannonSfxRef = useRef(null);
  const bgMusicRef = useRef(null);

// Reemplaza el useEffect de detección de móviles con este:
useEffect(() => {
  const checkMobile = () => {
    // Método más confiable para detectar móviles
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detección por User Agent
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Detección por touch
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detección por tamaño de pantalla
    const isSmallScreen = window.innerWidth <= 768;
    
    // Detección por orientación
    const isMobile = isMobileUserAgent || (hasTouch && isSmallScreen);
    
    console.log('📱 Detección móvil:', {
      userAgent: userAgent,
      isMobileUserAgent,
      hasTouch,
      maxTouchPoints: navigator.maxTouchPoints,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      isSmallScreen,
      finalDecision: isMobile
    });
    
    setIsMobile(isMobile);
  };

  // Verificar inmediatamente
  checkMobile();
  
  // También verificar después de un delay por si el DOM no está listo
  const timeoutId = setTimeout(checkMobile, 1000);
  
  // Event listeners
  window.addEventListener('resize', checkMobile);
  window.addEventListener('orientationchange', checkMobile);
  window.addEventListener('load', checkMobile);

  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', checkMobile);
    window.removeEventListener('orientationchange', checkMobile);
    window.removeEventListener('load', checkMobile);
  };
}, []);

  // Control táctil - Girar izquierda
  const handleTouchLeft = () => {
    const state = gameState.current;
    state.keys.left = true;
    state.keys.right = false;
  };

  // Control táctil - Girar derecha  
  const handleTouchRight = () => {
    const state = gameState.current;
    state.keys.right = true;
    state.keys.left = false;
  };

  // Liberar controles táctiles
  const handleTouchEnd = () => {
    const state = gameState.current;
    state.keys.left = false;
    state.keys.right = false;
  };

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
      width: visualSizes.playerBoat.width,
      height: visualSizes.playerBoat.height, 
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

  // Calcular escala responsiva del canvas (se mantiene 1000x750, solo se escala visualmente)
  useEffect(() => {
    const updateCanvasScale = () => {
      const container = document.querySelector('.canvas-container');
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calcular escala basada en aspecto ratio
        const scaleByWidth = containerWidth / canvasBaseSize.width;
        const scaleByHeight = containerHeight / canvasBaseSize.height;
        
        // Usar la escala más pequeña para que quepa completo
        const scale = Math.min(scaleByWidth, scaleByHeight, 1);
        
        setCanvasScale(scale);
      }
    };

    updateCanvasScale();
    window.addEventListener('resize', updateCanvasScale);
    window.addEventListener('orientationchange', updateCanvasScale);

    return () => {
      window.removeEventListener('resize', updateCanvasScale);
      window.removeEventListener('orientationchange', updateCanvasScale);
    };
  }, []);

  // Control de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = gameState.current;
      // evitar toggles si el foco está en un input/textarea
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch(e.key) {
        case 'ArrowLeft':
          state.keys.left = true;
          break;
        case 'ArrowRight':
          state.keys.right = true;
          break;
        case 'h':
        case 'H':
          // alternar hitboxes
          setShowHitboxes(s => !s);
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

  

  // Game loop - CORREGIDO
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Función para guardar puntuación (definida dentro del useEffect para evitar dependencias inestables)
    const saveScore = async (finalScore) => {
      if (!user) {
        console.log('Usuario no autenticado, no se guarda puntuación');
        return;
      }

      if (scoreSaved || savingScoreRef.current) {
        console.log('Puntuación ya guardada o guardando actualmente');
        return;
      }

      // marcar inmediatamente para evitar duplicados concurrentes
      savingScoreRef.current = true;

      try {
        console.log('💾 Guardando puntuación:', finalScore);
        await supabaseGameService.saveScore(user.id, {
          score: finalScore,
          duration: Math.floor(gameState.current.frameCount / 60),
          gameName: 'esquiva_islas'
        });
        setScoreSaved(true);
        addNotification('🏆 Puntuación guardada en el ranking', 'info');
      } catch (error) {
        console.error('Error guardando puntuación:', error);
        addNotification('❌ Error guardando puntuación', 'danger');
        // Permitir reintento si hubo error
        savingScoreRef.current = false;
      }
    };

    // Mover checkEnemyUnlocks dentro del useEffect
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

    // Mover updateGame dentro del useEffect
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
      if (shouldGameOver && !gameOver) { // ← CORREGIDO: solo si no está ya en gameOver
        setGameOver(true);
        // Guardar puntuación cuando termina el juego - SOLO UNA VEZ
        saveScore(score);
      }
      
      if (frameCount % 10 === 0) {
        setScore(prev => prev + 1);
      }
    };

    // Mover renderGame dentro del useEffect
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
      // Overlay de debugging: hitboxes
      if (showHitboxes) {
        drawHitboxes(ctx, state);
      }
    };

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
  }, [gameStarted, gameOver, score, canvasSize, user, scoreSaved, showHitboxes]); // ← AGREGAR DEPENDENCIAS

  const startGame = () => {
    if (!imagesLoaded) {
      addNotification('Espera a que carguen las imágenes...', 'warning');
      return;
    }

    // 🔊 Crear/desbloquear SFX disparo (si todavía no existe)
    if (!cannonSfxRef.current) {
      cannonSfxRef.current = new Audio(`${process.env.PUBLIC_URL}/sounds/cannon.mp3`);
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
      bgMusicRef.current = new Audio(`${process.env.PUBLIC_URL}/sounds/background.mp3`);
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
    setScoreSaved(false); // ← RESETEAR: permitir guardar score nuevamente
  // Reiniciar flag de guardado atómico
  savingScoreRef.current = false;
    setNotifications([]);
    
    // CORRECCIÓN: Actualizar las propiedades sin perder la referencia
    const state = gameState.current;
    
    // Resetear el barco
    state.boat.x = canvasSize.width / 2;
    state.boat.y = canvasSize.height - 100;
    state.boat.width = 50;
    state.boat.height = 75;
    state.boat.angle = 0;
    state.boat.speed = 4;
    state.boat.rotationSpeed = 4;
    state.boat.hasEmergencyShield = false;
    state.boat.isInvulnerable = false;
    state.boat.invulnerabilityTimer = 0;
    
    // Resetear arrays
    state.islands = [];
    state.cannonIslands = [];
    state.enemyBoats = [];
    state.planes = [];
    state.bullets = [];
    state.bombs = [];
    state.powerUps = [];
    
    // Resetear contadores
    state.frameCount = 0;
    state.lastIslandSpawn = 0;
    state.lastCannonIslandSpawn = 0;
    state.lastEnemySpawn = 0;
    state.lastPlaneSpawn = 0;
    state.lastPowerUpSpawn = 0;
    
    // Resetear controles
    state.keys.left = false;
    state.keys.right = false;
    
    // Resetear unlocks
    state.cannonIslandsUnlocked = false;
    state.enemyBoatsUnlocked = false;
    state.planesUnlocked = false;
    
    // Resetear spawn rates
    state.currentSpawnRates = { ...baseSpawnRates };
    state.disabledEnemies = [];
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
          {isMobile && <p>📱 O usa los botones en pantalla</p>}
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
          width={canvasBaseSize.width}
          height={canvasBaseSize.height}
          className="game-canvas"
          tabIndex="0"
          style={{
            transform: `scale(${canvasScale})`,
            transformOrigin: 'top center',
            imageRendering: 'pixelated'
          }}
        />
      </div>

      {/* Controles táctiles para móviles - MEJORADO */}
      {isMobile && gameStarted && !gameOver && (
        <>
          {console.log('🎮 Mostrando controles táctiles - Móvil detectado')}
          <div className="touch-controls">
            <div 
              className="touch-btn left"
              onTouchStart={handleTouchLeft}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchLeft}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              ←
            </div>
            <div 
              className="touch-btn right"
              onTouchStart={handleTouchRight}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchRight}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              →
            </div>
          </div>
        </>
      )}

      {/* Modal de Game Over */}
      {gameOver && (
        <div className="game-over-modal">
          <div className="game-over-content">
            <h2>💀 ¡Juego Terminado! 💀</h2>
            <p>Puntuación final: {score}</p>
            {user ? (
              <p>✅ Puntuación {scoreSaved ? 'guardada' : 'guardándose...'} en el ranking</p>
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