// src/pages/AlertsPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase"; // AJOUT: importer auth
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth"; // AJOUT: importer signOut
import { Link, useNavigate } from "react-router-dom"; // AJOUT: useNavigate
import "../styles/alertsPage.css";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate(); // AJOUT: navigate

  useEffect(() => {
    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data());
      setAlerts(items);
    });
    return () => unsubscribe();
  }, []);

  // AJOUT: Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'niveau':
        return '💧';
      case 'ph':
        return '🧪';
      case 'température':
      case 'temperature':
        return '🌡️';
      default:
        return '⚠️';
    }
  };

  const getAlertSeverity = (type) => {
    switch (type?.toLowerCase()) {
      case 'critique':
        return 'critical';
      case 'haute':
      case 'élevée':
        return 'high';
      case 'moyenne':
        return 'medium';
      case 'basse':
        return 'low';
      default:
        return 'medium';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "all") return true;
    return alert.type?.toLowerCase().includes(filter.toLowerCase());
  });

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(a => getAlertSeverity(a.type) === 'critical').length,
    high: alerts.filter(a => getAlertSeverity(a.type) === 'high').length,
    active: alerts.filter(a => !a.resolved).length
  };

  if (!alerts.length) {
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
            <li>
              <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)}>
                📊 Dashboard
              </Link>
            </li>
            <li className="active">
              <Link to="/alerts" onClick={() => setIsSidebarOpen(false)}>
                ⚠️ Alertes
              </Link>
            </li>
            {/* AJOUT: Bouton déconnexion dans la sidebar */}
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
            <h1>⚠️ Alertes Piscine</h1>
          </div>

          <div className="no-alerts-container">
            <div className="no-alerts-icon">🎉</div>
            <h2>Aucune alerte en cours</h2>
            <p>Tous les paramètres de votre piscine sont dans les normes.</p>
            <Link to="/dashboard" className="back-to-dashboard-btn">
              Retour au Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
          <li>
            <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)}>
              📊 Dashboard
            </Link>
          </li>
          <li className="active">
            <Link to="/alerts" onClick={() => setIsSidebarOpen(false)}>
              ⚠️ Alertes
            </Link>
          </li>
          {/* AJOUT: Bouton déconnexion dans la sidebar */}
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
        {/* AUCUNE MODIFICATION DU CONTENU EXISTANT */}
        <div className="main-header">
          <h1>⚠️ Alertes Piscine</h1>
          <div className="alerts-actions">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Toutes ({alertStats.total})
            </button>
            <button 
              className={`filter-btn ${filter === 'niveau' ? 'active' : ''}`}
              onClick={() => setFilter('niveau')}
            >
              Niveau
            </button>
            <button 
              className={`filter-btn ${filter === 'ph' ? 'active' : ''}`}
              onClick={() => setFilter('ph')}
            >
              pH
            </button>
            <button 
              className={`filter-btn ${filter === 'température' ? 'active' : ''}`}
              onClick={() => setFilter('température')}
            >
              Température
            </button>
          </div>
        </div>

        {/* Alert Statistics */}
        <div className="alert-stats-container">
          <div className="stat-card">
            <div className="stat-icon total">📈</div>
            <div className="stat-content">
              <h3>Total des alertes</h3>
              <p className="stat-value">{alertStats.total}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">🔴</div>
            <div className="stat-content">
              <h3>Alertes actives</h3>
              <p className="stat-value">{alertStats.active}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon critical">🚨</div>
            <div className="stat-content">
              <h3>Critiques</h3>
              <p className="stat-value">{alertStats.critical}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon high">⚠️</div>
            <div className="stat-content">
              <h3>Élevées</h3>
              <p className="stat-value">{alertStats.high}</p>
            </div>
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="alerts-grid">
          {filteredAlerts.map((alert, i) => (
            <div 
              key={i} 
              className={`alert-card severity-${getAlertSeverity(alert.type)}`}
            >
              <div className="alert-header">
                <div className="alert-icon">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-title">
                  <h3>{alert.type}</h3>
                  <span className="alert-time">
                    {new Date(alert.timestamp.seconds * 1000).toLocaleString()}
                  </span>
                </div>
                <div className={`alert-badge severity-${getAlertSeverity(alert.type)}`}>
                  {getAlertSeverity(alert.type) === 'critical' ? 'CRITIQUE' : 
                   getAlertSeverity(alert.type) === 'high' ? 'ÉLEVÉE' : 
                   getAlertSeverity(alert.type) === 'medium' ? 'MOYENNE' : 'BASSE'}
                </div>
              </div>
              
              <div className="alert-body">
                <p>{alert.message}</p>
              </div>

              <div className="alert-footer">
                <span className={`status-indicator ${alert.resolved ? 'resolved' : 'active'}`}>
                  {alert.resolved ? '✅ Résolue' : '🔄 En cours'}
                </span>
                {!alert.resolved && (
                  <button className="resolve-btn">
                    Marquer comme résolue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Alternative Table View for larger screens */}
        <div className="table-section">
          <div className="table-header">
            <h2>📋 Historique complet des alertes</h2>
            <span className="table-count">{filteredAlerts.length} alertes</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date/Heure</th>
                  <th>Type</th>
                  <th>Sévérité</th>
                  <th>Description</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert, i) => (
                  <tr key={i}>
                    <td>
                      <div className="timestamp-cell">
                        <span className="date">
                          {new Date(alert.timestamp.seconds * 1000).toLocaleDateString()}
                        </span>
                        <span className="time">
                          {new Date(alert.timestamp.seconds * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="type-cell">
                        <span className="alert-icon-small">
                          {getAlertIcon(alert.type)}
                        </span>
                        {alert.type}
                      </div>
                    </td>
                    <td>
                      <span className={`severity-badge severity-${getAlertSeverity(alert.type)}`}>
                        {getAlertSeverity(alert.type)}
                      </span>
                    </td>
                    <td className="message-cell">{alert.message}</td>
                    <td>
                      <span className={`status-badge ${alert.resolved ? 'resolved' : 'active'}`}>
                        {alert.resolved ? 'Résolue' : 'Active'}
                      </span>
                    </td>
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