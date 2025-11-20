const { onValueCreated } = require("firebase-functions/v2/database");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

admin.initializeApp();

const SENDGRID_KEY = process.env.SENDGRID_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_TO = process.env.EMAIL_TO;

sgMail.setApiKey(SENDGRID_KEY);

// ==========================
// 1️⃣ Fonction globale : Déclenchée à chaque ajout de donnée
// ==========================
exports.smartpoolProcessAll = onValueCreated(
  { ref: "/Piscine/{id}", region: "europe-west1" },
  async (event) => {
    const data = event.data.val();
    if (!data) return;

    const { niveau, ph, temperature, pompe } = data;
    const db = admin.firestore();

    // 1️⃣ Enregistrer les données “nettoyées”
    const cleanRef = await db.collection("datavalide").add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      niveau,
      ph,
      temperature,
      pompe,
    });

    // 2️⃣ Vérifier et envoyer les alertes
    const alerts = [];
    if (pompe === 0 && niveau < 20) alerts.push("🚨 Pompe en panne !");
    if (ph < 6.5 || ph > 8) alerts.push("⚗️ Alerte chimique !");
    if (temperature > 35) alerts.push("🔥 Alerte température élevée !");
    if (niveau < 10) alerts.push("💧 Niveau d’eau très bas !");

    if (alerts.length > 0) {
      const msg = {
        to: EMAIL_TO,
        from: EMAIL_FROM,
        subject: "🚨 SmartPool - Alerte détectée",
        text: `Alertes :\n${alerts.join("\n")}\n\nValeurs :\nTempérature: ${temperature}°C\npH: ${ph}\nNiveau: ${niveau}\nPompe: ${pompe}`,
      };

      try {
        await sgMail.send(msg);
        console.log("📧 Email envoyé à", EMAIL_TO);
      } catch (err) {
        console.error("Erreur d’envoi d’email :", err);
      }

      await db.collection("alerts").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: alerts.join(" | "),
        values: { niveau, ph, temperature, pompe },
        emailSent: EMAIL_TO,
        status: "envoyée",
      });
    }

    // 3️⃣ Calculer les métriques sur les dernières valeurs
    const snapshot = await db.collection("datavalide")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    if (!snapshot.empty) {
      let phTotal = 0, tempTotal = 0, niveauTotal = 0, count = 0;

      snapshot.forEach(doc => {
        const { ph, temperature, niveau } = doc.data();
        phTotal += ph;
        tempTotal += temperature;
        niveauTotal += niveau;
        count++;
      });

      const phMoy = phTotal / count;
      const tempMoy = tempTotal / count;
      const niveauMoy = niveauTotal / count;

      await db.collection("metrics").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ph_moyenne_mobile: parseFloat(phMoy.toFixed(2)),
        temp_moyenne_mobile: parseFloat(tempMoy.toFixed(2)),
        niveau_moyen_mobile: parseFloat(niveauMoy.toFixed(2)),
        tendance_ph: phMoy < 6.5 ? "Acide" : phMoy > 8 ? "Basique" : "OK",
        tendance_temperature: tempMoy > 35 ? "Trop chaud" : tempMoy < 20 ? "Trop froid" : "OK",
        tendance_niveau: niveauMoy < 20 ? "Niveau bas" : "OK",
      });
    }

    // 4️⃣ Simulation d’automatisation
    const actions = [];
    if (niveau < 15 && pompe === 0) actions.push("Pompe activée automatiquement");
    if (temperature < 25) actions.push("Chauffage activé automatiquement");

    if (actions.length > 0) {
      await db.collection("automation_logs").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        actions,
        values: { niveau, temperature, pompe },
      });
      logger.info("🤖 Actions automatisées :", actions);
    }

    logger.info("✅ Donnée traitée avec succès :", {
      id: event.params.id,
      niveau,
      ph,
      temperature,
      pompe,
    });
  }
);
