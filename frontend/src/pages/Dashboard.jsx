// src/components/Dashboard.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabaseGameService } from "../services/supabaseGameService";
import { supabase } from "../config/supabase";
import "./../styles/Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    highestScore: 0,
    totalGames: 0,
    averageScore: 0,
    lastScores: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsLoaded, setStatsLoaded] = useState(false);

  const getDefaultStats = () => ({
    highestScore: 0,
    totalGames: 0,
    averageScore: 0,
    lastScores: []
  });

  const fetchUserStats = async (userId = user?.id) => {
    try {
      setLoading(true);
      setError(null);
      setStatsLoaded(false);
      
      if (!userId) {
        console.log('ℹ️ Sin userId, usando estadísticas por defecto');
        setUserStats(getDefaultStats());
        setStatsLoaded(true);
        return;
      }

      console.log('📊 Cargando estadísticas para:', userId);
      const stats = await supabaseGameService.getUserStats(userId);
      console.log('✅ Estadísticas cargadas:', stats);
      
      setUserStats(stats);
      setStatsLoaded(true);
      
    } catch (err) {
      console.error('❌ Error cargando estadísticas:', err);
      setError(err.message || 'Error al cargar estadísticas');
      setUserStats(getDefaultStats());
      setStatsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);
        
        console.log('🔄 Inicializando autenticación...');

        // PRIMERO: Intentar recuperar del localStorage como fallback rápido
        const storedUser = localStorage.getItem('supabase_user');
        if (storedUser && isMounted) {
          const parsedUser = JSON.parse(storedUser);
          console.log('📦 Usuario encontrado en localStorage:', parsedUser.email);
          setUser(parsedUser);
        }

        // SEGUNDO: Verificar sesión con Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error de sesión:', sessionError);
          if (isMounted) {
            setError('Error de conexión con el servidor');
          }
        }

        if (session?.user && isMounted) {
          console.log('✅ Sesión activa encontrada:', session.user.email);
          setUser(session.user);
          // Guardar en localStorage para recuperación rápida
          localStorage.setItem('supabase_user', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username
          }));
          await fetchUserStats(session.user.id);
          return;
        }
        
        // TERCERO: Intentar obtener usuario directamente
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.log('⚠️ Error obteniendo usuario:', userError);
        }

        if (user && isMounted) {
          console.log('✅ Usuario obtenido:', user.email);
          setUser(user);
          localStorage.setItem('supabase_user', JSON.stringify({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username
          }));
          await fetchUserStats(user.id);
          return;
        }
        
        // CUARTO: Si no hay usuario, limpiar estado
        if (isMounted) {
          console.log('👤 Modo invitado');
          setUser(null);
          localStorage.removeItem('supabase_user');
          setStatsLoaded(true);
        }
        
      } catch (err) {
        console.error('❌ Error en inicialización de auth:', err);
        if (isMounted) {
          setError('Error inicializando autenticación');
          // Intentar recuperar de localStorage como último recurso
          const storedUser = localStorage.getItem('supabase_user');
          if (storedUser) {
            console.log('🆘 Recuperando usuario de localStorage...');
            setUser(JSON.parse(storedUser));
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Estado de auth cambiado:', event);
        
        if (!isMounted) return;

        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ Usuario inició sesión:', session.user.email);
            setUser(session.user);
            localStorage.setItem('supabase_user', JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              username: session.user.user_metadata?.username
            }));
            await fetchUserStats(session.user.id);
            break;

          case 'SIGNED_OUT':
            console.log('🚪 Usuario cerró sesión');
            setUser(null);
            setUserStats(getDefaultStats());
            localStorage.removeItem('supabase_user');
            setStatsLoaded(true);
            break;

          case 'USER_UPDATED':
            console.log('📝 Usuario actualizado');
            if (session?.user) {
              setUser(session.user);
              localStorage.setItem('supabase_user', JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                username: session.user.user_metadata?.username
              }));
            }
            break;

          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refrescado');
            break;

          default:
            console.log('🔔 Evento de auth:', event);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Solo se ejecuta una vez al montar

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('✅ Logout exitoso');
      // Los listeners de onAuthStateChange se encargarán de limpiar el estado
      
    } catch (err) {
      console.error('❌ Error durante logout:', err);
      setError('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  const renderGuestStats = () => (
    <div className="stats-container">
      <h2>💡 Inicia sesión para guardar tus puntuaciones</h2>
      <div className="guest-message">
        <p>Regístrate o inicia sesión para:</p>
        <ul>
          <li>✅ Guardar tus puntuaciones</li>
          <li>✅ Competir en el ranking global</li>
          <li>✅ Seguir tu progreso</li>
          <li>✅ Desbloquear logros</li>
        </ul>
        <div className="auth-buttons">
          <Link to="/login" className="btn retro-btn">
            Iniciar Sesión
          </Link>
          <Link to="/register" className="btn retro-btn">
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );

  const renderUserStats = () => (
    <div className="stats-container">
      <h2>🎯 Resumen de Estadísticas</h2>
      
      <div className="user-info">
        <span>Jugando como: <strong>{user?.user_metadata?.username || user?.email}</strong></span>
        <button 
          onClick={handleLogout} 
          className="logout-btn"
          title="Cerrar sesión"
          disabled={loading}
        >
          {loading ? '⏳' : '🚪'} Salir
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{userStats.highestScore.toLocaleString()}</div>
          <div className="stat-label">🏆 Puntuación Más Alta</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{userStats.totalGames}</div>
          <div className="stat-label">🎮 Partidas Jugadas</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{Math.round(userStats.averageScore).toLocaleString()}</div>
          <div className="stat-label">📊 Puntuación Promedio</div>
        </div>
      </div>

      {userStats.lastScores && userStats.lastScores.length > 0 ? (
        <div className="recent-scores-preview">
          <h3>📈 Últimas Puntuaciones</h3>
          <div className="scores-preview-list">
            {userStats.lastScores.slice(0, 3).map((score, index) => (
              <div key={index} className="score-preview-item">
                <span>Partida {index + 1}</span>
                <span className="score-value">{score.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
          <div className="view-more-scores">
            <Link to="/statistics" className="btn retro-btn view-all-btn">
              📊 Ver Estadísticas Completas
            </Link>
          </div>
        </div>
      ) : user && userStats.totalGames === 0 && (
        <div className="no-scores">
          <p>🎯 ¡Juega tu primera partida para ver tus estadísticas!</p>
          <Link to="/games" className="btn retro-btn play-btn">
            🎮 Jugar Ahora
          </Link>
        </div>
      )}
    </div>
  );

  if (loading && !statsLoaded) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="loading">
            <div>⏳ Cargando...</div>
            <div className="loading-details">
              {user ? 'Buscando tus estadísticas' : 'Verificando sesión'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <img
        src="/imagenes/barco.gif"
        alt="Fondo barco"
        className="dashboard-background"
      />

      <div className="dashboard-content">
        <h1>🚢 ¡Bienvenido al Dashboard!</h1>
        <p>Estás a bordo del barco, listo para jugar 🎮</p>

        {user ? renderUserStats() : renderGuestStats()}

        {error && (
          <div className="error-message">
            ⚠️ {error}
            <div className="error-actions">
              <button onClick={() => setError(null)} className="btn retro-btn">
                Ok
              </button>
              <button onClick={() => window.location.reload()} className="btn retro-btn">
                🔄 Recargar
              </button>
            </div>
          </div>
        )}

        <div className="dashboard-buttons">
          <Link to="/games" className="btn retro-btn play-btn">
            🎮 Jugar Ahora
          </Link>
          <Link to="/" className="btn retro-btn back-btn">
            🏠 Volver al Inicio
          </Link>
          
          {user && (
            <button 
              className="btn retro-btn refresh-btn"
              onClick={() => fetchUserStats(user.id)}
              disabled={loading}
            >
              {loading ? '⏳ Actualizando...' : '🔄 Actualizar'}
            </button>
          )}

          {/* Botón de debug para desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              className="btn retro-btn debug-btn"
              onClick={() => {
                console.log('🔍 Debug Info:', {
                  user,
                  userStats,
                  loading,
                  statsLoaded,
                  error,
                  localStorage: localStorage.getItem('supabase_user')
                });
              }}
            >
              🐛 Debug
            </button>
          )}
        </div>
      </div>
    </div>
  );
}