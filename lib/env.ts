export type AppEnv = 'development' | 'staging' | 'production';

const appEnv = (process.env.EXPO_PUBLIC_APP_ENV as AppEnv) ?? 'development';

const getRequiredEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing ${name}. Check your environment configuration.`);
  }
  return value;
};

export const env = {
  appEnv,
  isDevelopment: appEnv === 'development',
  isStaging: appEnv === 'staging',
  isProduction: appEnv === 'production',
  // Expo inlines EXPO_PUBLIC_* vars only for static property access.
  convexUrl: getRequiredEnv(process.env.EXPO_PUBLIC_CONVEX_URL, 'EXPO_PUBLIC_CONVEX_URL'),
  convexSiteUrl: getRequiredEnv(
    process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
    'EXPO_PUBLIC_CONVEX_SITE_URL'
  ),
  clerkPublishableKey: getRequiredEnv(
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'
  ),
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '',
  revenueCatKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '',
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
};
