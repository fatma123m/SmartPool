import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import AlertsPage from "./pages/AlertsPage";

import DashboardPiscineClient from "./pages/DashboardPiscineClient";
import { auth } from "./firebase";

function ProtectedRoute({ children }) {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPiscineClient />
              <AlertsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
