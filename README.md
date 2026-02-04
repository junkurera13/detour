# Detour

A React Native dating app for digital nomads, built with Expo.

## Overview

Detour helps digital nomads connect with like-minded travelers. Features include:
- Profile discovery based on location
- Real-time messaging
- Match notifications
- Subscription-based premium features

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile** | React Native + Expo SDK 54 |
| **Routing** | Expo Router (file-based) |
| **Backend** | Convex (DB + functions + file storage) |
| **Auth** | Clerk (phone, Google, Apple) |
| **Payments** | RevenueCat (subscriptions) |
| **Notifications** | Expo Notifications |
| **Styling** | NativeWind (Tailwind CSS) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                       │
├─────────────────────────────────────────────────────────────┤
│  Screens (app/)  │  Contexts  │  Hooks  │  Components      │
└────────┬─────────┴─────┬──────┴────┬────┴────────┬─────────┘
         │               │           │             │
         ▼               ▼           ▼             ▼
    ┌─────────┐    ┌─────────┐  ┌─────────┐  ┌──────────┐
    │  Clerk  │    │ Convex  │  │RevenueCat│ │Expo Push │
    │  (Auth) │    │(Backend)│  │(Payments)│ │(Notifs)  │
    └─────────┘    └─────────┘  └─────────┘  └──────────┘
```

**Data Flow:**
1. User authenticates via Clerk → JWT token issued
2. Token validated by Convex → User data loaded
3. User actions (swipe, message) → Convex mutations
4. Matches/messages → Trigger push notifications
5. Subscription status → RevenueCat entitlements

See [docs/architecture.md](docs/architecture.md) for detailed diagrams.

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Xcode (iOS) or Android Studio (Android)
- Physical device for push notifications

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment variables** (see below)

4. **Start Convex backend**
   ```bash
   npx convex dev
   ```

5. **Start Expo**
   ```bash
   npx expo start
   ```

### Environment Variables

Create `.env.local` with:

```bash
# Convex
CONVEX_DEPLOYMENT=dev:your-project
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxx

# App
EXPO_PUBLIC_APP_ENV=development
```

## Project Structure

```
detour/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Main app tabs
│   ├── onboarding/        # Onboarding flow
│   ├── chat/              # Chat screens
│   └── _layout.tsx        # Root layout
├── convex/                 # Backend
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User functions
│   ├── matches.ts         # Match functions
│   ├── messages.ts        # Message functions
│   ├── swipes.ts          # Swipe + match creation
│   ├── files.ts           # File storage
│   └── notifications.ts   # Push notifications
├── components/             # UI components
├── context/               # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utilities
└── docs/                  # Documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run lint` | Lint code |
| `npm run typecheck` | Type check |
| `npm run test` | Run tests |

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design & data flow |
| [API Reference](docs/api.md) | Convex function documentation |
| [Deployment](docs/deployment.md) | Build & release guide |
| **Setup Guides** | |
| [Clerk Setup](docs/setup/clerk.md) | Authentication configuration |
| [Convex Setup](docs/setup/convex.md) | Backend configuration |
| [RevenueCat Setup](docs/setup/revenuecat.md) | Payments configuration |
| [Push Notifications](docs/setup/push-notifications.md) | Notification setup |
| [Troubleshooting](docs/troubleshooting.md) | Common issues & solutions |

## Key Features

### Authentication
- Phone (SMS verification)
- Google OAuth
- Apple Sign-In
- Secure token storage

### Discovery
- Location-based profiles
- Swipe to like/pass
- Automatic match detection

### Messaging
- Real-time chat
- Read receipts
- Message previews

### Notifications
- Match alerts
- Message notifications
- Deep linking to chat

### Subscriptions
- Free trial support
- Monthly/yearly plans
- Restore purchases

## Development

### RevenueCat Testing

RevenueCat requires a development build for purchase testing:

```bash
eas build --profile development --platform ios
```

Use sandbox/test accounts for purchases.

### Push Notification Testing

Push notifications require:
1. Physical device (not simulator)
2. EAS project configured
3. APNs key (iOS) / FCM (Android) for production

Test with [Expo Push Tool](https://expo.dev/notifications).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Proprietary - All rights reserved.
