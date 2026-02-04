# Deployment Guide

This guide covers building and deploying Detour to the App Store and Google Play.

## Prerequisites

- Apple Developer account ($99/year) for iOS
- Google Play Developer account ($25 one-time) for Android
- EAS CLI installed: `npm install -g eas-cli`
- Logged into EAS: `eas login`

## Environment Setup

### 1. Configure EAS Project

```bash
# Initialize EAS (if not already done)
eas init

# This creates/updates eas.json and links to your Expo account
```

### 2. Set Up EAS Secrets

Set production environment variables in EAS:

```bash
# Convex
eas secret:create EXPO_PUBLIC_CONVEX_URL --value "https://your-project.convex.cloud"
eas secret:create EXPO_PUBLIC_CONVEX_SITE_URL --value "https://your-project.convex.site"

# Clerk
eas secret:create EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_xxx"

# RevenueCat
eas secret:create EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value "appl_xxx"
eas secret:create EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value "goog_xxx"

# App environment
eas secret:create EXPO_PUBLIC_APP_ENV --value "production"
```

## iOS Deployment

### 1. Configure App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app with bundle ID: `com.detour.app`
3. Fill in app information, screenshots, description
4. Set up in-app purchases (subscriptions)

### 2. Configure Push Notifications

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Create an APNs Key:
   - Keys → Create a new key
   - Enable "Apple Push Notifications service (APNs)"
   - Download the `.p8` file
4. Upload to Expo:
   ```bash
   eas credentials
   # Select iOS → Push Notifications → Upload APNs Key
   ```

### 3. Build for iOS

```bash
# Development build (for testing)
eas build --platform ios --profile development

# Preview build (TestFlight)
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production
```

### 4. Submit to App Store

```bash
# Submit the latest production build
eas submit --platform ios

# Or submit a specific build
eas submit --platform ios --id [BUILD_ID]
```

### 5. TestFlight Testing

1. Build is automatically uploaded to TestFlight after `eas submit`
2. Go to App Store Connect → TestFlight
3. Add internal testers (up to 100)
4. Add external testers (up to 10,000) - requires Apple review

## Android Deployment

### 1. Configure Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in store listing, screenshots, description
4. Set up in-app products (subscriptions)

### 2. Configure Push Notifications (FCM)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Add Android app with package: `com.detour.app`
4. Download `google-services.json`
5. Place in project root
6. Upload FCM Server Key to Expo:
   ```bash
   eas credentials
   # Select Android → Push Notifications → Upload FCM Server Key
   ```

### 3. Build for Android

```bash
# Development build (APK)
eas build --platform android --profile development

# Preview build (AAB for internal testing)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

### 4. Submit to Google Play

```bash
# Submit the latest production build
eas submit --platform android

# Or submit a specific build
eas submit --platform android --id [BUILD_ID]
```

### 5. Testing Tracks

1. **Internal testing** - Up to 100 testers, instant availability
2. **Closed testing** - Invite-only, requires review
3. **Open testing** - Public opt-in, requires review
4. **Production** - Full release

## EAS Configuration

Your `eas.json` should look like:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "123456789",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./play-store-key.json",
        "track": "internal"
      }
    }
  }
}
```

## Convex Production Deployment

### 1. Create Production Deployment

```bash
# Deploy to production
npx convex deploy --prod
```

### 2. Configure Environment

In Convex dashboard:
1. Go to your project → Settings → Environment Variables
2. Add any server-side environment variables needed

## RevenueCat Production Setup

### 1. App Store Connect

1. Create subscription products in App Store Connect
2. Add products to RevenueCat with matching IDs
3. Create entitlement: `detour_plus`
4. Create offering with packages

### 2. Google Play Console

1. Create subscription products in Play Console
2. Add products to RevenueCat with matching IDs
3. Link to same entitlement and offering

### 3. Replace API Keys

Ensure production API keys are set in EAS secrets (not test keys).

## Pre-Launch Checklist

### App Store

- [ ] App icon (1024x1024)
- [ ] Screenshots for all device sizes
- [ ] App preview video (optional)
- [ ] App description
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating questionnaire
- [ ] App privacy questionnaire

### Google Play

- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots for phone and tablet
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Data safety form

### Technical

- [ ] Production Convex deployment
- [ ] Production Clerk keys
- [ ] Production RevenueCat keys
- [ ] APNs key uploaded
- [ ] FCM configured
- [ ] Error monitoring (Sentry) configured
- [ ] Analytics configured

## Versioning

Update version in `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1
    }
  }
}
```

EAS can auto-increment with `"autoIncrement": true` in build profile.

## Rollback

If issues occur after release:

### iOS
- Use Xcode to upload a previous build
- Or build and submit a hotfix via EAS

### Android
- Use staged rollout (start at 5%, increase gradually)
- Halt rollout if issues detected
- Upload fixed version

## Monitoring Post-Launch

1. **Crash reports**: Check Sentry dashboard
2. **App Store reviews**: Respond to user feedback
3. **Analytics**: Monitor key metrics
4. **RevenueCat**: Track subscription metrics
5. **Convex**: Monitor function performance
