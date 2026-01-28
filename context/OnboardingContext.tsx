import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OnboardingData {
  name: string;
  birthday: Date | null;
  gender: string;
  lookingFor: 'friends' | 'dating' | 'both' | null;
  datingPreference: string[];
  lifestyle: string[];
  timeNomadic: string;
  interests: string[];
  photos: string[];
  instagram: string;
  currentLocation: string;
  futureTrip: string;
  hasCompletedOnboarding: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const defaultData: OnboardingData = {
  name: '',
  birthday: null,
  gender: '',
  lookingFor: null,
  datingPreference: [],
  lifestyle: [],
  timeNomadic: '',
  interests: [],
  photos: [],
  instagram: '',
  currentLocation: '',
  futureTrip: '',
  hasCompletedOnboarding: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData(defaultData);
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
