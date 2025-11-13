// src/components/Dashboard.jsx
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabaseGameService } from "../services/supabaseGameService";
import { useAuth } from '../hooks/useAuth';
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

  const fetchUserStats = useCallback(async (userId) => {
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
  }, []);

  // Use the central AuthProvider: when `user` from context changes, fetch stats.
  // This avoids duplicating auth initialization logic here and prevents races.
  const { user: authUser } = useAuth();

  useEffect(() => {
    let mounted = true;

    const loadForUser = async () => {
      try {
        setLoading(true);
        setError(null);
        setStatsLoaded(false);

        if (!authUser) {
          // Guest
          setUser(null);
          setUserStats(getDefaultStats());
          setStatsLoaded(true);
          return;
        }

        // Prefer direct id from authUser
        const finalId = authUser.id || (authUser.user && authUser.user.id) || null;

        if (!finalId) {
          setUser(null);
          setUserStats(getDefaultStats());
          setStatsLoaded(true);
          return;
        }

        setUser(authUser);
        await fetchUserStats(finalId);
      } catch (err) {
        console.error('❌ Error cargando datos del usuario en Dashboard:', err);
        setError(err.message || 'Error al cargar datos');
        setUserStats(getDefaultStats());
        setStatsLoaded(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadForUser();

    return () => { mounted = false; };
  }, [authUser, fetchUserStats]);

  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      setLoading(true);
      const res = await signOut();
      if (res?.error) throw res.error;
      console.log('✅ Logout exitoso');
      // onAuthStateChange en el provider limpiará el estado
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
        </div>
      </div>
    </div>
  );
}