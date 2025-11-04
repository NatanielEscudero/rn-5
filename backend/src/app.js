const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
