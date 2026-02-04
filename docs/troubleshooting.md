# Troubleshooting Guide

Common issues and solutions for Detour development.

## Authentication Issues

### "Not authenticated" errors in Convex

**Symptoms:**
- Convex queries/mutations fail with authentication errors
- User is signed in to Clerk but Convex doesn't recognize them

**Solutions:**

1. **Check JWT template name:**
   - Must be exactly `convex` (lowercase)
   - Go to Clerk Dashboard → JWT Templates
   - Verify template exists and is named correctly

2. **Check Convex auth config:**
   ```typescript
   // convex/auth.config.ts
   export default {
     providers: [{
       domain: "https://clerk.your-app.com",
       applicationID: "convex",
     }],
   };
   ```

3. **Verify Clerk domain matches:**
   - Domain in auth config must match your Clerk Frontend API
   - Check Clerk Dashboard → API Keys for correct domain

4. **Clear app data and re-login:**
   - Sometimes cached tokens cause issues
   - Sign out, clear app data, sign back in

### OAuth redirects failing

**Symptoms:**
- Google/Apple sign-in doesn't redirect back to app
- Stuck on OAuth provider screen

**Solutions:**

1. **Check scheme in app.json:**
   ```json
   {
     "expo": {
       "scheme": "detour"
     }
   }
   ```

2. **Rebuild development client:**
   - Scheme changes require rebuild
   - `eas build --profile development`

3. **Check OAuth redirect URIs:**
   - Verify URLs in Google/Apple developer console
   - Must match Clerk's expected redirects

### Phone SMS not delivered

**Symptoms:**
- User doesn't receive verification code
- SMS times out

**Solutions:**

1. **Check phone format:**
   - Include country code (e.g., +1 for US)
   - No spaces or special characters

2. **Check Clerk SMS logs:**
   - Dashboard → Logs → SMS
   - Look for delivery failures

3. **Use Twilio for production:**
   - Clerk's default SMS has limitations
   - Configure Twilio in Clerk Dashboard

## Convex Issues

### Schema push fails

**Symptoms:**
- `npx convex dev` fails with schema errors
- TypeScript errors in Convex files

**Solutions:**

1. **Check for syntax errors:**
   ```bash
   npx tsc --noEmit
   ```

2. **Verify validator imports:**
   ```typescript
   import { v } from "convex/values";
   ```

3. **Check index definitions:**
   - Index fields must exist in table
   - No duplicate index names

### Queries returning stale data

**Symptoms:**
- UI doesn't update when data changes
- Need to refresh to see new data

**Solutions:**

1. **Ensure using `useQuery`:**
   ```typescript
   // ✅ Reactive
   const data = useQuery(api.users.getById, { id });

   // ❌ Not reactive
   const data = await client.query(api.users.getById, { id });
   ```

2. **Check component is mounted:**
   - Queries only update mounted components

3. **Verify subscription:**
   - Check Convex dashboard → Logs for subscription activity

### File upload fails

**Symptoms:**
- Photos don't upload
- "Failed to upload" errors

**Solutions:**

1. **Check authentication:**
   - `generateUploadUrl` requires authenticated user
   - Ensure user is signed in

2. **Check file size:**
   - Convex limit is 50MB
   - Compress images before upload

3. **Verify Content-Type:**
   ```typescript
   await fetch(uploadUrl, {
     method: "POST",
     headers: { "Content-Type": blob.type || "image/jpeg" },
     body: blob,
   });
   ```

## Push Notification Issues

### Token is null

**Symptoms:**
- `expoPushToken` is always null
- Push notifications never work

**Solutions:**

1. **Use physical device:**
   - Push notifications don't work on simulators
   - Must test on real iOS/Android device

2. **Check permissions:**
   ```typescript
   const { status } = await Notifications.getPermissionsAsync();
   console.log("Permission status:", status);
   ```

3. **Verify EAS project ID:**
   - Check `app.json` has `extra.eas.projectId`
   - Run `eas init` if missing

### Notifications not appearing

**Symptoms:**
- Token exists but no notifications received
- Works in Expo Push Tool but not from app

**Solutions:**

1. **Check Convex logs:**
   - Dashboard → Logs
   - Look for notification action output

2. **Verify token is saved:**
   - Check user record in Convex
   - `expoPushToken` field should have value

3. **Check notification triggers:**
   - Match notifications: triggered in `swipes.create`
   - Message notifications: triggered in `messages.send`

### Deep linking not working

**Symptoms:**
- Tapping notification doesn't navigate
- App opens but wrong screen

**Solutions:**

1. **Check data payload:**
   ```typescript
   data: {
     type: "match",  // or "message"
     matchId: "xxx"
   }
   ```

2. **Verify route exists:**
   - `/chat/[matchId].tsx` must exist
   - Check expo-router file structure

3. **Test navigation manually:**
   ```typescript
   router.push(`/chat/${matchId}`);
   ```

## RevenueCat Issues

### Products not showing

**Symptoms:**
- `offerings` is null or empty
- Can't display subscription options

**Solutions:**

1. **Wait for propagation:**
   - App Store products can take 24+ hours
   - Google Play is usually faster

2. **Check product IDs:**
   - Must match exactly (case-sensitive)
   - RevenueCat ID must match store ID

3. **Verify offering setup:**
   - Products must be in an offering
   - Offering must be set as "Current"

4. **Check API keys:**
   - Ensure using correct platform key
   - Test vs production keys

### Purchases failing

**Symptoms:**
- Purchase flow starts but fails
- Error during purchase

**Solutions:**

1. **Use physical device:**
   - Real purchases don't work on simulator

2. **Check sandbox account (iOS):**
   - Sign out of production App Store
   - Use sandbox tester account

3. **Check license testers (Android):**
   - Add email to license testing
   - Use that Google account on device

4. **Check RevenueCat logs:**
   - Dashboard → Customers → Find customer
   - Look at purchase history/errors

### Entitlement not unlocking

**Symptoms:**
- Purchase succeeds but `hasDetourPlus` is false
- Features don't unlock

**Solutions:**

1. **Check entitlement name:**
   - Must be exactly `detour_plus`
   - Case-sensitive

2. **Verify product-entitlement link:**
   - In RevenueCat, products must be attached to entitlement

3. **Refresh customer info:**
   ```typescript
   const { refreshCustomerInfo } = useRevenueCat();
   await refreshCustomerInfo();
   ```

## Build Issues

### EAS build fails

**Symptoms:**
- Build errors in EAS
- App won't compile

**Solutions:**

1. **Check build logs:**
   - EAS provides detailed logs
   - Look for specific error messages

2. **Clear cache:**
   ```bash
   npx expo start --clear
   ```

3. **Update dependencies:**
   ```bash
   npx expo install --fix
   ```

4. **Check native dependencies:**
   - Some packages need native modules
   - Verify in app.json plugins

### iOS specific build issues

1. **Provisioning profile:**
   - Run `eas credentials` to manage
   - Ensure correct bundle ID

2. **Push capability:**
   - Enable in Apple Developer Portal
   - Add to provisioning profile

### Android specific build issues

1. **google-services.json:**
   - Must be in project root
   - Package name must match

2. **Keystore:**
   - EAS manages automatically
   - Or provide custom keystore

## Development Environment

### Metro bundler issues

**Symptoms:**
- "Unable to resolve module"
- Metro crashes

**Solutions:**

1. **Clear Metro cache:**
   ```bash
   npx expo start --clear
   ```

2. **Delete node_modules:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Reset watchman (macOS):**
   ```bash
   watchman watch-del-all
   ```

### TypeScript errors

**Symptoms:**
- Red squiggles in IDE
- `tsc` fails

**Solutions:**

1. **Regenerate Convex types:**
   ```bash
   npx convex codegen
   ```

2. **Restart TypeScript server:**
   - VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

3. **Check tsconfig.json:**
   - Ensure paths are configured
   - Check strict mode settings

## Getting Help

1. **Check Expo documentation:** [docs.expo.dev](https://docs.expo.dev)
2. **Check Convex documentation:** [docs.convex.dev](https://docs.convex.dev)
3. **Check Clerk documentation:** [clerk.com/docs](https://clerk.com/docs)
4. **Check RevenueCat documentation:** [revenuecat.com/docs](https://www.revenuecat.com/docs)
5. **Search GitHub issues** for the relevant package
6. **Expo Discord:** [chat.expo.dev](https://chat.expo.dev)
7. **Convex Discord:** [convex.dev/community](https://www.convex.dev/community)
