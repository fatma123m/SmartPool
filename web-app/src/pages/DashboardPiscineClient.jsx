// src/pages/DashboardPiscineClient.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { db, auth } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore"; // AJOUT: getDoc
import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

import "../styles/DashboardPiscine.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function DashboardPiscineClient() {
  const [data, setData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pumpState, setPumpState] = useState(false); // AJOUT: État de la pompe
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "datavalide"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data());
      setData(items.reverse());
    });

    // AJOUT: Charger l'état de la pompe depuis Firebase
    const loadPumpState = async () => {
      try {
        const pumpDoc = await getDoc(doc(db, "pumpState", "current"));
        if (pumpDoc.exists()) {
          setPumpState(pumpDoc.data().pompeOn);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'état de la pompe:", error);
      }
    };

    loadPumpState();

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  if (!data.length) return (
    <div className="dashboard-wrapper">
      <div className="loading-fullscreen">
        <p>Chargement des données...</p>
      </div>
    </div>
  );

  const latest = data[data.length - 1];

  const timestamps = data.map((d) => new Date(d.timestamp.seconds * 1000).toLocaleTimeString());
  const niveauData = data.map((d) => d.niveau);
  const phData = data.map((d) => d.ph);
  const tempData = data.map((d) => d.temperature);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        display: false 
      } 
    },
    scales: { 
      y: { 
        beginAtZero: true 
      },
      x: {
        ticks: {
          maxTicksLimit: 6
        }
      }
    },
  };

  // Alert logic
  const alertNiveau = latest.niveau < 30;
  const alertPh = latest.ph < 6.5 || latest.ph > 8;
  const alertTemp = latest.temperature > 30;

  return (
    <div className="dashboard-wrapper">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="menu-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          ☰
        </button>
        <h1>SmartPool</h1>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>SmartPool</h2>
          <button 
            className="close-sidebar"
            onClick={() => setIsSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <ul>
          <li className="active">
            <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)}>
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link to="/alerts" onClick={() => setIsSidebarOpen(false)}>
              ⚠️ Alertes
            </Link>
          </li>
          <li className="logout-item">
            <button onClick={handleLogout} className="logout-btn">
              🚪 Déconnexion
            </button>
          </li>
        </ul>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <main className="dashboard-main">
        <div className="main-header">
          <h1>📊 Dashboard Piscine Intelligente</h1>
          <div className="status-indicators">
            <div className={`status-indicator ${alertNiveau ? 'status-alert' : 'status-ok'}`}>
              Niveau d'eau
            </div>
            <div className={`status-indicator ${alertPh ? 'status-alert' : 'status-ok'}`}>
              pH
            </div>
            <div className={`status-indicator ${alertTemp ? 'status-alert' : 'status-ok'}`}>
              Température
            </div>
          </div>
        </div>

        {/* KPI Cards - AJOUT: Carte pour afficher l'état de la pompe */}
        <div className="kpi-container">
          <div className={`kpi-card ${alertNiveau ? "alert" : ""}`}>
            <div className="kpi-icon">💧</div>
            <div className="kpi-content">
              <h3>Niveau d'eau</h3>
              <p className="kpi-value">{latest.niveau}%</p>
              <span className="kpi-label">Actuel</span>
            </div>
          </div>
          
          <div className={`kpi-card ${alertPh ? "alert" : ""}`}>
            <div className="kpi-icon">🧪</div>
            <div className="kpi-content">
              <h3>pH</h3>
              <p className="kpi-value">{latest.ph}</p>
              <span className="kpi-label">Optimal: 6.5-8.0</span>
            </div>
          </div>
          
          <div className={`kpi-card ${alertTemp ? "alert" : ""}`}>
            <div className="kpi-icon">🌡️</div>
            <div className="kpi-content">
              <h3>Température</h3>
              <p className="kpi-value">{latest.temperature}°C</p>
              <span className="kpi-label">Max: 30°C</span>
            </div>
          </div>

          {/* AJOUT: Carte pour afficher l'état de la pompe (lecture seule) */}
          <div className={`kpi-card ${pumpState ? "pump-on" : "pump-off"}`}>
            <div className="kpi-icon">{pumpState ? "🔌" : "⭕"}</div>
            <div className="kpi-content">
              <h3>Pompe de filtration</h3>
              <p className="kpi-value">{pumpState ? "ON" : "OFF"}</p>
              <span className="kpi-label">
                {pumpState ? "En fonctionnement" : "Arrêtée"}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          <div className="chart-container">
            <div className="chart-header">
              <h3>💧 Niveau d'eau (%)</h3>
              <span className={`chart-status ${alertNiveau ? 'status-alert' : 'status-ok'}`}>
                {alertNiveau ? '⚠️ Alerte' : '✅ Normal'}
              </span>
            </div>
            <div className="chart-wrapper">
              <Line
                data={{
                  labels: timestamps,
                  datasets: [
                    {
                      label: "Niveau",
                      data: niveauData,
                      borderColor: "#3b82f6",
                      backgroundColor: "rgba(59,130,246,0.2)",
                      tension: 0.3,
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h3>🧪 pH</h3>
              <span className={`chart-status ${alertPh ? 'status-alert' : 'status-ok'}`}>
                {alertPh ? '⚠️ Alerte' : '✅ Normal'}
              </span>
            </div>
            <div className="chart-wrapper">
              <Line
                data={{
                  labels: timestamps,
                  datasets: [
                    {
                      label: "pH",
                      data: phData,
                      borderColor: "#ef4444",
                      backgroundColor: "rgba(239,68,68,0.2)",
                      tension: 0.3,
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h3>🌡️ Température (°C)</h3>
              <span className={`chart-status ${alertTemp ? 'status-alert' : 'status-ok'}`}>
                {alertTemp ? '⚠️ Alerte' : '✅ Normal'}
              </span>
            </div>
            <div className="chart-wrapper">
              <Line
                data={{
                  labels: timestamps,
                  datasets: [
                    {
                      label: "Température",
                      data: tempData,
                      borderColor: "#f59e0b",
                      backgroundColor: "rgba(245,158,11,0.2)",
                      tension: 0.3,
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>

        {/* Latest Measurements Table */}
        <div className="table-section">
          <div className="table-header">
            <h2>📝 Dernières mesures</h2>
            <span className="table-count">{data.slice(-10).length} enregistrements</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Niveau (%)</th>
                  <th>pH</th>
                  <th>Température (°C)</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-10).map((d, i) => (
                  <tr key={i}>
                    <td>{new Date(d.timestamp.seconds * 1000).toLocaleTimeString()}</td>
                    <td>{d.niveau}</td>
                    <td>{d.ph}</td>
                    <td>{d.temperature}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}