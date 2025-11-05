// src/components/Statistics.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import "./../styles/Statistics.css";

export default function Statistics() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    highestScore: 0,
    totalGames: 0,
    averageScore: 0,
    lastScores: []
  });
  const [allScores, setAllScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          await fetchUserStatistics(user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing user:', err);
        setError('Error al cargar usuario');
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const fetchUserStatistics = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener todas las puntuaciones
      const { data: scores, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllScores(scores || []);

      // Calcular estadísticas desde los datos
      if (scores && scores.length > 0) {
        const scoreValues = scores.map(s => s.score || 0);
        const highestScore = Math.max(...scoreValues);
        const totalGames = scores.length;
        const averageScore = Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scores.length);
        const lastScores = scoreValues.slice(0, 5);

        setUserStats({
          highestScore,
          totalGames,
          averageScore,
          lastScores
        });
      } else {
        setUserStats({
          highestScore: 0,
          totalGames: 0,
          averageScore: 0,
          lastScores: []
        });
      }

    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Error al cargar estadísticas completas');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="statistics-content">
          <div className="loading">⏳ Cargando estadísticas completas...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="statistics-container">
        <div className="statistics-content">
          <div className="guest-message">
            <h2>🔒 Acceso Restringido</h2>
            <p>Debes iniciar sesión para ver las estadísticas completas</p>
            <div className="auth-buttons">
              <Link to="/login" className="btn retro-btn">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn retro-btn">
                Registrarse
              </Link>
              <Link to="/dashboard" className="btn retro-btn">
                ← Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <img
        src="/imagenes/barco.gif"
        alt="Fondo barco"
        className="statistics-background"
      />

      <div className="statistics-content">
        <div className="statistics-header">
          <h1>📊 Estadísticas Completas</h1>
          <p>Historial detallado de todas tus partidas</p>
          <div className="user-info">
            <span>Jugador: <strong>{user?.user_metadata?.username || user?.email}</strong></span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
            <button onClick={() => setError(null)} className="close-error">×</button>
          </div>
        )}

        {/* Resumen de Estadísticas */}
        <div className="stats-summary">
          <h2>📈 Resumen General</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-value">{userStats.highestScore.toLocaleString()}</div>
              <div className="summary-label">Puntuación Más Alta</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{userStats.totalGames}</div>
              <div className="summary-label">Total Partidas</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{Math.round(userStats.averageScore).toLocaleString()}</div>
              <div className="summary-label">Promedio</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{allScores.length}</div>
              <div className="summary-label">Registros</div>
            </div>
          </div>
        </div>

        {/* Lista Completa de Puntuaciones */}
        <div className="scores-section">
          <h2>🎮 Historial de Partidas</h2>
          
          {allScores.length > 0 ? (
            <div className="scores-list-container">
              <div className="scores-list-header">
                <span>Fecha y Hora</span>
                <span>Puntuación</span>
                <span>Duración</span>
                <span>Juego</span>
              </div>
              <div className="scores-list">
                {allScores.map((score, index) => (
                  <div key={score.id || index} className="score-item">
                    <span className="score-date">{formatDate(score.created_at)}</span>
                    <span className="score-points">{score.score.toLocaleString()} pts</span>
                    <span className="score-duration">{score.duration || 0}s</span>
                    <span className="score-game">{score.game_name || 'esquiva_islas'}</span>
                  </div>
                ))}
              </div>
              <div className="scores-footer">
                <p>Mostrando {allScores.length} partidas</p>
              </div>
            </div>
          ) : (
            <div className="no-scores">
              <p>🎯 Aún no tienes partidas registradas</p>
              <Link to="/games" className="btn retro-btn play-btn">
                🎮 Jugar Mi Primera Partida
              </Link>
            </div>
          )}
        </div>

        {/* Botones de Navegación - SOLO UN BOTÓN DE DASHBOARD */}
        <div className="statistics-buttons">
          <Link to="/dashboard" className="btn retro-btn back-btn">
            ← Volver al Dashboard
          </Link>
          <Link to="/games" className="btn retro-btn play-btn">
            🎮 Jugar Otra Vez
          </Link>
          <button 
            className="btn retro-btn refresh-btn"
            onClick={() => fetchUserStatistics(user.id)}
            disabled={loading}
          >
            {loading ? '⏳ Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}