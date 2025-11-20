// src/pages/AuthPage.jsx
import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/AuthPage.css"; // on stylise ici

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // login | register
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setMessage("Veuillez vérifier votre email avant de continuer.");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setMessage("Compte créé ! Vérifiez votre email pour activer votre compte.");
      setMode("login");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage("Veuillez saisir votre email pour réinitialiser le mot de passe.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Email de réinitialisation envoyé !");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMessage("Déconnecté !");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="logo-container">
          <img src="/logo.png" alt="SmartPool" className="logo" />
        </div>
        <h2>{mode === "login" ? "Connexion" : "Créer un compte"}</h2>
        {message && <p className="message">{message}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />

        {mode === "login" ? (
          <>
            <button className="btn-primary" onClick={handleLogin}>
              Se connecter
            </button>
            <button className="btn-google" onClick={handleGoogleLogin}>
              
              Se connecter avec Google
            </button>
            <p className="link" onClick={handleResetPassword}>
              Mot de passe oublié ?
            </p>
            <p>
              Pas encore de compte ?{" "}
              <span className="link" onClick={() => setMode("register")}>
                Créer un compte
              </span>
            </p>
          </>
        ) : (
          <>
            <button className="btn-primary" onClick={handleRegister}>
              Créer un compte
            </button>
            <p>
              Déjà un compte ?{" "}
              <span className="link" onClick={() => setMode("login")}>
                Se connecter
              </span>
            </p>
          </>
        )}

        <hr />
        <button className="btn-logout" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
