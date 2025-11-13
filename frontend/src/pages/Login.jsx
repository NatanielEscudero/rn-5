import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import "../styles/home.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Usar autenticación nativa de Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("✅ Login exitoso:", data.user);
        
        // Obtener información adicional del usuario si es necesario
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.user.id)
          .single();

        // Guardar información básica en localStorage (opcional)
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: userProfile?.username || data.user.email.split('@')[0]
        };
        localStorage.setItem('user', JSON.stringify(userData));

        setMessage("✅ ¡Inicio de sesión exitoso!");
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Mensajes de error más amigables
      let errorMessage = "Error en el inicio de sesión";
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "Por favor confirma tu email antes de iniciar sesión";
      } else if (error.message.includes('Too many requests')) {
        errorMessage = "Demasiados intentos. Intenta más tarde";
      } else {
        errorMessage = error.message;
      }
      
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para login con Google
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setMessage("");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      setMessage(`❌ Error al iniciar sesión con Google`);
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