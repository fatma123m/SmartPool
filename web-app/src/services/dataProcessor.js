// src/services/dataProcessor.js
export class DataProcessor {
  // Nettoyage des données
  static cleanPiscineData(rawData) {
    const cleaned = { ...rawData };
    
    if (cleaned.temperature && (cleaned.temperature < 0 || cleaned.temperature > 40)) {
      delete cleaned.temperature;
    }

    if (cleaned.ph && (cleaned.ph < 0 || cleaned.ph > 14)) {
      delete cleaned.ph;
    }

    if (cleaned.niveau && (cleaned.niveau < 0 || cleaned.niveau > 100)) {
      delete cleaned.niveau;
    }

    if (cleaned.pompe !== undefined) {
      cleaned.pompe = Boolean(cleaned.pompe);
    }

    return cleaned;
  }

  // Calcul qualité d'eau
  static calculateWaterQuality(data) {
    let score = 0;
    let factors = 0;

    if (data.temperature) {
      let tempScore = 100;
      if (data.temperature < 24 || data.temperature > 28) {
        const idealTemp = 26;
        const deviation = Math.abs(data.temperature - idealTemp);
        tempScore = Math.max(0, 100 - (deviation * 10));
      }
      score += tempScore;
      factors++;
    }

    if (data.ph) {
      let phScore = 100;
      if (data.ph < 7.2 || data.ph > 7.6) {
        const idealPH = 7.4;
        const deviation = Math.abs(data.ph - idealPH);
        phScore = Math.max(0, 100 - (deviation * 50));
      }
      score += phScore;
      factors++;
    }

    if (data.niveau) {
      let niveauScore = 100;
      if (data.niveau < 70 || data.niveau > 90) {
        const idealNiveau = 80;
        const deviation = Math.abs(data.niveau - idealNiveau);
        niveauScore = Math.max(0, 100 - (deviation * 2));
      }
      score += niveauScore;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  // Statut piscine
  static getPoolStatus(qualityScore) {
    if (qualityScore >= 90) return 'excellent';
    if (qualityScore >= 75) return 'bon';
    if (qualityScore >= 60) return 'moyen';
    if (qualityScore >= 40) return 'médiocre';
    return 'critique';
  }

  // Détection anomalies
  static detectAnomalies(data) {
    const anomalies = [];

    if (data.temperature > 30) anomalies.push('temperature_trop_elevee');
    if (data.temperature < 15) anomalies.push('temperature_trop_basse');
    if (data.ph > 7.8) anomalies.push('ph_trop_eleve');
    if (data.ph < 7.0) anomalies.push('ph_trop_bas');
    if (data.niveau < 50) anomalies.push('niveau_trop_bas');
    if (data.niveau > 95) anomalies.push('niveau_trop_haut');
    if (data.pompe === false && data.temperature > 28) {
      anomalies.push('pompe_eteinte_temperature_elevee');
    }

    return anomalies;
  }

  // Génération alertes
  static generateAlerts(metrics) {
    const alertes = [];

    if (metrics.statut_piscine === 'critique') {
      alertes.push('CRITIQUE: Qualité d eau dangereuse');
    }

    if (metrics.anomalies.includes('ph_trop_eleve')) {
      alertes.push('AJUSTER: pH trop élevé - ajouter produit pH-');
    }

    if (metrics.anomalies.includes('ph_trop_bas')) {
      alertes.push('AJUSTER: pH trop bas - ajouter produit pH+');
    }

    if (metrics.anomalies.includes('temperature_trop_elevee')) {
      alertes.push('ALERTE: Température très élevée');
    }

    if (metrics.anomalies.includes('niveau_trop_bas')) {
      alertes.push('REMPLIR: Niveau d eau trop bas');
    }

    return alertes;
  }

  // Traitement complet
  static processData(rawData) {
    const cleaned = this.cleanPiscineData(rawData);
    const qualite_eau = this.calculateWaterQuality(cleaned);
    const statut_piscine = this.getPoolStatus(qualite_eau);
    const anomalies = this.detectAnomalies(cleaned);
    const alertes = this.generateAlerts({ statut_piscine, anomalies });

    return {
      ...cleaned,
      qualite_eau,
      statut_piscine,
      anomalies,
      alertes,
      processed_at: Date.now()
    };
  }
}