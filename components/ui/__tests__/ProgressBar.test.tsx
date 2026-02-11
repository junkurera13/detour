import React from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { renderWithProviders } from '@/tests/test-utils';

// Mock expo-linear-gradient since it uses native modules
jest.mock('expo-linear-gradient', () => {
  const ReactNative = jest.requireActual('react-native');
  const MockView = ReactNative.View;
  return {
    LinearGradient: ({ style, testID, ...props }: any) => (
      <MockView style={style} testID={testID} {...props} />
    ),
  };
});

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const tree = renderWithProviders(
      <ProgressBar current={3} total={10} />
    );

    expect(tree).toBeTruthy();
  });

  it('renders with zero progress', () => {
    const tree = renderWithProviders(
      <ProgressBar current={0} total={10} />
    );

    expect(tree).toBeTruthy();
  });

  it('renders with full progress', () => {
    const tree = renderWithProviders(
      <ProgressBar current={10} total={10} />
    );

    expect(tree).toBeTruthy();
  });

  it('renders with partial progress', () => {
    const tree = renderWithProviders(
      <ProgressBar current={5} total={14} />
    );

    expect(tree).toBeTruthy();
  });
});
