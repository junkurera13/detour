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
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const savePushToken = useMutation(api.users.savePushToken);

  // Register for push notifications and get token
  const registerForPushNotifications = useCallback(async () => {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
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
      console.log('Push notification permission not granted');
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

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      setExpoPushToken(token);

      // Save token to Convex
      try {
        await savePushToken({ expoPushToken: token });
      } catch (err) {
        // User might not exist yet, that's OK
        console.log('Could not save push token yet:', err);
      }

      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }, [savePushToken]);

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
      (notification) => {
        console.log('Notification received in foreground:', notification);
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
    permissionStatus,
    isPermissionGranted: permissionStatus === 'granted',
    registerForPushNotifications,
    requestPermission,
    clearBadge,
  };
}
