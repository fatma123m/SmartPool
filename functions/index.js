const { onValueWritten } = require("firebase-functions/v2/database");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const axios = require("axios");

require("firebase-functions/logger/compat");
require("dotenv").config();

admin.initializeApp();

// Env variables
const functions = require("firebase-functions");
const SENDGRID_KEY = functions.config().sendgrid.key;
const EMAIL_TO = functions.config().sendgrid.email_to;
const EMAIL_FROM = functions.config().sendgrid.email_from;
sgMail.setApiKey(SENDGRID_KEY);
const OPENWEATHER_KEY = functions.config().openweather.key;

exports.smartpoolProcessAll = onValueWritten(
  { ref: "/Piscine/{id}", region: "europe-west1" },
  async (event) => {
    const startTime = Date.now(); // Début du traitement
    const data = event.data.after.val();
    if (!data) return;

    // ⚠️ Valeurs initiales
    let alertPompe = [];
    const niveau = data.niveau ?? 0;
    const ph = data.ph ?? 7;
    const temperature = data.temperature ?? 25;
    let pompe = data.pompe ?? 0;
    const mode = data.mode ?? "AUTO"; // AUTO/MANUEL

    const db = admin.firestore();

    // 1️⃣ Stockage des données brutes
    await db.collection("datavalide").add(
      {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        niveau,
        ph,
        temperature,
        pompe,
        mode,
      },
      { ignoreUndefinedProperties: true }
    );

    // =============================================================
    // 2️⃣ Calcul des métriques (20 dernières valeurs)
    const snapshot = await db
      .collection("datavalide")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    let phTotal = 0, tempTotal = 0, niveauTotal = 0;
    let count = snapshot.size;

    snapshot.forEach((doc) => {
      const d = doc.data();
      phTotal += d.ph ?? 7;
      tempTotal += d.temperature ?? 25;
      niveauTotal += d.niveau ?? 0;
    });

    const phMoy = phTotal / count;
    const tempMoy = tempTotal / count;
    const niveauMoy = niveauTotal / count;

    const tendancePH = phMoy < 6.5 ? "Acide" : phMoy > 8 ? "Basique" : "OK";
    const tendanceTemp = tempMoy > 35 ? "Trop chaud" : tempMoy < 20 ? "Trop froid" : "OK";
    const tendanceNiveau = niveauMoy < 20 ? "Niveau bas" : "OK";

    // =============================================================
    // 3️⃣ Calcul IQE
    let penaliteTemp = Math.max(0, tempMoy < 20 ? 20 : tempMoy > 35 ? 20 : 0);
    let penalitePH = Math.max(0, phMoy < 6.5 ? 15 : phMoy > 8 ? 15 : 0);
    let penaliteNiveau = Math.max(0, niveauMoy < 20 ? 15 : 0);
    const IQE = 100 - (penaliteTemp + penalitePH + penaliteNiveau);

    // =============================================================
    // 4️⃣ Activation pompe (AUTO seulement)
    const dbStart = Date.now();
    if (mode === "AUTO" && niveauMoy < 20 && pompe === 0) {
      pompe = 1;
      alertPompe.push("🤖 Pompe activée automatiquement (niveau bas)");
      await admin.database().ref(`/Piscine/${event.params.id}/pompe`).set(pompe);
    }
    const dbEnd = Date.now();
    logger.info(`Realtime DB write latency: ${dbEnd - dbStart} ms`);

    // =============================================================
    // 5️⃣ Prévision météo OpenWeather
    let weatherInfo = {};
    try {
      const apiStart = Date.now();
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${OPENWEATHER_KEY}&units=metric`
      );
      const apiEnd = Date.now();
      logger.info(`OpenWeather API latency: ${apiEnd - apiStart} ms`);

      const weather = weatherRes.data;
      const pluie = weather.weather.some((w) => w.main.toLowerCase().includes("rain"));
      weatherInfo = { tempExt: weather.main.temp, pluie };

      if (pluie) alertPompe.push("🌧️ Pluie prévue");
      if (weather.main.temp > 35) alertPompe.push("🔥 Forte chaleur prévue");
    } catch (err) {
      console.error("Erreur météo :", err.message);
    }

    // =============================================================
    // 6️⃣ Détection alertes + severity
    const alerts = [];
    if (IQE < 85) { // seuil critique
      if (pompe === 0 && niveau < 20) alerts.push({ message: "Pompe arrêtée lorsque niveau bas !", severity: "HIGH" });
      if (ph < 6.5 || ph > 8) alerts.push({ message: "pH hors norme !", severity: "MEDIUM" });
      if (temperature > 35) alerts.push({ message: "Température élevée !", severity: "MEDIUM" });
      if (niveau < 10) alerts.push({ message: "Niveau très bas !", severity: "HIGH" });
    }

    logger.info("Alerts à envoyer par email:", alerts);

    // Envoi email
    if (alerts.length > 0) {
      const msg = {
        to: EMAIL_TO,
        from: EMAIL_FROM,
        subject: "🚨 SmartPool - Alerte détectée",
        text: alerts.map(a => `${a.severity}: ${a.message}`).join("\n"),
      };
      try { await sgMail.send(msg); } catch (err) { console.error(err); }
      await db.collection("alerts").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        alerts,
        values: { niveau, ph, temperature, pompe, IQE, mode },
      });
    }

    // =============================================================
    // 7️⃣ Enregistrer metrics
    await db.collection("metrics").add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      temp_moyenne_mobile: parseFloat(tempMoy.toFixed(2)),
      ph_moyenne_mobile: parseFloat(phMoy.toFixed(2)),
      niveau_moyen_mobile: parseFloat(niveauMoy.toFixed(2)),
      tendance_temperature: tendanceTemp,
      tendance_ph: tendancePH,
      tendance_niveau: tendanceNiveau,
      etat_pompe: pompe ? "ON" : "OFF",
      IQE,
      mode,
      weather: weatherInfo,
    });

    // 🔹 Stockage des métriques de performance pour analyse
    const endTime = Date.now(); // Fin du traitement
    const duration = endTime - startTime; // en millisecondes
    await db.collection("performance_metrics").add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      executionTime: duration,
      openWeatherLatency: weatherInfo.tempExt ? apiEnd - apiStart : null,
      dbWriteLatency: dbEnd - dbStart,
      alertCount: alerts.length
    });

    logger.info(`Function execution time: ${duration} ms`);
    logger.info("✔ Donnée traitée avec succès :", data);
  }
);
