import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabaseGameService } from "../services/supabaseGameService";
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

  // Obtener usuario del localStorage al cargar el dashboard
  useEffect(() => {
    getCurrentUser();
  }, []);

  // Obtener estadísticas cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error getting user:', err);
      setError('Error al cargar información del usuario');
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setUserStats({
          highestScore: 0,
          totalGames: 0,
          averageScore: 0,
          lastScores: []
        });
        return;
      }

      // Usar el user.id numérico de tu base de datos
      const stats = await supabaseGameService.getUserStats(user.id);
      setUserStats(stats);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setUserStats({
      highestScore: 0,
      totalGames: 0,
      averageScore: 0,
      lastScores: []
    });
  };

  // Función para renderizar estadísticas de usuario invitado
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

  // Función para renderizar estadísticas del usuario autenticado
  const renderUserStats = () => (
    <div className="stats-container">
      <h2>Tus Estadísticas</h2>
      
      {/* Información del usuario */}
      <div className="user-info">
        <span>Jugando como: {user?.username || user?.email}</span>
        <button 
          onClick={handleLogout} 
          className="logout-btn"
          title="Cerrar sesión"
        >
          🚪
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{userStats.highestScore}</div>
          <div className="stat-label">Puntuación Más Alta</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{userStats.totalGames}</div>
          <div className="stat-label">Partidas Jugadas</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{userStats.averageScore}</div>
          <div className="stat-label">Puntuación Promedio</div>
        </div>
      </div>

      {/* Últimas puntuaciones */}
      {userStats.lastScores.length > 0 ? (
        <div className="recent-scores">
          <h3>Últimas Puntuaciones</h3>
          <div className="scores-list">
            {userStats.lastScores.map((score, index) => (
              <div key={index} className="score-item">
                <span>Partida {index + 1}</span>
                <span className="score-value">{score} puntos</span>
              </div>
            ))}
          </div>
        </div>
      ) : userStats.totalGames === 0 && (
        <div className="no-scores">
          <p>🎯 ¡Juega tu primera partida para ver tus estadísticas!</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="loading">Cargando estadísticas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Fondo animado */}
      <img
        src="/imagenes/barco.gif"
        alt="Fondo barco"
        className="dashboard-background"
      />

      <div className="dashboard-content">
        <h1>¡Bienvenido al Dashboard!</h1>
        <p>Estás a bordo del barco, listo para jugar 🎮</p>

        {/* Mostrar estadísticas según el estado de autenticación */}
        {user ? renderUserStats() : renderGuestStats()}

        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        <div className="dashboard-buttons">
          <Link to="/games" className="btn retro-btn play-btn">
            Jugar
          </Link>
          <Link to="/" className="btn retro-btn back-btn">
            Volver al Inicio
          </Link>
          
          {/* Botón para actualizar estadísticas (solo para usuarios autenticados) */}
          {user && (
            <button 
              className="btn retro-btn refresh-btn"
              onClick={fetchUserStats}
              disabled={loading}
            >
              {loading ? 'Actualizando...' : '🔄 Actualizar'}
            </button>
          )}

          {/* Botón de logout para usuarios autenticados */}
          {user && (
            <button 
              className="btn retro-btn logout-btn-main"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}