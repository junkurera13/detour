import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

process.env.EXPO_PUBLIC_CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? 'https://example.convex.cloud';
process.env.EXPO_PUBLIC_CONVEX_SITE_URL =
  process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? 'https://example.convex.site';
process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'test_clerk_key';

jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router');
  return {
    ...actual,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    Stack: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
