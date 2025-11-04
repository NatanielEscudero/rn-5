const { Pool } = require('pg');
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(client => {
    console.log("✅ Conectado a Supabase PostgreSQL");
    client.release();
  })
  .catch(err => {
    console.error("❌ Error conectando a Supabase:", err);
  });

module.exports = { pool };