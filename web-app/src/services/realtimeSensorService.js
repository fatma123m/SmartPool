import { database } from '../firebase/config';
import { ref, onValue, off, query, orderByKey, limitToLast } from 'firebase/database';

class RealtimeSensorService {
  constructor() {
    this.subscribers = new Set();
    this.currentData = [];
    this.isListening = false;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => callback(data));
  }

  startListening() {
    if (this.isListening) return;
    
    console.log('🔗 Démarrage écoute Firebase Realtime DB...');
    
    try {
      const piscineRef = query(
        ref(database, 'Piscine'),
        orderByKey(),
        limitToLast(50)
      );

      this.listener = onValue(piscineRef, (snapshot) => {
        const data = snapshot.val();
        console.log('📊 Données reçues de Firebase:', data);
        
        const processedData = this.processData(data);
        this.currentData = processedData;
        this.notifySubscribers(processedData);
        
        this.saveToLocalStorage(processedData);
      }, (error) => {
        console.error('❌ Erreur Firebase:', error);
      });

      this.isListening = true;
      
    } catch (error) {
      console.error('❌ Erreur écoute temps réel:', error);
    }
  }

  stopListening() {
    if (this.listener) {
      off(this.listener);
      this.isListening = false;
    }
  }

  processData(rawData) {
    if (!rawData) {
      console.log('📭 Aucune donnée dans Firebase');
      return [];
    }
    
    try {
      const result = Object.entries(rawData)
        .map(([key, value]) => ({
          id: key,
          niveau: value.niveau || 0,
          ph: value.ph || 7,
          temperature: value.temperature || 0,
          pompe: value.pompe || 0,
          timestamp: value.timestamp || Date.now(),
          phStatus: this.getPHStatus(value.ph),
          qualityScore: this.calculateQualityScore(value)
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      console.log(`✅ ${result.length} points de données traités`);
      return result;
    } catch (error) {
      console.error('❌ Erreur traitement données:', error);
      return [];
    }
  }

  getPHStatus(ph) {
    if (ph < 6.8) return { status: 'low', color: '#e74c3c', label: 'Trop bas' };
    if (ph > 7.6) return { status: 'high', color: '#e74c3c', label: 'Trop haut' };
    return { status: 'optimal', color: '#2ecc71', label: 'Optimal' };
  }

  calculateQualityScore(sensorData) {
    const phScore = Math.max(0, 100 - Math.abs((sensorData.ph || 7) - 7.2) * 50);
    const levelScore = sensorData.niveau > 75 ? 100 : (sensorData.niveau / 75) * 100;
    const tempScore = sensorData.temperature ? 
      Math.max(0, 100 - Math.abs(sensorData.temperature - 25) * 5) : 80;
    
    return Math.round((phScore * 0.4) + (levelScore * 0.3) + (tempScore * 0.3));
  }

  saveToLocalStorage(data) {
    try {
      const compressed = data.map(item => ({
        n: Math.round(item.niveau),
        p: Math.round(item.ph * 10) / 10,
        t: item.temperature ? Math.round(item.temperature) : null,
        pm: item.pompe,
        ts: item.timestamp
      }));
      
      localStorage.setItem('sensor_cache', JSON.stringify({
        data: compressed,
        timestamp: Date.now(),
        version: 'v2'
      }));
    } catch (e) {
      console.warn('💾 LocalStorage full');
    }
  }

  getCachedData() {
    try {
      const cached = localStorage.getItem('sensor_cache');
      if (!cached) return [];

      const parsed = JSON.parse(cached);
      if (parsed.version === 'v2') {
        return parsed.data.map(item => ({
          niveau: item.n,
          ph: item.p,
          temperature: item.t,
          pompe: item.pm,
          timestamp: item.ts,
          phStatus: this.getPHStatus(item.p),
          qualityScore: this.calculateQualityScore({ 
            ph: item.p, 
            niveau: item.n, 
            temperature: item.t 
          })
        }));
      }
      return [];
    } catch {
      return [];
    }
  }
}

export const realtimeSensorService = new RealtimeSensorService();