import { useState, useEffect } from 'react';
import { realtimeSensorService } from '../services/realtimeSensorService';

export const useRealtimeSensors = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🎯 Initialisation hook temps réel');
    
    // Charger les données cachées immédiatement
    const cachedData = realtimeSensorService.getCachedData();
    if (cachedData.length > 0) {
      console.log('📂 Données cachées chargées:', cachedData.length);
      setSensorData(cachedData);
      setLoading(false);
    }

    // Démarrer l'écoute temps réel
    realtimeSensorService.startListening();

    // S'abonner aux nouvelles données
    const unsubscribe = realtimeSensorService.subscribe((newData) => {
      console.log('🔄 Nouvelles données reçues:', newData.length);
      setSensorData(newData);
      setLoading(false);
      setError(null);
    });

    // Nettoyer à la destruction
    return () => {
      console.log('🧹 Nettoyage hook temps réel');
      unsubscribe();
      realtimeSensorService.stopListening();
    };
  }, []);

  const latestData = sensorData[sensorData.length - 1] || {};
  
  // Calcul des statistiques
  const stats = sensorData.length > 0 ? {
    avgNiveau: sensorData.reduce((sum, item) => sum + (item.niveau || 0), 0) / sensorData.length,
    avgPH: sensorData.reduce((sum, item) => sum + (item.ph || 7), 0) / sensorData.length,
    avgTemp: sensorData.filter(item => item.temperature).reduce((sum, item) => sum + item.temperature, 0) / 
             sensorData.filter(item => item.temperature).length || 0,
    dataPoints: sensorData.length,
    lastUpdate: latestData.timestamp
  } : {
    avgNiveau: 0, avgPH: 7, avgTemp: 0, dataPoints: 0, lastUpdate: null
  };

  return {
    data: sensorData,
    latestData,
    loading,
    error,
    stats,
    phStatus: latestData.phStatus || { status: 'unknown', color: '#95a5a6', label: 'N/A' },
    qualityScore: latestData.qualityScore || 0
  };
};