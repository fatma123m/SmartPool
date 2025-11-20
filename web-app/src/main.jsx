import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // si tu as un fichier CSS global

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import { perf } from "./firebase";
import { trace } from "firebase/performance";

const pageLoadTrace = trace(perf, "page_load");
pageLoadTrace.start();

window.addEventListener("load", () => {
  pageLoadTrace.stop(); // mesure le temps de chargement complet
});
