import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { supabase } from "../config/supabase"; // solo para resetPasswordForEmail
import "../styles/home.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { signIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
  const res = await signIn({ email: email.trim(), password });
  if (res?.error) throw res.error;

      // Si signIn tuvo éxito, redirigimos al dashboard
      setMessage('✅ ¡Inicio de sesión exitoso!');
      setTimeout(() => navigate('/dashboard'), 700);

    } catch (err) {
      console.error('❌ Error en login:', err);
      let errorMessage = err.message || 'Error en el inicio de sesión';
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      }
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para recuperar contraseña
  const handlePasswordReset = async () => {
    if (!email) {
      setMessage("❌ Ingresa tu email para recuperar la contraseña");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setMessage("✅ Email de recuperación enviado. Revisa tu bandeja de entrada.");
      
    } catch (error) {
      console.error('❌ Error al enviar email de recuperación:', error);
      setMessage(`❌ Error al enviar email de recuperación`);
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
          
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
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
              ← Volver
            </button>
          </div>
          
          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="auth-links">
            <p>
              ¿No tienes cuenta?{" "}
              <span 
                className="link" 
                onClick={() => navigate("/register")}
              >
                Regístrate aquí
              </span>
            </p>
            
            <p>
              <span 
                className="link" 
                onClick={handlePasswordReset}
              >
                ¿Olvidaste tu contraseña?
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}