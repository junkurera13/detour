# Detour - RevenueCat Hackathon Roadmap

## Timeline Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: Premium Features  →  PHASE 2: UX Polish  →  PHASE 3: Android Release  │
│  (RevenueCat core value)       (Visible wins)         (Google Play Internal)     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Hard Paywall + Free Trial ✅
**Goal:** Full features behind paywall with 7-day free trial

| Task | Description | Status |
|------|-------------|--------|
| Hard paywall gate | Block app access without active subscription/trial | ✅ |
| 7-day free trial | Configure trial period in RevenueCat | ✅ |
| Trial expiration handling | Show paywall when trial ends | ✅ |
| Subscription check on launch | Verify entitlement status on app open | ✅ |
| RevenueCat dashboard | Create entitlement + offerings with trial | ✅ |
| Google Play subscription | Product linked, tested with license tester | ✅ |
| "Likes You" unlock | Cards unlocked for subscribers/trial users | ✅ |

---

## Phase 2: UX Polish 🟡
**Goal:** Make the app feel professional

| Task | Description | Status |
|------|-------------|--------|
| Swipe gestures | Gesture-based swipe with Reanimated | ✅ |
| Compatibility % badge | Show match % on profile cards | ⬜ |
| Image sharing | Send photos in chat | ✅ |
| Block users | Block from chat/profile | ✅ |

---

## Phase 3: Android Release ✅
**Goal:** Get app on Google Play Internal Testing by Feb 12 deadline

**Strategy:** Fully focused on Android (Google Play Internal Testing). iOS/TestFlight is deferred — Apple Paid Apps Agreement timeline won't resolve before the deadline.

| Task | Description | Status |
|------|-------------|--------|
| Google Play Developer account | Register for Google Play Console ($25) | ✅ (registered, identity verified) |
| EAS Build setup | Configure eas.json for builds | ✅ (eas.json created, EAS CLI installed, project linked) |
| Privacy policy | Create and host privacy policy | ✅ (hosted at https://junkurera13.github.io/detour/privacy-policy.html) |
| App icons & splash | Finalize assets | ✅ (assets exist in assets/images/) |
| RevenueCat product | Link product in RevenueCat dashboard | ✅ |
| Android build & upload | EAS build + upload to Google Play Internal Testing | ✅ |
| Android internal testing | App verified on Android emulator, purchase flow tested | ✅ |

> **NOTE:** `expo-auth-session` was added as a required peer dependency for `@clerk/clerk-expo`.

### Deferred (iOS)

iOS release is deferred to post-hackathon. The following are complete and ready to resume once the Apple Paid Apps Agreement is processed:

| Task | Description | Status |
|------|-------------|--------|
| Apple Developer account | Account is active | ✅ |
| App Store Connect | App record created | ✅ |
| Subscription product | Yearly subscription in App Store Connect | ✅ (Ready to Submit) |
| Paid Apps Agreement | Waiting for Korean BRN / Apple processing | 🟡 BLOCKED |
| iOS build & upload | EAS build + submit to TestFlight | ⬜ (after Paid Apps Agreement) |
| TestFlight testing | Verify app works on TestFlight | ⬜ |

---

## Phase 4: Demo Polish ⬜
**Goal:** Judges can experience the app quickly

| Task | Description | Status |
|------|-------------|--------|
| Seed demo data | Profiles to swipe, existing matches | ⬜ |
| Sandbox purchases | Test purchase flow works | ✅ (verified with Google Play license tester) |
| Bug fixes | Fix any rough edges | ⬜ |

---

## Already Complete ✅

| Feature | Details |
|---------|---------|
| Authentication | Clerk (phone, Google, Apple) |
| Backend | Convex (users, matches, messages, swipes) |
| Onboarding | 18-step flow with custom paywall |
| Discovery & Swiping | Like/pass with match detection |
| Messaging | Real-time chat |
| Photo Upload | Convex File Storage with progress |
| Push Notifications | Expo Notifications + triggers |
| Edit Profile | Full editing screen |
| RevenueCat SDK | Integrated with Clerk user sync |
| Custom Paywall | Monthly/yearly plans UI |
| Subscription Status | `hasDetourPlus` entitlement check |
| Customer Center | Manage subscription |
| Swipe Gestures | Pan gestures with Reanimated + haptics |

---

## Out of Scope

- iOS / TestFlight release (deferred to post-hackathon)
- Testing suite
- Security audits
- Content moderation
- Analytics
- i18n
- Background location
- Message reactions
- Report users
- Undo swipe

---

## Key Files

| File | Purpose |
|------|---------|
| `context/RevenueCatContext.tsx` | RevenueCat provider |
| `app/onboarding/paywall.tsx` | Paywall for new accounts (onboarding + pending users with invite code) |
| `app/paywall.tsx` | Paywall for trial expired users |
| `app/pending.tsx` | Waitlist screen for pending users |
| `app/(tabs)/matches.tsx` | "Likes You" section |
| `app/(tabs)/index.tsx` | Swipe screen |
| `app/chat/[matchId].tsx` | Chat screen |

---

*Last updated: February 9, 2026*

---

## Notes

**Paywall Architecture:**
- `app/onboarding/paywall.tsx` - For new subscriptions (new users + pending users who get approved/invite code)
- `app/paywall.tsx` - For existing users whose free trial has expired

**Pending BRN (iOS only):**
Korean Business Registration Number (BRN) is required to complete the Paid Apps Agreement in App Store Connect. Once received:
1. Complete Korean tax form in App Store Connect
2. Sign Paid Apps Agreement
3. Test sandbox purchases on iOS
