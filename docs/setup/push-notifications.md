# Push Notifications Setup Guide

This guide covers setting up push notifications for Detour.

## Overview

Detour uses:
- **Expo Notifications** - Client-side SDK
- **Expo Push Service** - Sends notifications via FCM/APNs
- **Convex Actions** - Server-side notification triggers

## Development Setup

### 1. Install Packages

Already installed in the project:

```bash
npx expo install expo-notifications expo-device
```

### 2. Configure app.json

Already configured:

```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/images/icon.png",
        "color": "#fd6b03"
      }]
    ],
    "notification": {
      "icon": "./assets/images/icon.png",
      "color": "#fd6b03",
      "iosDisplayInForeground": true
    }
  }
}
```

### 3. Get EAS Project ID

Push notifications require an EAS project:

```bash
# If not already initialized
eas init

# Verify project ID exists
cat app.json | grep projectId
```

The project ID should be in `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## iOS Setup (APNs)

### Development

For development/Expo Go, Expo handles APNs automatically.

### Production

1. **Create APNs Key:**
   - Go to [Apple Developer Portal](https://developer.apple.com)
   - Certificates, Identifiers & Profiles → Keys
   - Create new key with "Apple Push Notifications service (APNs)"
   - Download `.p8` file (keep it safe!)

2. **Upload to Expo:**
   ```bash
   eas credentials
   # Select iOS
   # Select Push Notifications
   # Upload APNs Key
   ```

3. **Alternative: Upload via Dashboard:**
   - Go to [Expo Dashboard](https://expo.dev)
   - Project → Credentials → iOS
   - Add Push Key

## Android Setup (FCM)

### Development

For development/Expo Go, Expo handles FCM automatically.

### Production

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project or use existing
   - Add Android app with package: `com.detour.app`

2. **Download google-services.json:**
   - Project Settings → Your apps → Android
   - Download `google-services.json`
   - Place in project root

3. **Get FCM Server Key:**
   - Project Settings → Cloud Messaging
   - Copy "Server key" (legacy) or set up FCM v1

4. **Upload to Expo:**
   ```bash
   eas credentials
   # Select Android
   # Select Push Notifications
   # Enter FCM Server Key
   ```

## How It Works

### 1. Token Registration

When user authenticates:

```typescript
// In NotificationsContext.tsx
useEffect(() => {
  if (isAuthenticated && !expoPushToken) {
    registerForPushNotifications();
  }
}, [isAuthenticated]);

// Gets token and saves to Convex
const token = await Notifications.getExpoPushTokenAsync({ projectId });
await savePushToken({ expoPushToken: token });
```

### 2. Sending Notifications

Triggered from Convex when:

**Match Created** (`convex/swipes.ts`):
```typescript
await ctx.scheduler.runAfter(0, internal.notifications.sendMatchNotification, {
  recipientId,
  matcherName,
  matchId,
});
```

**Message Sent** (`convex/messages.ts`):
```typescript
await ctx.scheduler.runAfter(0, internal.notifications.sendMessageNotification, {
  recipientId,
  senderName,
  messagePreview,
  matchId,
});
```

### 3. Expo Push API

Convex action sends to Expo Push Service:

```typescript
// convex/notifications.ts
const response = await fetch("https://exp.host/--/api/v2/push/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: pushToken,        // ExponentPushToken[xxx]
    title: "It's a match!",
    body: "You and John liked each other!",
    data: { type: "match", matchId: "xxx" }
  })
});
```

### 4. Receiving Notifications

```typescript
// hooks/useNotifications.ts

// Foreground notifications
Notifications.addNotificationReceivedListener((notification) => {
  console.log("Received:", notification);
});

// Notification tap (deep linking)
Notifications.addNotificationResponseReceivedListener((response) => {
  const { type, matchId } = response.notification.request.content.data;
  if (type === "match" || type === "message") {
    router.push(`/chat/${matchId}`);
  }
});
```

## Testing

### Expo Push Tool

1. Go to [Expo Push Tool](https://expo.dev/notifications)
2. Enter your Expo Push Token
3. Send test notification

### Get Your Push Token

Add temporary logging:

```typescript
console.log("Push token:", expoPushToken);
```

Token format: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

### Test Scenarios

1. **App in foreground:**
   - Notification appears as banner
   - `addNotificationReceivedListener` fires

2. **App in background:**
   - System notification appears
   - Tap opens app
   - `addNotificationResponseReceivedListener` fires

3. **App killed:**
   - System notification appears
   - Tap opens app
   - Check `Notifications.getLastNotificationResponseAsync()`

## Notification Types

### Match Notification

```json
{
  "title": "It's a match! 🎉",
  "body": "You and Sarah liked each other!",
  "data": {
    "type": "match",
    "matchId": "xxx"
  }
}
```

### Message Notification

```json
{
  "title": "Sarah",
  "body": "Hey! How's Bali treating you?",
  "data": {
    "type": "message",
    "matchId": "xxx"
  }
}
```

## Troubleshooting

### Token is null

1. **Physical device required** - Push doesn't work on simulators
2. **Check permissions** - User must grant notification permission
3. **Check project ID** - Must have EAS project configured

### Notifications not received

1. **Check token is saved** - Verify in Convex dashboard → users table
2. **Check Convex logs** - Look for notification action logs
3. **Check Expo status** - [status.expo.dev](https://status.expo.dev)

### Deep linking not working

1. **Verify data payload** - Must include `type` and `matchId`
2. **Check route exists** - `/chat/[matchId]` must be valid
3. **Test with Expo Push Tool** - Include data in test

### iOS specific issues

1. **Background notifications** - Require APNs key
2. **Development builds** - Need push capability in provisioning profile

### Android specific issues

1. **No sound/vibration** - Check notification channel settings
2. **Notifications blocked** - User may have disabled for app

## Production Checklist

- [ ] APNs key uploaded to Expo credentials
- [ ] FCM configured with Firebase project
- [ ] `google-services.json` in project root
- [ ] EAS project ID configured
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Deep linking works from notification tap
- [ ] Notification sounds/badges working
