// src/pages/Games.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Games() {
  const navigate = useNavigate();

  // Redirigir automáticamente al juego
  useEffect(() => {
    navigate("/game");
  }, [navigate]);

  return (
    <div className="games-container">
      <div className="loading-screen">
        <h2>🎮 Cargando Esquiva Islas...</h2>
        <p>Preparando tu aventura naval</p>
      </div>
    </div>
  );
}