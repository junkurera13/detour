import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { router } from 'expo-router';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationType = 'match' | 'message';

export interface NotificationData {
  type?: NotificationType;
  matchId?: string;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isPushTokenSynced, setIsPushTokenSynced] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const savePushToken = useMutation(api.users.savePushToken);

  const persistPushToken = useCallback(async (token: string) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await savePushToken({ expoPushToken: token });
        if (result?.success) {
          setIsPushTokenSynced(true);
          return true;
        }
      } catch {
        // Retried below.
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
    setIsPushTokenSynced(false);
    return false;
  }, [savePushToken]);

  // Register for push notifications and get token
  const registerForPushNotifications = useCallback(async () => {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      return null;
    }

    // Skip on web
    if (Platform.OS === 'web') {
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus);

    if (finalStatus !== 'granted') {
      return null;
    }

    // Get the Expo Push Token
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('Project ID not found for push notifications');
        return null;
      }

      let token = expoPushToken;
      if (!token) {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        setExpoPushToken(token);
      }

      await persistPushToken(token);

      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }, [expoPushToken, persistPushToken]);

  // Handle notification tap (deep linking)
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const rawData = response.notification.request.content.data;
      const data: NotificationData = {
        type: rawData?.type as NotificationType | undefined,
        matchId: rawData?.matchId as string | undefined,
      };

      if (data.type === 'match' && data.matchId) {
        router.push(`/chat/${data.matchId}`);
      } else if (data.type === 'message' && data.matchId) {
        router.push(`/chat/${data.matchId}`);
      }
    },
    []
  );

  // Set up listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      () => {
        // Foreground notification received — no action needed
      }
    );

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationResponse]);

  // Request permission (can be called from UI)
  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') return null;

    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);

    if (status === 'granted') {
      await registerForPushNotifications();
    }

    return status;
  }, [registerForPushNotifications]);

  // Clear badge count
  const clearBadge = useCallback(async () => {
    if (Platform.OS === 'web') return;
    await Notifications.setBadgeCountAsync(0);
  }, []);

  return {
    expoPushToken,
    isPushTokenSynced,
    permissionStatus,
    isPermissionGranted: permissionStatus === 'granted',
    registerForPushNotifications,
    requestPermission,
    clearBadge,
  };
}
