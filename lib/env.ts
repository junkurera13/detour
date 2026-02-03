export type AppEnv = 'development' | 'staging' | 'production';

const appEnv = (process.env.EXPO_PUBLIC_APP_ENV as AppEnv) ?? 'development';

const getRequiredEnv = (name: string) => {
  const value = process.env[name];
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
  convexUrl: getRequiredEnv('EXPO_PUBLIC_CONVEX_URL'),
  convexSiteUrl: getRequiredEnv('EXPO_PUBLIC_CONVEX_SITE_URL'),
  clerkPublishableKey: getRequiredEnv('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '',
  revenueCatKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '',
};
