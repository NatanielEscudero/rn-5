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
      // Registrar usuario directamente en tu tabla 'users'
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username: username.trim(),
            email: email,
            password: password, // ⚠️ En producción esto debería estar hasheado
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        // Manejar errores específicos de Supabase
        if (error.code === '23505') { // Violación de constraint único
          if (error.message.includes('username')) {
            throw new Error('Este nombre de usuario ya está en uso');
          } else if (error.message.includes('email')) {
            throw new Error('Este email ya está registrado');
          }
        }
        throw error;
      }

      if (data) {
        setMessage("✅ ¡Registro exitoso! Redirigiendo al login...");
        
        // Guardar datos del usuario en localStorage
        const userData = {
          id: data.id,
          username: data.username,
          email: data.email
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }

    } catch (error) {
      console.error('Error en registro:', error);
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
        <form className="register-form" onSubmit={handleRegister}>
          <h2>Registrarse</h2>
          
          <input
            type="text"
            placeholder="Nombre de Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            maxLength={50}
            disabled={loading}
          />
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder="Confirmar Contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
          
          <div className="form-buttons">
            <button 
              type="submit" 
              className="retro-btn register-btn"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Registrarse"}
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
            <p>¿Ya tienes cuenta? <span onClick={() => navigate("/login")}>Inicia sesión aquí</span></p>
          </div>
        </form>
      </div>
    </div>
  );
}