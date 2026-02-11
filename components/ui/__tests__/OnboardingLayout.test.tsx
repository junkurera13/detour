import React from 'react';
import { Text } from 'react-native';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { renderWithProviders } from '@/tests/test-utils';

// Mock expo-linear-gradient (used by ProgressBar inside OnboardingLayout)
jest.mock('expo-linear-gradient', () => {
  const ReactNative = jest.requireActual('react-native');
  const MockView = ReactNative.View;
  return {
    LinearGradient: ({ style, ...props }: any) => <MockView style={style} {...props} />,
  };
});

// Mock @expo/vector-icons (Ionicons used for back button)
jest.mock('@expo/vector-icons', () => {
  const ReactNative = jest.requireActual('react-native');
  const MockText = ReactNative.Text;
  return {
    Ionicons: ({ name, ...props }: any) => <MockText {...props}>{name}</MockText>,
  };
});

// Mock the background image asset
jest.mock('@/assets/images/onboarding-pages-bg.png', () => 1);

describe('OnboardingLayout', () => {
  it('renders the title', () => {
    const { getByText } = renderWithProviders(
      <OnboardingLayout title="What is your name?">
        <Text>child content</Text>
      </OnboardingLayout>
    );

    expect(getByText('What is your name?')).toBeTruthy();
  });

  it('renders the subtitle when provided', () => {
    const { getByText } = renderWithProviders(
      <OnboardingLayout title="Your Name" subtitle="This is how it will appear on your profile">
        <Text>child content</Text>
      </OnboardingLayout>
    );

    expect(getByText('This is how it will appear on your profile')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = renderWithProviders(
      <OnboardingLayout title="Your Name">
        <Text>child content</Text>
      </OnboardingLayout>
    );

    expect(queryByText('This is how it will appear on your profile')).toBeNull();
  });

  it('renders children content', () => {
    const { getByText } = renderWithProviders(
      <OnboardingLayout title="Step Title">
        <Text>My custom child element</Text>
      </OnboardingLayout>
    );

    expect(getByText('My custom child element')).toBeTruthy();
  });

  it('renders with currentStep and totalSteps (progress bar)', () => {
    const tree = renderWithProviders(
      <OnboardingLayout title="Step" currentStep={3} totalSteps={14}>
        <Text>content</Text>
      </OnboardingLayout>
    );

    expect(tree).toBeTruthy();
  });

  it('renders footer when provided', () => {
    const { getByText } = renderWithProviders(
      <OnboardingLayout title="Step" footer={<Text>Continue</Text>}>
        <Text>content</Text>
      </OnboardingLayout>
    );

    expect(getByText('Continue')).toBeTruthy();
  });
});
