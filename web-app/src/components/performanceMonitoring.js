// performanceMonitoring.js
import { trace } from "firebase/performance";
import { perf } from "../firebaseConfig";

// Trace pour charger le dashboard
export async function trackDashboardLoad(loadFunction) {
  const dashboardTrace = trace(perf, "load_dashboard");
  dashboardTrace.start();
  try {
    const result = await loadFunction();
    return result;
  } finally {
    dashboardTrace.stop();
  }
}

// Trace pour récupérer les données des capteurs
export async function trackSensorFetch(sensorName, fetchFunction) {
  const sensorTrace = trace(perf, `fetch_${sensorName}`);
  sensorTrace.start();
  try {
    const data = await fetchFunction();
    return data;
  } finally {
    sensorTrace.stop();
  }
}

// Trace pour déclenchement des alertes
export function trackAlert(alertName, callback) {
  const alertTrace = trace(perf, `alert_${alertName}`);
  alertTrace.start();
  try {
    callback();
  } finally {
    alertTrace.stop();
  }
}
