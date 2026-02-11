# Detour - Technical Documentation

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React Native + Expo SDK | 54 |
| **Language** | TypeScript | 5.9 (strict mode) |
| **Routing** | expo-router (file-based) | 6.0 |
| **Backend** | Convex (real-time DB + serverless functions + file storage) | 1.31 |
| **Authentication** | Clerk (email, Google, Apple sign-in) | 2.19 |
| **Payments** | RevenueCat (react-native-purchases + react-native-purchases-ui) | 9.7 |
| **Styling** | NativeWind (Tailwind CSS for React Native) | 4.2 |
| **Notifications** | Expo Notifications | 0.32 |
| **State Management** | React Context API | - |

---

## 2. High-Level Architecture Overview

### Provider Chain

The app initializes services in a layered provider architecture:

```
ClerkProvider (auth)
  └─ SafeAreaProvider
       └─ RevenueCatProvider (payments)
            └─ ConvexProviderWithClerk (backend + auth bridge)
                 └─ NotificationsProvider (push)
                      └─ OnboardingProvider (form state)
                           └─ EventsProvider
                                └─ Stack Router
```

### Routing & User Flow

expo-router provides file-based routing. The app entry point (`app/index.tsx`) determines where to send the user based on auth and subscription state:

```
User Launch
    │
    ├─ Not signed in ──────────────────────► Welcome Screen
    │
    ├─ Signed in, no profile ──────────────► Onboarding (18-step flow)
    │                                             │
    │                                             ├─ Profile setup (name, photos, preferences...)
    │                                             ├─ Join path (apply or enter invite code)
    │                                             └─ Paywall (RevenueCat subscription)
    │                                                   │
    │                                                   ├─ Approved ──► Main App
    │                                                   └─ Applied ───► Pending Screen
    │
    ├─ Signed in, pending approval ────────► Pending Screen
    │
    ├─ Signed in, approved, no subscription ► Trial Expired Paywall
    │
    └─ Signed in, approved, subscribed ────► Main App (5 tabs)
                                                 ├─ Nearby (swipe discovery)
                                                 ├─ Explore (browse users)
                                                 ├─ Matches (connections + "Likes You")
                                                 ├─ Messages (real-time chat)
                                                 └─ Profile
```

### Backend (Convex)

Convex serves as the real-time database, serverless function runtime, and file storage layer. Key tables:

- **users** - Full profiles with location, preferences, photos, and approval status
- **matches** - Mutual like tracking with status lifecycle
- **swipes** - Like/pass/superlike records with automatic match detection
- **messages** - Real-time chat with read receipts and push notifications
- **inviteCodes** - Viral growth system with usage tracking and auto-approval
- **profileViews** - "Who viewed my profile" tracking
- **activities** - Event hosting with attendee management
- **helpRequests/helpOffers** - Builder-to-builder help marketplace
- **reports/blockedUsers** - Moderation system

All queries are reactive — UI updates instantly when data changes on any client.

### Authentication (Clerk)

Clerk manages authentication with three sign-in methods (email, Google OAuth, Apple OAuth). A custom JWT template named "convex" bridges Clerk tokens to the Convex backend, allowing serverless functions to authenticate users. User identity is synced to both Convex (for data access) and RevenueCat (for subscription tracking) using the Clerk user ID.

---

## 3. RevenueCat Implementation

### SDK Initialization

RevenueCat is initialized inside `RevenueCatContext.tsx`, which wraps the entire app. Configuration happens after Clerk authentication loads, ensuring the RevenueCat user ID matches the Clerk user ID:

```typescript
Purchases.configure({ apiKey, appUserID: userId });
```

- **Platform-specific API keys**: Separate keys for iOS (`appl_`) and Android (`goog_`) loaded from environment variables
- **Web**: RevenueCat is skipped entirely on web (`Platform.OS === 'web'` returns early)
- **User sync**: When a Clerk user logs in or out, RevenueCat's `logIn()` / `logOut()` are called to keep identities aligned
- **Listener**: A `CustomerInfoUpdateListener` keeps subscription state in sync in real time

### Context API

The `RevenueCatContext` exposes the following to the entire app via the `useRevenueCat()` hook:

```typescript
{
  isConfigured: boolean;        // SDK ready
  isLoading: boolean;           // Fetching offerings/customer info
  customerInfo: CustomerInfo;   // Full subscription data
  offerings: PurchasesOfferings; // Available products
  hasDetourPlus: boolean;       // Quick entitlement check
  purchasePackage(pkg);         // Trigger purchase flow
  restorePurchases();           // Restore previous purchases
  presentPaywall();             // Show RevenueCat native paywall
  openCustomerCenter();         // Subscription management UI
}
```

The key property is `hasDetourPlus`, computed as:

```typescript
Boolean(customerInfo?.entitlements.active?.["detour_plus"])
```

This single boolean drives all subscription gating throughout the app.

### Entitlement

| Entitlement ID | Description |
|---------------|-------------|
| `detour_plus` | Unlocks all premium features |

### Two-Paywall Architecture

The app uses two distinct paywall screens for different user journeys:

**1. Onboarding Paywall** (`app/onboarding/paywall.tsx`)
- Shown to new users completing the 18-step onboarding flow
- Offers a 7-day free trial on the annual subscription
- After successful purchase or trial start:
  - Creates the user record in Convex with all profile data
  - Uploads photos to Convex file storage
  - Consumes invite code if applicable (auto-approves user)
  - Routes to the main app (approved) or pending screen (applied without invite)

**2. Trial Expired Paywall** (`app/paywall.tsx`)
- Shown to existing users whose free trial has ended
- No free trial offered — requires a paid subscription to continue
- Simpler flow: subscribing routes directly back to the main app
- Includes a logout option for users who choose not to subscribe

### Subscription Gating

Subscription status is enforced at the app level in `app/index.tsx`. Users without an active subscription (either a running trial or a paid plan) are routed to the appropriate paywall before they can access any part of the main app. There is no partial or feature-level gating — the app is fully accessible once subscribed and fully locked otherwise.

### Error Handling

- User cancellation: Returns `null` gracefully (no error thrown)
- Network/purchase errors: Caught and displayed via alert dialogs
- Expo Go (development): RevenueCat configuration errors are caught silently since native modules aren't available in Expo Go
- Restore purchases: Validates that `detour_plus` entitlement is active before granting access

---

## 4. Monetization Setup

### Subscription Product

| Product ID | Duration | Price | Free Trial |
|-----------|----------|-------|------------|
| `detour_plus_yearly` | 1 year | $99.99/year | 7 days (new users only) |

### RevenueCat Dashboard Configuration

- **Entitlement**: `detour_plus` — single entitlement that unlocks all premium features
- **Offering**: Default offering containing the annual package
- **Package**: `$rc_annual`, mapped to platform-specific store products
- **Free Trial**: 7-day introductory offer configured at the store product level (Google Play / App Store), available only to new subscribers during onboarding

### Purchase Flow

**New users (onboarding):**
```
User taps "Start Free Trial"
    │
    ├─ RevenueCat opens native payment sheet (Google Play / App Store)
    │
    ├─ Purchase succeeds (7-day trial begins)
    │     ├─ CustomerInfo updated with active "detour_plus" entitlement
    │     ├─ hasDetourPlus becomes true
    │     ├─ User record created in Convex + photos uploaded
    │     └─ User routed to main app or pending screen
    │
    └─ Purchase cancelled or fails
          └─ User stays on paywall (can retry or restore purchases)
```

**Returning users (trial expired):**
```
User taps "Subscribe"
    │
    ├─ RevenueCat opens native payment sheet ($99.99/year, no trial)
    │
    ├─ Purchase succeeds
    │     ├─ CustomerInfo updated with active "detour_plus" entitlement
    │     ├─ hasDetourPlus becomes true
    │     └─ User routed back to main app
    │
    └─ Purchase cancelled or fails
          └─ User stays on paywall (can retry, restore purchases, or log out)
```

### Trial Timeline

```
Day 0: New user starts 7-day free trial → full access
Day 5: Store sends reminder that trial is ending
Day 7: Automatic charge of $99.99/year
       If user cancels before Day 7 → no charge, access revoked
       If trial expires without renewal → user sees Trial Expired Paywall
```

### What Detour+ Unlocks

An active Detour+ subscription (trial or paid) grants full access to the app:
- Discovery — swipe and explore nearby nomads
- Messaging — unlimited real-time conversations
- Matches — see who liked you and manage connections
- Profile views — see who visited your profile
- Activities — browse and host events
- Help marketplace — request and offer builder-to-builder help

### Platform Status

| Platform | Status | Notes |
|----------|--------|-------|
| **Android** | Live | Google Play Internal Testing, subscriptions verified with license tester |
| **iOS** | Pending | Blocked on App Store Connect Paid Apps Agreement (Korean BRN requirement) |

### Revenue Tracking

RevenueCat Dashboard provides:
- Real-time subscription analytics (MRR, trial conversions, churn)
- Cohort analysis by acquisition date
- Sandbox vs. production purchase filtering
- Customer timeline for individual subscriber debugging
