import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // acá podes poner Tailwind o tu CSS propio

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
