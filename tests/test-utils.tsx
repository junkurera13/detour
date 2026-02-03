import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type Options = Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(ui: React.ReactElement, options?: Options) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider>{children}</SafeAreaProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
