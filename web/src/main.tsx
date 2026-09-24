import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./estilos/global.css";

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
