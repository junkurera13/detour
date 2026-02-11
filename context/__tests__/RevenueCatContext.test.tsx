import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { renderHook, act, fireEvent } from '@testing-library/react-native';
import { RevenueCatProvider, useRevenueCat, DETOUR_PLUS_ENTITLEMENT } from '@/context/RevenueCatContext';
import { renderWithProviders } from '@/tests/test-utils';

// Mock @clerk/clerk-expo
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn().mockReturnValue({
    userId: 'test-user-123',
    isLoaded: true,
  }),
}));

// Mock @/lib/env
jest.mock('@/lib/env', () => ({
  env: {
    revenueCatIosKey: 'test-ios-key',
    revenueCatAndroidKey: 'test-android-key',
    revenueCatKey: 'test-key',
  },
}));

describe('RevenueCatContext', () => {
  it('throws error when useRevenueCat is used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useRevenueCat());
    }).toThrow('useRevenueCat must be used within a RevenueCatProvider');

    consoleSpy.mockRestore();
  });

  it('provides initial state values through context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RevenueCatProvider>{children}</RevenueCatProvider>
    );

    const { result } = renderHook(() => useRevenueCat(), { wrapper });

    expect(result.current.customerInfo).toBeNull();
    expect(result.current.offerings).toBeNull();
    expect(result.current.hasDetourPlus).toBe(false);
  });

  it('exposes purchase functions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RevenueCatProvider>{children}</RevenueCatProvider>
    );

    const { result } = renderHook(() => useRevenueCat(), { wrapper });

    expect(typeof result.current.refreshCustomerInfo).toBe('function');
    expect(typeof result.current.refreshOfferings).toBe('function');
    expect(typeof result.current.purchasePackage).toBe('function');
    expect(typeof result.current.restorePurchases).toBe('function');
    expect(typeof result.current.presentPaywall).toBe('function');
    expect(typeof result.current.presentPaywallIfNeeded).toBe('function');
    expect(typeof result.current.openCustomerCenter).toBe('function');
  });

  it('exports the DETOUR_PLUS_ENTITLEMENT constant', () => {
    expect(DETOUR_PLUS_ENTITLEMENT).toBe('detour_plus');
  });

  it('renders children within the provider', () => {
    const { getByText } = renderWithProviders(
      <RevenueCatProvider>
        <Text>App Content</Text>
      </RevenueCatProvider>
    );

    expect(getByText('App Content')).toBeTruthy();
  });
});
