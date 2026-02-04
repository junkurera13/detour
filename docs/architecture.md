# Architecture

This document describes the technical architecture of Detour.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Screens   │  │   Hooks     │  │       Contexts          │ │
│  │  (app/)     │  │  (hooks/)   │  │  - Onboarding           │ │
│  │             │  │             │  │  - RevenueCat           │ │
│  │             │  │             │  │  - Notifications        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                   │                    │
          ▼                   ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│     Clerk       │  │     Convex      │  │    RevenueCat       │
│  (Auth)         │  │  (Backend)      │  │  (Payments)         │
│                 │  │                 │  │                     │
│  - Phone Auth   │  │  - Database     │  │  - Subscriptions    │
│  - Google OAuth │  │  - Functions    │  │  - Entitlements     │
│  - Apple OAuth  │  │  - File Storage │  │  - Customer Center  │
│  - JWT Tokens   │  │  - Scheduling   │  │                     │
└─────────────────┘  └─────────────────┘  └─────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Expo Push     │
                    │   Service       │
                    │                 │
                    │  - FCM (Android)│
                    │  - APNs (iOS)   │
                    └─────────────────┘
```

## Data Flow

### Authentication Flow

```
User opens app
    │
    ▼
Clerk checks session (tokenCache)
    │
    ├── Session exists ──► Convex validates JWT ──► Load user data
    │
    └── No session ──► Show landing screen
                           │
                           ▼
                    User signs in (Phone/Google/Apple)
                           │
                           ▼
                    Clerk creates session + JWT
                           │
                           ▼
                    Check if user exists in Convex
                           │
                    ├── Exists ──► Navigate to main app
                    │
                    └── New user ──► Start onboarding flow
```

### Matching Flow

```
User A views profiles (Nearby tab)
    │
    ▼
Swipe right (like) on User B
    │
    ▼
swipes.create mutation
    │
    ▼
Check for reverse swipe from User B
    │
    ├── User B already liked User A ──► Create match
    │                                      │
    │                                      ▼
    │                               Send push notifications
    │                               to both users
    │
    └── No reverse swipe ──► Store swipe, continue
```

### Messaging Flow

```
User opens chat with match
    │
    ▼
messages.getByMatch query (real-time subscription)
    │
    ▼
User sends message
    │
    ▼
messages.send mutation
    │
    ├── Insert message to DB
    │
    └── Schedule push notification to recipient
           │
           ▼
    notifications.sendMessageNotification (internal action)
           │
           ▼
    Expo Push API ──► Recipient's device
```

### Photo Upload Flow

```
User selects photo (expo-image-picker)
    │
    ▼
Local URI stored in OnboardingContext
    │
    ▼
User completes onboarding
    │
    ▼
files.generateUploadUrl mutation
    │
    ▼
POST blob to Convex storage URL
    │
    ▼
files.getUrl mutation (converts storage ID to public URL)
    │
    ▼
Store public URLs in user.photos array
```

## Directory Structure

```
detour/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Main app tabs (authenticated)
│   │   ├── index.tsx      # Nearby/Discovery
│   │   ├── explore.tsx    # Explore destinations
│   │   ├── matches.tsx    # Matches & Messages list
│   │   ├── help.tsx       # Help/Marketplace
│   │   └── profile.tsx    # User profile
│   ├── onboarding/        # Onboarding flow screens
│   ├── chat/              # Chat screens
│   │   └── [matchId].tsx  # Individual chat
│   ├── _layout.tsx        # Root layout (providers)
│   └── index.tsx          # Landing screen
│
├── convex/                 # Backend (Convex)
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User queries/mutations
│   ├── matches.ts         # Match queries/mutations
│   ├── messages.ts        # Message queries/mutations
│   ├── swipes.ts          # Swipe logic + match creation
│   ├── files.ts           # File storage
│   ├── notifications.ts   # Push notification actions
│   ├── inviteCodes.ts     # Invite code management
│   └── seed.ts            # Database seeding
│
├── components/             # Reusable components
│   ├── ui/                # UI primitives
│   └── ErrorBoundary.tsx  # Error boundary
│
├── context/               # React Context providers
│   ├── OnboardingContext.tsx
│   ├── RevenueCatContext.tsx
│   └── NotificationsContext.tsx
│
├── hooks/                 # Custom React hooks
│   ├── useNotifications.ts
│   ├── usePhotoUpload.ts
│   ├── useCurrentUser.ts
│   └── useAuthenticatedUser.ts
│
├── lib/                   # Shared utilities
│   ├── env.ts            # Environment variables
│   └── tokenCache.ts     # Clerk token cache
│
└── docs/                  # Documentation
```

## Database Schema

### Users Table

| Field | Type | Description |
|-------|------|-------------|
| tokenIdentifier | string? | Clerk JWT subject |
| email | string? | User email |
| phone | string? | Phone number |
| name | string | Display name |
| username | string | Unique username |
| birthday | string | ISO date string |
| gender | string | Gender identity |
| lookingFor | string[] | ["friends", "dating"] |
| datingPreference | string[]? | Gender preferences |
| lifestyle | string[] | Nomad lifestyle tags |
| timeNomadic | string | How long nomadic |
| interests | string[] | Interest tags |
| photos | string[] | Photo URLs (Convex storage) |
| instagram | string? | Instagram handle |
| currentLocation | string | Current city |
| futureTrip | string? | Next destination |
| joinPath | string | "invite" or "apply" |
| inviteCode | string? | Code used to join |
| userStatus | string | "pending", "approved", "rejected" |
| expoPushToken | string? | Push notification token |

### Matches Table

| Field | Type | Description |
|-------|------|-------------|
| user1Id | Id<users> | First user in match |
| user2Id | Id<users> | Second user in match |
| status | string | "matched", "unmatched" |
| user1Action | string? | "like", "superlike" |
| user2Action | string? | "like", "superlike" |
| matchedAt | number? | Timestamp of match |

### Messages Table

| Field | Type | Description |
|-------|------|-------------|
| matchId | Id<matches> | Parent match |
| senderId | Id<users> | Message sender |
| content | string | Message text |
| messageType | string | "text", "image", "location" |
| readAt | number? | Read timestamp |

### Swipes Table

| Field | Type | Description |
|-------|------|-------------|
| swiperId | Id<users> | User who swiped |
| swipedId | Id<users> | User who was swiped on |
| action | string | "like", "pass", "superlike" |

### InviteCodes Table

| Field | Type | Description |
|-------|------|-------------|
| code | string | Invite code (uppercase) |
| createdBy | Id<users>? | Creator |
| usedBy | Id<users>? | Last user who used it |
| maxUses | number | Max allowed uses |
| currentUses | number | Current use count |
| expiresAt | number? | Expiration timestamp |
| isActive | boolean | Whether code is active |

## Technology Decisions

### Why Convex?

- **Real-time by default**: Queries automatically re-run when data changes
- **Type-safe**: End-to-end TypeScript from schema to frontend
- **Serverless**: No infrastructure to manage
- **File storage**: Built-in blob storage with URL generation
- **Scheduling**: Can schedule actions for push notifications

### Why Clerk?

- **Multiple auth methods**: Phone, Google, Apple in one SDK
- **Expo integration**: Works with Expo managed workflow
- **JWT integration**: Easy to connect with Convex via JWT templates
- **Secure token storage**: Uses expo-secure-store

### Why RevenueCat?

- **Cross-platform**: Same API for iOS and Android
- **Subscription management**: Handles renewals, cancellations, upgrades
- **Analytics**: Built-in subscription metrics
- **Sandbox testing**: Easy to test without real payments

### Why Expo Notifications?

- **Unified API**: Same code for iOS and Android
- **Free push service**: Expo Push API has no cost
- **EAS integration**: Works seamlessly with EAS builds
- **Deep linking**: Built-in support for notification taps
