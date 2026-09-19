import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LeadStatus, LeadTracking } from '../types/prospect';

const STORAGE_KEY = 'netqorix_lead_tracking_v1';

interface TrackingContextType {
  trackingMap: Record<string, LeadTracking>;
  getTracking: (id: string) => LeadTracking;
  updateTracking: (id: string, updates: Partial<LeadTracking>) => void;
  quickSetStatus: (id: string, status: LeadStatus) => void;
  exportBackupJson: () => void;
  importBackupJson: (content: string) => { success: boolean; count: number; error?: string };
  resetAllTracking: () => void;
}

const defaultTracking: LeadTracking = {
  status: 'New',
  notes: '',
  followUpDate: '',
  email: '',
  finalDealValue: null,
  updatedAt: ''
};

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export const TrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trackingMap, setTrackingMap] = useState<Record<string, LeadTracking>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load tracking records from localStorage:', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trackingMap));
    } catch (e) {
      console.error('Failed to save tracking records to localStorage:', e);
    }
  }, [trackingMap]);

  const getTracking = (id: string): LeadTracking => {
    return trackingMap[id] || { ...defaultTracking };
  };

  const updateTracking = (id: string, updates: Partial<LeadTracking>) => {
    setTrackingMap((prev) => {
      const current = prev[id] || { ...defaultTracking };
      return {
        ...prev,
        [id]: {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      };
    });
  };

  const quickSetStatus = (id: string, status: LeadStatus) => {
    updateTracking(id, { status });
  };

  const exportBackupJson = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const dataStr = JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: Object.keys(trackingMap).length,
        tracking: trackingMap
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netqorix_tracking_backup_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackupJson = (content: string): { success: boolean; count: number; error?: string } => {
    try {
      const parsed = JSON.parse(content);
      const trackingData = parsed.tracking || parsed;
      if (typeof trackingData !== 'object' || trackingData === null) {
        return { success: false, count: 0, error: 'Invalid JSON format: missing tracking object' };
      }
      const count = Object.keys(trackingData).length;
      setTrackingMap((prev) => ({
        ...prev,
        ...trackingData
      }));
      return { success: true, count };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || 'Failed to parse JSON' };
    }
  };

  const resetAllTracking = () => {
    if (window.confirm('Are you sure you want to reset all tracked statuses and notes? This cannot be undone.')) {
      setTrackingMap({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TrackingContext.Provider
      value={{
        trackingMap,
        getTracking,
        updateTracking,
        quickSetStatus,
        exportBackupJson,
        importBackupJson,
        resetAllTracking
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) throw new Error('useTracking must be used within TrackingProvider');
  return context;
}
