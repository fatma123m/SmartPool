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
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";

import "../styles/DashboardPiscine.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function DashboardPiscineClient() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "datavalide"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data());
      setData(items.reverse()); // affichage chronologique
    });
    return () => unsubscribe();
  }, []);

  if (!data.length) return <p className="loading">Chargement des données...</p>;

  const latest = data[data.length - 1];

  const timestamps = data.map((d) => new Date(d.timestamp.seconds * 1000).toLocaleTimeString());
  const niveauData = data.map((d) => d.niveau);
  const phData = data.map((d) => d.ph);
  const tempData = data.map((d) => d.temperature);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  // Alert logic
  const alertNiveau = latest.niveau < 30;
  const alertPh = latest.ph < 6.5 || latest.ph > 8;
  const alertTemp = latest.temperature > 30;

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>SmartPool</h2>
        <ul>
            <li className="active">
                <Link to="/">Dashboard</Link>
            </li>
            <li>
                <Link to="/alerts">Alerts</Link>
            </li>
        </ul>

      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header>
          <h1>📊 Dashboard Piscine Intelligent</h1>
        </header>

        {/* KPI Cards */}
        <div className="kpi-container">
          <div className={`kpi-card ${alertNiveau ? "alert" : ""}`}>
            <h3>Niveau d'eau</h3>
            <p>{latest.niveau}%</p>
          </div>
          <div className={`kpi-card ${alertPh ? "alert" : ""}`}>
            <h3>pH</h3>
            <p>{latest.ph}</p>
          </div>
          <div className={`kpi-card ${alertTemp ? "alert" : ""}`}>
            <h3>Température</h3>
            <p>{latest.temperature}°C</p>
          </div>
        </div>

        {/* Graphs */}
        <div className="chart-section">
          <h2>💧 Niveau d'eau (%)</h2>
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

        <div className="chart-section">
          <h2>🧪 pH</h2>
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

        <div className="chart-section">
          <h2>🌡️ Température (°C)</h2>
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

        {/* Latest Measurements Table */}
        <div className="table-section">
          <h2>📝 Dernières mesures</h2>
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
      </main>
    </div>
  );
}
