# Detour - RevenueCat Hackathon Roadmap

## Timeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Premium Features    →  PHASE 2: UX Polish  →  PHASE 3: TestFlight  │
│  (RevenueCat core value)         (Visible wins)         (Submission)         │
└─────────────────────────────────────────────────────────────────┘
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
| **Complete App Store Connect setup** | Sign Paid Apps Agreement — user info pending in App Store Connect | 🟡 **IN PROGRESS** |

> ⚠️ **NOTE:** Both paywalls have a bypass (`ALLOW_PAYWALL_BYPASS = true`) because App Store Connect Paid Apps Agreement status is "Pending User Info". Set to `false` in **both files** after agreement is active:
> - `app/onboarding/paywall.tsx` (new accounts)
> - `app/paywall.tsx` (trial expired)

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

## Phase 3: Store Submission 🟡
**Goal:** Get app on Google Play Internal Testing (priority) + TestFlight

**Strategy:** Prioritizing Android (Google Play Internal Testing) for guaranteed submission by Feb 12 deadline. TestFlight in parallel if Apple timeline allows.

| Task | Description | Status |
|------|-------------|--------|
| Apple Developer account | Ensure account is active | ✅ |
| App Store Connect | Create app record | ✅ |
| Subscription product | Create yearly subscription in App Store Connect | ✅ (Ready to Submit) |
| RevenueCat product | Link product in RevenueCat dashboard | ✅ |
| **Paid Apps Agreement** | Complete user info in App Store Connect | 🟡 **IN PROGRESS** |
| EAS Build setup | Configure eas.json for builds | ✅ |
| Privacy policy | Create privacy policy | ✅ (needs hosting) |
| App icons & splash | Finalize assets | ✅ (existing assets in place) |
| **Google Play Developer account** | Register for Google Play Console ($25) | 🟡 **IN PROGRESS** (user) |
| **Android build & upload** | EAS build + upload to Google Play Internal Testing | ⬜ |
| **Android internal testing** | Verify app works on internal testing | ⬜ |
| iOS build & upload | EAS build + submit to TestFlight | ⬜ (after Paid Apps Agreement) |
| TestFlight testing | Verify app works on TestFlight | ⬜ |

---

## Phase 4: Demo Polish ⬜
**Goal:** Judges can experience the app quickly

| Task | Description | Status |
|------|-------------|--------|
| Seed demo data | Profiles to swipe, existing matches | ⬜ |
| Sandbox purchases | Test purchase flow works | ⬜ |
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

*Last updated: February 7, 2026*

---

## Notes

**Paywall Architecture:**
- `app/onboarding/paywall.tsx` - For new subscriptions (new users + pending users who get approved/invite code)
- `app/paywall.tsx` - For existing users whose free trial has expired

**Pending BRN:**
Korean Business Registration Number (BRN) is required to complete the Paid Apps Agreement in App Store Connect. Once received:
1. Complete Korean tax form in App Store Connect
2. Sign Paid Apps Agreement
3. Set `ALLOW_PAYWALL_BYPASS = false` in both paywall files
4. Test sandbox purchases
