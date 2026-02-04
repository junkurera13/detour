# Clerk Setup Guide

This guide covers setting up Clerk authentication for Detour.

## Create Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Add application"
3. Name it "Detour" (or your app name)
4. Select authentication methods:
   - Phone number (SMS)
   - Google OAuth
   - Apple OAuth

## Configure Authentication Methods

### Phone (SMS) Authentication

1. Go to **User & Authentication → Email, Phone, Username**
2. Enable "Phone number"
3. Set phone number as identifier
4. Configure SMS settings:
   - Go to **User & Authentication → SMS**
   - Default Clerk SMS works for development
   - For production, consider Twilio integration for better deliverability

### Google OAuth

1. Go to **User & Authentication → Social Connections**
2. Click "Google"
3. Enable Google OAuth
4. For development, use Clerk's shared credentials
5. For production:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
   - Add credentials to Clerk

### Apple OAuth

1. Go to **User & Authentication → Social Connections**
2. Click "Apple"
3. Enable Apple OAuth
4. For development, use Clerk's shared credentials
5. For production:
   - Configure in [Apple Developer Portal](https://developer.apple.com)
   - Create Service ID and configure Sign in with Apple
   - Add credentials to Clerk

## Configure JWT Template for Convex

This is **critical** for Clerk + Convex integration.

1. Go to **JWT Templates**
2. Click "New template"
3. Select "Convex" from the list
4. Name it `convex` (must be lowercase "convex")
5. Keep default claims:
   ```json
   {
     "sub": "{{user.id}}"
   }
   ```
6. Save the template

## Get API Keys

### Development Keys

1. Go to **API Keys**
2. Copy the **Publishable key** (starts with `pk_test_`)
3. Add to `.env.local`:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   ```

### Production Keys

1. In Clerk Dashboard, switch to Production instance
2. Go to **API Keys**
3. Copy the **Publishable key** (starts with `pk_live_`)
4. Add to EAS secrets:
   ```bash
   eas secret:create EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_xxx"
   ```

## Configure Expo Settings

### Add Scheme for OAuth Redirects

In `app.json`:

```json
{
  "expo": {
    "scheme": "detour"
  }
}
```

### Token Cache Setup

The app uses `expo-secure-store` for secure token storage. This is configured in `lib/tokenCache.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';
import { TokenCache } from '@clerk/clerk-expo/dist/cache';

export const tokenCache: TokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};
```

## Verify Integration

### Check Convex JWT Integration

1. Sign in to the app
2. Check Convex dashboard → Logs
3. Should see authenticated requests with user identity
4. If not, verify:
   - JWT template is named exactly `convex`
   - Convex auth config is correct (see Convex setup)

### Test Auth Flow

1. **Phone**: Enter phone number → Receive SMS → Enter code
2. **Google**: Tap Google button → OAuth flow → Redirect back
3. **Apple**: Tap Apple button → Face ID/Touch ID → Redirect back

## Troubleshooting

### "Invalid JWT" errors in Convex

- Ensure JWT template is named `convex` (lowercase)
- Check that Clerk domain is configured in Convex auth config
- Verify production vs development keys match environment

### OAuth redirects not working

- Ensure `scheme: "detour"` is in app.json
- For development builds, rebuild the app after changing scheme
- Check that OAuth redirect URIs are configured in providers

### SMS not being delivered

- Check Clerk dashboard for SMS delivery status
- Verify phone number format (include country code)
- For production, consider Twilio integration

## Production Checklist

- [ ] Switch to Production instance in Clerk
- [ ] Configure production OAuth credentials (Google, Apple)
- [ ] Set up Twilio for SMS (optional but recommended)
- [ ] Update API keys in EAS secrets
- [ ] Test all auth flows in production environment
