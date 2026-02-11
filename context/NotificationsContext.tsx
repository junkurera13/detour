import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@clerk/clerk-expo';
import { useConvexAuth } from 'convex/react';

type NotificationsContextValue = {
  expoPushToken: string | null;
  isPermissionGranted: boolean;
  requestPermission: () => Promise<string | null>;
  clearBadge: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const {
    expoPushToken,
    isPushTokenSynced,
    isPermissionGranted,
    requestPermission,
    registerForPushNotifications,
    clearBadge,
  } = useNotifications();

  // Auto-register for push when user is authenticated
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!isSignedIn || !isAuthenticated) return;

    // Register if we don't have a token yet, or if token exists but failed to sync to backend.
    if (!expoPushToken || !isPushTokenSynced) {
      registerForPushNotifications();
    }
  }, [isSignedIn, isAuthenticated, expoPushToken, isPushTokenSynced, registerForPushNotifications]);

  const value = useMemo<NotificationsContextValue>(() => ({
    expoPushToken,
    isPermissionGranted,
    requestPermission,
    clearBadge,
  }), [expoPushToken, isPermissionGranted, requestPermission, clearBadge]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotificationsContext must be used within a NotificationsProvider'
    );
  }
  return context;
}
