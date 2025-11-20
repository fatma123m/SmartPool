// hooks/useAuth.js - VERSION SYNCHRONE OPTIMISÉE
import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase/config';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🚨 OPTIMISATION : Débounce rapide pour éviter les re-renders
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Batch les updates pour réduire les re-renders
      requestAnimationFrame(() => {
        setUser(user);
        setLoading(false);
      });
    });

    return unsubscribe;
  }, []);

  // 🚨 MÉMOISATION des fonctions
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signup = useCallback(async (email, password) => {
    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return { user, loading, error, login, signup, logout, resetPassword, loginWithGoogle };
};