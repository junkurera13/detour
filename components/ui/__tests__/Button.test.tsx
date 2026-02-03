import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';
import { renderWithProviders } from '@/tests/test-utils';

describe('Button', () => {
  it('renders the provided title', () => {
    const { getByText } = renderWithProviders(
      <Button title="Tap me" onPress={() => {}} />
    );

    expect(getByText('Tap me')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Button title="Tap me" onPress={onPress} />
    );

    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalled();
  });
});
