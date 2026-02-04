# Detour - RevenueCat Hackathon Roadmap

## Timeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Premium Features    →  PHASE 2: UX Polish  →  PHASE 3: TestFlight  │
│  (RevenueCat core value)         (Visible wins)         (Submission)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Hard Paywall + Free Trial 🟡
**Goal:** Full features behind paywall with 7-day free trial

| Task | Description | Status |
|------|-------------|--------|
| Hard paywall gate | Block app access without active subscription/trial | ✅ |
| 7-day free trial | Configure trial period in RevenueCat | ⬜ (dashboard) |
| Trial expiration handling | Show paywall when trial ends | ✅ |
| Subscription check on launch | Verify entitlement status on app open | ✅ |
| RevenueCat dashboard | Create entitlement + offerings with trial | ⬜ (needs App Store Connect) |

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

## Phase 3: TestFlight Submission ⬜
**Goal:** Get app on TestFlight for hackathon eligibility

| Task | Description | Status |
|------|-------------|--------|
| Apple Developer account | Ensure account is active | ⬜ |
| App Store Connect | Create app record | ⬜ |
| EAS Build setup | Configure eas.json for production | ⬜ |
| Privacy policy | Host privacy policy URL | ⬜ |
| App icons & splash | Finalize assets | ⬜ |
| Build & upload | EAS build + submit to TestFlight | ⬜ |
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
| Onboarding | 15-step flow with custom paywall |
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
| `app/onboarding/paywall.tsx` | Custom paywall UI |
| `app/(tabs)/matches.tsx` | "Likes You" section |
| `app/(tabs)/index.tsx` | Swipe screen |
| `app/chat/[matchId].tsx` | Chat screen |

---

*Last updated: February 4, 2026*
