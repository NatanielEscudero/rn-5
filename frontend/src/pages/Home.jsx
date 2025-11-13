// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Game from "../components/Game"; // Ruta corregida
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="home-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/imagenes/terraria.gif)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="home-content">
        <h1>¡Bienvenido al Juego!</h1>
        <div className="home-buttons">
          <button
            className="retro-btn login-btn"
            onClick={() => navigate("/login")}
          >
            Iniciar Sesión
          </button>
          <button
            className="retro-btn register-btn"
            onClick={() => navigate("/register")}
          >
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
}