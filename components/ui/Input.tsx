import { TextInput, View, Text } from 'react-native';
import { useState } from 'react';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  prefix?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  multiline = false,
  numberOfLines = 1,
  prefix,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full">
      {label && (
        <Text
          className="text-sm text-gray-500 mb-2"
          style={{ fontFamily: 'InstrumentSans_500Medium' }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F9FAFB',
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderWidth: 2,
          borderColor: isFocused ? '#000' : 'transparent',
        }}
      >
        {prefix && (
          <Text
            style={{
              fontSize: 18,
              color: '#9CA3AF',
              fontFamily: 'InstrumentSans_400Regular',
              marginRight: 4,
            }}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            fontSize: 18,
            color: '#000',
            fontFamily: 'InstrumentSans_400Regular',
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : undefined,
            padding: 0,
          }}
        />
      </View>
    </View>
  );
}
