import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { validateInviteCode } from '@/utils/inviteCode';

export default function InviteCodeScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    setError('');
    setIsValidating(true);

    const result = await validateInviteCode(code);

    if (result.isValid) {
      updateData({
        joinPath: 'invite',
        inviteCode: code.toUpperCase().trim(),
      });
      router.push('/onboarding/name');
    } else {
      setError(result.error || 'invalid code');
    }
    setIsValidating(false);
  };

  const isDisabled = code.trim().length < 4 || isValidating;

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
              {isValidating ? 'validating...' : 'validate code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
