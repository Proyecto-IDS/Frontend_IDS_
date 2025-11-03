import { useEffect, useState } from 'react';
import {
  getAlertsBySeverity,
  getAlertsTodayCount,
} from './api.js';

export function useMetrics(baseUrl) {
  const [metrics, setMetrics] = useState({
    today: 0,
    critical: 0,
    high: 0,
    total: 0,
    loading: true,
  });

  useEffect(() => {
    if (!baseUrl) return;

    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true }));
        
        // Get today's alerts count
        const todayData = await getAlertsTodayCount(baseUrl);
        
        // Get all alerts by severity
        const severityData = await getAlertsBySeverity(baseUrl);
        
        setMetrics({
          today: todayData?.total || 0,
          critical: severityData?.critica || 0,
          high: severityData?.alta || 0,
          total: severityData?.total || 0,
          loading: false,
        });
      } catch (error) {
        console.warn('Failed to load metrics:', error);
        setMetrics(prev => ({ ...prev, loading: false }));
      }
    };

    fetchMetrics();
    // Refresh metrics every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [baseUrl]);

  return metrics;
}
