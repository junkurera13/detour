# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Detour is a React Native/Expo dating app for digital nomads. Currently a high-fidelity UI prototype (no backend integration).

## Development Commands

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run web version
npm run lint       # Run ESLint
```

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Routing**: expo-router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State**: React Context API
- **Language**: TypeScript (strict mode enabled)
- **Fonts**: Instrument Sans/Serif (Google Fonts)

## Architecture

### Directory Structure

- `app/` - File-based routes (expo-router)
  - `onboarding/` - 13-step onboarding flow (auth, profile setup, paywall)
  - `(tabs)/` - Main app with 5 tabs (Nearby, Explore, Matches, Messages, Profile)
- `components/` - Reusable components
  - `ui/` - UI primitives (Button, Input, SelectionChip, OnboardingLayout, ProgressBar)
- `context/` - React Context providers (OnboardingContext)
- `hooks/` - Custom React hooks
- `constants/` - Theme colors and fonts
- `assets/images/` - Icons and brand assets

### Routing Pattern

expo-router uses file-based routing:
- `app/index.tsx` → `/` (welcome screen)
- `app/onboarding/name.tsx` → `/onboarding/name`
- `app/(tabs)/index.tsx` → main app home (Nearby tab)

The `_layout.tsx` files configure navigation (Stack for onboarding, Tabs for main app).

### State Management

Global onboarding state managed via `OnboardingContext`:
```typescript
interface OnboardingData {
  name: string;
  birthday: Date | null;
  gender: string;
  lookingFor: 'friends' | 'dating' | 'both' | null;
  datingPreference: string[];
  lifestyle: string[];
  timeNomadic: string;
  interests: string[];
  photos: string[];
  instagram: string;
  currentLocation: string;
  futureTrip: string;
  hasCompletedOnboarding: boolean;
}
```

Access with `useOnboarding()` hook inside components.

### Styling with NativeWind

Use Tailwind classes via the `className` prop:
```tsx
<View className="flex-1 bg-white px-6">
  <Text className="text-2xl font-bold text-orange-primary">Hello</Text>
</View>
```

Custom colors defined in `tailwind.config.js`:
- `orange-primary`: #fd6b03 (main brand color)
- `orange-secondary`: #fca560

### UI Component Patterns

Onboarding screens use the `OnboardingLayout` wrapper:
```tsx
<OnboardingLayout
  step={3}
  totalSteps={13}
  title="Screen Title"
  subtitle="Description text"
>
  {/* Screen content */}
</OnboardingLayout>
```

Button variants: `primary`, `secondary`, `outline`, `ghost`

### Platform-Specific Code

Files with extensions `.ios.ts`, `.android.ts`, `.web.ts` are loaded based on platform.

## Current State

This is a UI prototype with mock data. See `ROADMAP.md` for production requirements including:
- Backend API integration (not started)
- Authentication system (UI only, no implementation)
- Data persistence (none - data lost on restart)
- Testing (0 test files)
- Payment processing (UI only)
