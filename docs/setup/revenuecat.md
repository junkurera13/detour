# RevenueCat Setup Guide

This guide covers setting up RevenueCat for subscriptions in Detour.

## Create RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Create an account
3. Create a new project for "Detour"

## Configure iOS (App Store)

### 1. Create App Store Connect Products

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → In-App Purchases
3. Create subscription products:

**Monthly Subscription:**
- Product ID: `detour_plus_monthly`
- Reference Name: Detour Plus Monthly
- Price: $9.99/month
- Free Trial: 7 days (optional)

**Yearly Subscription:**
- Product ID: `detour_plus_yearly`
- Reference Name: Detour Plus Yearly
- Price: $99.99/year
- Free Trial: 7 days (recommended)

### 2. Create Subscription Group

1. In App Store Connect → In-App Purchases → Subscription Groups
2. Create group: "Detour Plus"
3. Add both products to this group

### 3. Configure in RevenueCat

1. In RevenueCat Dashboard → Apps → Add new app
2. Select "App Store"
3. Enter:
   - App name: Detour iOS
   - Bundle ID: `com.detour.app`

### 4. Add App Store Connect API Key

1. In App Store Connect → Users and Access → Keys
2. Create a new key with "App Manager" role
3. Download the `.p8` file
4. In RevenueCat → App Settings → App Store Connect API
5. Upload the key and enter:
   - Issuer ID
   - Key ID

### 5. Add Products to RevenueCat

1. Go to Products → Add Product
2. Add each product:
   - Product ID: `detour_plus_monthly` (must match App Store)
   - Product ID: `detour_plus_yearly`

## Configure Android (Google Play)

### 1. Create Google Play Products

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to your app → Monetization → Products → Subscriptions
3. Create subscription products:

**Monthly Subscription:**
- Product ID: `detour_plus_monthly`
- Name: Detour Plus Monthly
- Price: $9.99/month
- Free trial: 7 days (optional)

**Yearly Subscription:**
- Product ID: `detour_plus_yearly`
- Name: Detour Plus Yearly
- Price: $99.99/year
- Free trial: 7 days (recommended)

### 2. Configure in RevenueCat

1. In RevenueCat Dashboard → Apps → Add new app
2. Select "Play Store"
3. Enter:
   - App name: Detour Android
   - Package name: `com.detour.app`

### 3. Add Play Console Service Account

1. In Google Play Console → Setup → API access
2. Create a service account with "Finance" permissions
3. Download the JSON key file
4. In RevenueCat → App Settings → Play Console Service Account
5. Upload the JSON key

### 4. Add Products to RevenueCat

Same as iOS - add both products with matching IDs.

## Create Entitlements

Entitlements define what features users unlock.

1. Go to RevenueCat → Entitlements → Create
2. Create entitlement:
   - Identifier: `detour_plus`
   - Description: Premium features for Detour Plus subscribers

3. Attach products:
   - Add `detour_plus_monthly`
   - Add `detour_plus_yearly`

## Create Offerings

Offerings are the products displayed to users.

1. Go to RevenueCat → Offerings → Create
2. Create offering:
   - Identifier: `default`
   - Description: Default subscription offering

3. Add packages:
   - **Monthly**: `$rc_monthly` → `detour_plus_monthly`
   - **Yearly**: `$rc_annual` → `detour_plus_yearly`

4. Set as "Current Offering"

## Get API Keys

### iOS API Key

1. Go to RevenueCat → Apps → Detour iOS
2. Copy "Public SDK Key" (starts with `appl_`)
3. Add to environment:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxx
   ```

### Android API Key

1. Go to RevenueCat → Apps → Detour Android
2. Copy "Public SDK Key" (starts with `goog_`)
3. Add to environment:
   ```
   EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxx
   ```

## App Integration

### Context Setup

The app uses `RevenueCatContext` (`context/RevenueCatContext.tsx`):

```typescript
// Key exports:
- isConfigured: boolean
- isLoading: boolean
- customerInfo: CustomerInfo | null
- offerings: Offerings | null
- hasDetourPlus: boolean
- purchasePackage(pkg): Promise<CustomerInfo>
- restorePurchases(): Promise<CustomerInfo>
- presentPaywall(): Promise<PAYWALL_RESULT>
```

### Check Subscription Status

```typescript
const { hasDetourPlus } = useRevenueCat();

if (hasDetourPlus) {
  // Show premium features
} else {
  // Show paywall or limited features
}
```

### Make a Purchase

```typescript
const { offerings, purchasePackage } = useRevenueCat();

const yearlyPackage = offerings?.current?.annual;
if (yearlyPackage) {
  const customerInfo = await purchasePackage(yearlyPackage);
  // Check customerInfo.entitlements.active["detour_plus"]
}
```

### Restore Purchases

```typescript
const { restorePurchases } = useRevenueCat();

const customerInfo = await restorePurchases();
if (customerInfo?.entitlements.active["detour_plus"]) {
  // User has active subscription
}
```

## Testing

### Sandbox Testing (iOS)

1. In App Store Connect → Users and Access → Sandbox Testers
2. Create a sandbox tester account
3. On device: Settings → App Store → Sign out
4. In app, make purchase → Sign in with sandbox account
5. Purchases don't charge real money

### Test Purchases (Android)

1. In Google Play Console → Setup → License Testing
2. Add tester email addresses
3. Testers can make purchases without being charged

### RevenueCat Sandbox

RevenueCat automatically detects sandbox purchases:
- View in Dashboard → Customers
- Filter by "Sandbox"

## Webhooks (Optional)

For server-side subscription updates:

1. Go to RevenueCat → Integrations → Webhooks
2. Add webhook URL (your server endpoint)
3. Select events to receive:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `EXPIRATION`

## Troubleshooting

### Products not showing

1. Verify products are approved in App Store/Play Console
2. Check product IDs match exactly (case-sensitive)
3. Ensure products are added to an offering
4. Wait 24 hours for App Store products to propagate

### Purchases failing

1. Check API keys are correct (test vs production)
2. Verify entitlement is set up correctly
3. Check RevenueCat logs in dashboard
4. For iOS: Ensure app is signed correctly

### Sandbox not working

1. Must use physical device (not simulator for real purchases)
2. Sign out of production App Store account
3. Use dedicated sandbox tester account
4. Check RevenueCat is initialized before purchase

## Production Checklist

- [ ] Products created and approved in App Store Connect
- [ ] Products created in Google Play Console
- [ ] Products added to RevenueCat with matching IDs
- [ ] Entitlement `detour_plus` created and linked
- [ ] Default offering configured with packages
- [ ] Production API keys set in EAS secrets
- [ ] Tested sandbox purchases on both platforms
- [ ] Webhooks configured (if using server-side)
