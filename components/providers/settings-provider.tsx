'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppSettings, CardDensity, FontMode } from '@/lib/types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  id: 'appSettings',
  weekStartsOn: 1,
  reviewDay: 0,
  reviewTime: '20:00',
  theme: 'system',
  fontSize: 'md',
  afterNewIdeaBehavior: 'home',
  hasShownSplash: false,
  cardDensity: 'standard',
  fontMode: 'gothic',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      // Merge with defaults to ensure all keys are present
      setSettings(prev => ({ ...prev, ...parsedSettings }));
    }
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      localStorage.setItem('appSettings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
