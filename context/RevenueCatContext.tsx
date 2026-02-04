import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useAuth } from '@clerk/clerk-expo';
import { env } from '@/lib/env';

export const DETOUR_PLUS_ENTITLEMENT = 'detour_plus';

type RevenueCatContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  hasDetourPlus: boolean;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  refreshOfferings: () => Promise<PurchasesOfferings | null>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  openCustomerCenter: () => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

const getApiKey = () => {
  if (Platform.OS === 'ios') {
    return env.revenueCatIosKey || env.revenueCatKey || '';
  }
  if (Platform.OS === 'android') {
    return env.revenueCatAndroidKey || env.revenueCatKey || '';
  }
  return '';
};

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!isLoaded) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('RevenueCat API key missing. Set EXPO_PUBLIC_REVENUECAT_*_API_KEY.');
      return;
    }

    if (!isConfigured) {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      }
      Purchases.configure({
        apiKey,
        appUserID: userId ?? undefined,
      });
      lastUserIdRef.current = userId ?? null;
      setIsConfigured(true);
      return;
    }

    if (userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId ?? null;
      if (userId) {
        Purchases.logIn(userId).catch((error) => {
          console.warn('RevenueCat logIn failed', error);
        });
      } else {
        Purchases.logOut().catch((error) => {
          console.warn('RevenueCat logOut failed', error);
        });
      }
    }
  }, [isLoaded, isConfigured, userId]);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      console.warn('Failed to fetch RevenueCat customer info', error);
      return null;
    }
  }, []);

  const refreshOfferings = useCallback(async () => {
    try {
      const latestOfferings = await Purchases.getOfferings();
      setOfferings(latestOfferings);
      return latestOfferings;
    } catch (error) {
      console.warn('Failed to fetch RevenueCat offerings', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) return;

    setIsLoading(true);
    Promise.all([refreshCustomerInfo(), refreshOfferings()]).finally(() => {
      setIsLoading(false);
    });

    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured, refreshCustomerInfo, refreshOfferings]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(updatedInfo);
      return updatedInfo;
    } catch (error: any) {
      if (error?.userCancelled) return null;
      throw error;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      console.warn('RevenueCat restore failed', error);
      return null;
    }
  }, []);

  const presentPaywall = useCallback(async () => {
    try {
      if (offerings?.current) {
        return await RevenueCatUI.presentPaywall({ offering: offerings.current });
      }
      return await RevenueCatUI.presentPaywall();
    } catch (error) {
      console.warn('RevenueCat paywall error', error);
      return PAYWALL_RESULT.ERROR;
    }
  }, [offerings?.current]);

  const presentPaywallIfNeeded = useCallback(async () => {
    try {
      return await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: DETOUR_PLUS_ENTITLEMENT,
      });
    } catch (error) {
      console.warn('RevenueCat paywall-if-needed error', error);
      return PAYWALL_RESULT.ERROR;
    }
  }, []);

  const openCustomerCenter = useCallback(async () => {
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.warn('RevenueCat customer center error', error);
    }
  }, []);

  const hasDetourPlus = useMemo(
    () => Boolean(customerInfo?.entitlements.active?.[DETOUR_PLUS_ENTITLEMENT]),
    [customerInfo]
  );

  const value = useMemo<RevenueCatContextValue>(
    () => ({
      isConfigured,
      isLoading,
      customerInfo,
      offerings,
      hasDetourPlus,
      refreshCustomerInfo,
      refreshOfferings,
      purchasePackage,
      restorePurchases,
      presentPaywall,
      presentPaywallIfNeeded,
      openCustomerCenter,
    }),
    [
      isConfigured,
      isLoading,
      customerInfo,
      offerings,
      hasDetourPlus,
      refreshCustomerInfo,
      refreshOfferings,
      purchasePackage,
      restorePurchases,
      presentPaywall,
      presentPaywallIfNeeded,
      openCustomerCenter,
    ]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}
