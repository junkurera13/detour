import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type Options = Omit<RenderOptions, 'wrapper'>;

// Mock metrics for SafeAreaProvider in test environment
const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function renderWithProviders(ui: React.ReactElement, options?: Options) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={initialMetrics}>{children}</SafeAreaProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
