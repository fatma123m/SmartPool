// src/pages/AlertsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import "../styles/DashboardPiscine.css"; // tu peux utiliser le même style que Dashboard

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data());
      setAlerts(items);
    });
    return () => unsubscribe();
  }, []);

  if (!alerts.length) return <p className="loading">Aucune alerte pour le moment...</p>;

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <h2>SmartPool</h2>
        <ul>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className="active">
            <Link to="/alerts">Alerts</Link>
          </li>
        </ul>
      </aside>

      <main className="dashboard-main">
        <header>
          <h1>⚠️ Alertes Piscine</h1>
        </header>

        <div className="table-section">
          <table>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Type d'alerte</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, i) => (
                <tr key={i}>
                  <td>{new Date(alert.timestamp.seconds * 1000).toLocaleTimeString()}</td>
                  <td>{alert.type}</td>
                  <td>{alert.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
