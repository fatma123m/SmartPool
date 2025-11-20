import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

// --------------------
// 1️⃣ Alerte Intelligente
// --------------------
export const alertIntelligente = functions.firestore
  .document("measurements/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const { ph, temperature, niveau } = data;
    let message = "";

    if (ph !== undefined && (ph < 6.5 || ph > 8.0)) message = `pH anormal : ${ph}`;
    else if (temperature !== undefined && temperature > 35)
      message = `Température trop élevée : ${temperature}`;
    else if (niveau !== undefined && niveau < 10) message = `Niveau trop bas : ${niveau}%`;

    if (message) {
      await admin.firestore().collection("alerts").add({
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Alerte créée: ${message}`);
    }
  });

// --------------------
// 2️⃣ Analyse Hebdomadaire
// --------------------
export const analyseHebdomadaire = functions.pubsub
  .schedule("0 9 * * 1") // tous les lundis à 09h00
  .timeZone("Europe/Brussels")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const weekStr = getWeekString(now);

    // Récupérer toutes les mesures de la semaine écoulée
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const snapshot = await db
      .collection("measurements")
      .where("timestamp", ">=", oneWeekAgo)
      .where("timestamp", "<=", now)
      .get();

    let phSum = 0,
      tempSum = 0,
      niveauSum = 0,
      count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      phSum += data.ph ?? 0;
      tempSum += data.temperature ?? 0;
      niveauSum += data.niveau ?? 0;
      count++;
    });

    if (count === 0) return null;

    await db.collection("weekly_reports").doc(weekStr).set({
      week: weekStr,
      ph_moyen: phSum / count,
      temperature_moyenne: tempSum / count,
      niveau_moyen: niveauSum / count,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Rapport hebdomadaire créé: ${weekStr}`);
    return null;
  });

// --------------------
// 3️⃣ Sauvegarde Quotidienne
// --------------------
export const sauvegardeQuotidienne = functions.pubsub
  .schedule("0 0 * * *") // tous les jours à minuit
  .timeZone("Europe/Brussels")
  .onRun(async (context) => {
    const db = admin.firestore();
    const dateStr = new Date().toISOString().split("T")[0];

    const snapshot = await db.collection("measurements").get();
    if (snapshot.empty) return null;

    const batch = db.batch();
    snapshot.forEach((doc) => {
      const archiveRef = db
        .collection("archive")
        .doc(dateStr)
        .collection("measurements")
        .doc(doc.id);
      batch.set(archiveRef, doc.data());
    });

    await batch.commit();
    console.log(`Mesures sauvegardées dans archive/${dateStr}`);
    return null;
  });

// --------------------
// Utilitaire: numéro de semaine
// --------------------
function getWeekString(d: Date): string {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear =
    Math.floor((d.getTime() - onejan.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil((dayOfYear + onejan.getDay()) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
}
