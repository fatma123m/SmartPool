import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Initialisation des performances Firebase
import { perf } from "./firebase";
import { trace } from "firebase/performance";

// Démarrer le tracking des performances
const pageLoadTrace = trace(perf, "page_load");
pageLoadTrace.start();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="app-container">
      <App />
    </div>
  </React.StrictMode>
);

// Arrêter le tracking quand la page est chargée
window.addEventListener("load", () => {
  pageLoadTrace.stop();
});

// Gestion des erreurs globales
window.addEventListener("error", (event) => {
  console.error("Erreur globale:", event.error);
});

// Optionnel: Mesurer le CLS (Cumulative Layout Shift)
let clsValue = 0;
let clsEntries = [];

new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    if (!entry.hadRecentInput) {
      clsEntries.push(entry);
      clsValue += entry.value;
    }
  }
}).observe({ type: "layout-shift", buffered: true });