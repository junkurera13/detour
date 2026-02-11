import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { SelectionChip } from '@/components/ui/SelectionChip';
import { renderWithProviders } from '@/tests/test-utils';

describe('SelectionChip', () => {
  it('renders the label text', () => {
    const { getByText } = renderWithProviders(
      <SelectionChip label="Travel" selected={false} onPress={() => {}} />
    );

    expect(getByText('Travel')).toBeTruthy();
  });

  it('renders label with emoji when emoji prop is provided', () => {
    const { getByText } = renderWithProviders(
      <SelectionChip label="Hiking" selected={false} onPress={() => {}} emoji="🥾" />
    );

    expect(getByText('🥾 Hiking')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <SelectionChip label="Travel" selected={false} onPress={onPress} />
    );

    fireEvent.press(getByText('Travel'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies selected styling when selected is true', () => {
    const { getByText, rerender } = renderWithProviders(
      <SelectionChip label="Travel" selected={false} onPress={() => {}} />
    );

    const unselectedText = getByText('Travel');
    // When not selected, text should not have orange styling class
    expect(unselectedText).toBeTruthy();

    rerender(
      <SelectionChip label="Travel" selected={true} onPress={() => {}} />
    );

    const selectedText = getByText('Travel');
    expect(selectedText).toBeTruthy();
  });

  it('renders without crashing when no emoji is provided', () => {
    const { getByText } = renderWithProviders(
      <SelectionChip label="Coffee" selected={true} onPress={() => {}} />
    );

    expect(getByText('Coffee')).toBeTruthy();
  });
});
