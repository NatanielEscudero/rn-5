const { pool } = require("../db");
const bcrypt = require("bcryptjs");

// Registro
const register = async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  
  try {
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Las contraseñas no coinciden" 
      });
    }

    // Verificar si el usuario ya existe (PostgreSQL usa $1, $2...)
    const existingQuery = "SELECT * FROM users WHERE username = $1";
    const { rows: existingUsers } = await pool.query(existingQuery, [username]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Usuario ya existe" 
      });
    }

    // Hash de la contraseña y crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username";
    const { rows } = await pool.query(insertQuery, [username, hashedPassword]);

    res.json({ 
      success: true, 
      message: "Usuario registrado exitosamente",
      user: {
        id: rows[0].id,
        username: rows[0].username
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Error del servidor" 
    });
  }
};

// Login
const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Buscar usuario (PostgreSQL usa $1, $2...)
    const query = "SELECT * FROM users WHERE username = $1";
    const { rows } = await pool.query(query, [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ 
        success: false, 
        message: "Contraseña incorrecta" 
      });
    }

    res.json({ 
      success: true, 
      message: "Login exitoso",
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Error del servidor" 
    });
  }
};

module.exports = { register, login };