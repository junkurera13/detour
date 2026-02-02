import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';

export default function InviteCodeScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');

  // Debounce code input for validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim().length >= 4) {
        setDebouncedCode(code.trim().toUpperCase());
      } else {
        setDebouncedCode('');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  // Validate code with Convex
  const validation = useQuery(
    api.inviteCodes.validate,
    debouncedCode.length >= 4 ? { code: debouncedCode } : "skip"
  );

  const handleValidate = () => {
    if (validation?.isValid) {
      updateData({
        joinPath: 'invite',
        inviteCode: code.toUpperCase().trim(),
      });
      router.push('/onboarding/name');
    } else if (validation?.error) {
      setError(validation.error);
    } else {
      setError('invalid code');
    }
  };

  const isChecking = code.trim().length >= 4 && (debouncedCode !== code.trim().toUpperCase() || validation === undefined);
  const isValid = validation?.isValid === true;
  const isDisabled = code.trim().length < 4 || isChecking || !isValid;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 pt-4">
          <Text
            className="text-3xl text-black mb-3"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            enter your invite code
          </Text>
          <Text
            className="text-lg text-gray-500 mb-8"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            got an invite? enter it below to skip the waitlist
          </Text>

          <TextInput
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              setError('');
            }}
            placeholder="INVITE-CODE"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            className="w-full border-2 border-gray-200 rounded-2xl px-5 text-black"
            style={{
              fontFamily: 'InstrumentSans_500Medium',
              fontSize: 18,
              height: 56,
              lineHeight: 22,
            }}
          />

          {/* Validation status */}
          {code.trim().length >= 4 && (
            <View className="flex-row items-center mt-3">
              {isChecking ? (
                <Text
                  className="text-gray-400 text-sm"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  checking code...
                </Text>
              ) : isValid ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text
                    className="text-green-500 text-sm ml-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    valid code
                  </Text>
                </>
              ) : validation?.error ? (
                <>
                  <Ionicons name="close-circle" size={16} color="#ef4444" />
                  <Text
                    className="text-red-500 text-sm ml-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {validation.error}
                  </Text>
                </>
              ) : null}
            </View>
          )}

          {error ? (
            <Text
              className="text-red-500 mt-3 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              {error}
            </Text>
          ) : null}
        </View>

        {/* Footer */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={handleValidate}
            disabled={isDisabled}
            style={{
              backgroundColor: isDisabled ? '#E5E7EB' : '#fd6b03',
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
            }}
          >
            <Text
              className="text-lg"
              style={{
                fontFamily: 'InstrumentSans_600SemiBold',
                color: isDisabled ? '#9CA3AF' : '#fff',
              }}
            >
              {isChecking ? 'checking...' : 'continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
