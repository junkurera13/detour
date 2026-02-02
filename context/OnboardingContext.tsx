import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OnboardingData {
  name: string;
  username: string;
  birthday: Date | null;
  gender: string;
  lookingFor: string[];
  friendsPreference: string[];
  datingPreference: string[];
  datingGoals: string[];
  lifestyle: string[];
  timeNomadic: string;
  interests: string[];
  photos: string[];
  instagram: string;
  currentLocation: string;
  futureTrip: string;
  hasCompletedOnboarding: boolean;
  joinPath: 'apply' | 'invite' | null;
  userStatus: 'none' | 'pending' | 'approved';
  inviteCode: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const defaultData: OnboardingData = {
  name: '',
  username: '',
  birthday: null,
  gender: '',
  lookingFor: [],
  friendsPreference: [],
  datingPreference: [],
  datingGoals: [],
  lifestyle: [],
  timeNomadic: '',
  interests: [],
  photos: [],
  instagram: '',
  currentLocation: '',
  futureTrip: '',
  hasCompletedOnboarding: false,
  joinPath: null,
  userStatus: 'none',
  inviteCode: '',
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
