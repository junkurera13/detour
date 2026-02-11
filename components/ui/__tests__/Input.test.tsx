import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Input } from '@/components/ui/Input';
import { renderWithProviders } from '@/tests/test-utils';

describe('Input', () => {
  it('renders the placeholder text', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <Input value="" onChangeText={() => {}} placeholder="Enter your name" />
    );

    expect(getByPlaceholderText('Enter your name')).toBeTruthy();
  });

  it('displays the current value', () => {
    const { getByDisplayValue } = renderWithProviders(
      <Input value="John" onChangeText={() => {}} placeholder="Enter your name" />
    );

    expect(getByDisplayValue('John')).toBeTruthy();
  });

  it('calls onChangeText when text is entered', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <Input value="" onChangeText={onChangeText} placeholder="Enter your name" />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your name'), 'Jane');
    expect(onChangeText).toHaveBeenCalledWith('Jane');
  });

  it('renders label text when label prop is provided', () => {
    const { getByText } = renderWithProviders(
      <Input value="" onChangeText={() => {}} label="Full Name" placeholder="Enter name" />
    );

    expect(getByText('Full Name')).toBeTruthy();
  });

  it('does not render label text when label prop is not provided', () => {
    const { queryByText } = renderWithProviders(
      <Input value="" onChangeText={() => {}} placeholder="Enter name" />
    );

    // No label should be rendered
    expect(queryByText('Full Name')).toBeNull();
  });

  it('renders prefix text when prefix prop is provided', () => {
    const { getByText } = renderWithProviders(
      <Input value="" onChangeText={() => {}} placeholder="username" prefix="@" />
    );

    expect(getByText('@')).toBeTruthy();
  });
});
