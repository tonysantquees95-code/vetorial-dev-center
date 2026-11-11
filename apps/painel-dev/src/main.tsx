import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { Provedor } from "./estado";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Provedor>
      <App />
    </Provedor>
  </StrictMode>
);
