import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import "../styles/home.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validaciones
    if (password !== confirmPassword) {
      setMessage("❌ Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("❌ La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (!username.trim()) {
      setMessage("❌ El nombre de usuario es obligatorio");
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setMessage("❌ Email inválido");
      setLoading(false);
      return;
    }

    try {
      // 1. Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
            email: email.trim()
          }
        }
      });

      if (authError) {
        // Manejar errores específicos de Supabase Auth
        if (authError.message.includes('User already registered')) {
          throw new Error('Este email ya está registrado');
        } else if (authError.message.includes('Password should be at least')) {
          throw new Error('La contraseña es demasiado débil');
        } else if (authError.message.includes('Invalid email')) {
          throw new Error('Email inválido');
        }
        throw authError;
      }

      if (authData.user) {
        console.log("✅ Usuario registrado en Auth:", authData.user);
        
        // 2. Crear perfil en tabla users (si existe)
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                username: username.trim(),
                email: email.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);

          if (profileError) {
            console.warn('⚠️ No se pudo crear perfil en tabla users:', profileError);
            // No lanzar error porque el usuario ya está registrado en Auth
          } else {
            console.log('✅ Perfil creado en tabla users');
          }
        } catch (profileError) {
          console.warn('⚠️ Error creando perfil:', profileError);
          // Continuar aunque falle la creación del perfil
        }

        // 3. Guardar en localStorage
        const userData = {
          id: authData.user.id,
          username: username.trim(),
          email: email.trim()
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // 4. Mostrar mensaje según si requiere confirmación de email
        if (authData.session) {
          // Usuario autenticado inmediatamente (email confirmado automáticamente en algunos casos)
          setMessage("✅ ¡Registro exitoso! Redirigiendo...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        } else {
          // Requiere confirmación de email
          setMessage("✅ ¡Registro exitoso! Por favor revisa tu email para confirmar tu cuenta.");
          setTimeout(() => {
            navigate("/login");
          }, 4000);
        }
      }

    } catch (error) {
      console.error('❌ Error en registro:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para registro con Google
  const handleGoogleRegister = async () => {
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
      console.error('❌ Error en registro con Google:', error);
      setMessage(`❌ Error al registrarse con Google`);
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
        <form className="register-form" onSubmit={handleRegister}>
          <h2>Registrarse</h2>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Nombre de Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={50}
              disabled={loading}
            />
          </div>
          
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
              minLength={6}
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          
          <div className="form-buttons">
            <button 
              type="submit" 
              className="retro-btn register-btn"
              disabled={loading}
            >
              {loading ? "Registrando..." : "📝 Registrarse"}
            </button>
            
            <button
              type="button"
              className="retro-btn google-btn"
              onClick={handleGoogleRegister}
              disabled={loading}
            >
              🔐 Google
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
              ¿Ya tienes cuenta?{" "}
              <span 
                className="link" 
                onClick={() => navigate("/login")}
              >
                Inicia sesión aquí
              </span>
            </p>
          </div>

          <div className="security-notice">
            <p>🔒 Tu contraseña se almacena de forma segura con Supabase Auth</p>
          </div>
        </form>
      </div>
    </div>
  );
}