import { db, perf, auth } from "./firebase.js";
import { ref, get } from "firebase/database";
import { trace } from "firebase/performance";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

/**
 * Mesure la performance de la connexion Google
 */
export async function connectWithGoogle() {
  const loginTrace = trace(perf, "google_login_trace");
  loginTrace.start();

  try {
    const provider = new GoogleAuthProvider();

    const start = performance.now();
    const result = await signInWithPopup(auth, provider);
    const end = performance.now();

    const user = result.user;
    console.log(`✅ Connexion réussie : ${user.displayName}`);

    // Ajout de la latence personnalisée
    const connectionTime = end - start;
    loginTrace.putMetric("google_login_time_ms", connectionTime);
    console.log(`⏱️ Temps de connexion Google : ${connectionTime.toFixed(2)} ms`);

    return user;
  } catch (error) {
    console.error("❌ Erreur lors de la connexion Google :", error);
    throw error;
  } finally {
    loginTrace.stop(); // fin de la trace de connexion
  }
}

/**
 * Récupère la valeur d'un capteur depuis RTDB en mesurant la latence
 */
export async function fetchSensor(sensorName) {
  const sensorTrace = trace(perf, `fetch_sensor_${sensorName}`);
  sensorTrace.start();

  const start = performance.now();
  try {
    const snapshot = await get(ref(db, `sensors/${sensorName}`));
    const end = performance.now();
    const fetchTime = end - start;

    sensorTrace.putMetric("sensor_fetch_time_ms", fetchTime);
    console.log(`📡 Temps de lecture pour ${sensorName} : ${fetchTime.toFixed(2)} ms`);

    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn(`⚠️ Aucune donnée pour ${sensorName}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erreur de lecture pour ${sensorName} :`, error);
    throw error;
  } finally {
    sensorTrace.stop();
  }
}
