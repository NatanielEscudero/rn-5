import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import "../styles/home.css";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Buscar usuario por email o username
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, password')
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .single();

      if (error || !user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña (sin hash por ahora)
      if (user.password !== password) {
        throw new Error('Contraseña incorrecta');
      }

      // Guardar sesión en localStorage
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email
      };
      localStorage.setItem('user', JSON.stringify(userData));

      setMessage("✅ ¡Inicio de sesión exitoso!");
      setTimeout(() => navigate("/dashboard"), 1000);

    } catch (error) {
      console.error('Error en login:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="register-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/imagenes/terraria.gif)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="register-form-wrapper">
        <form className="register-form" onSubmit={handleLogin}>
          <h2>Iniciar Sesión</h2>
          
          <input
            type="text"
            placeholder="Email o Nombre de Usuario"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          
          <div className="form-buttons">
            <button 
              type="submit" 
              className="retro-btn register-btn"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
            
            <button
              type="button"
              className="retro-btn back-btn"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Volver
            </button>
          </div>
          
          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="login-link">
            <p>¿No tienes cuenta? <span onClick={() => navigate("/register")}>Regístrate aquí</span></p>
          </div>
        </form>
      </div>
    </div>
  );
}