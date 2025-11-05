// En tu App.js - Agrega la ruta del juego
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Game from "./components/Game"; // Asegúrate de que esta ruta sea correcta
import Statistics from './components/Statistics';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/games" element={<Games />} />
        <Route path="/game" element={<Game />} /> {/* Agrega esta línea */}
        <Route path="/statistics" element={<Statistics />} />
      </Routes>
    </Router>
  );
}

export default App;