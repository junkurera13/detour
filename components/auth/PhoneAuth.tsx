import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn, useSignUp, isClerkAPIResponseError } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

interface PhoneAuthProps {
  mode: 'signIn' | 'signUp';
  onSuccess: () => void;
  onBack: () => void;
}

export function PhoneAuth({ mode, onSuccess, onBack }: PhoneAuthProps) {
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'signUp') {
        await signUp!.create({ phoneNumber });
        await signUp!.preparePhoneNumberVerification({ strategy: 'phone_code' });
      } else {
        const { supportedFirstFactors } = await signIn!.create({
          identifier: phoneNumber,
        });

        const phoneCodeFactor = supportedFirstFactors?.find(
          (factor) => factor.strategy === 'phone_code'
        ) as { strategy: 'phone_code'; phoneNumberId: string } | undefined;

        if (phoneCodeFactor?.phoneNumberId) {
          await signIn!.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneCodeFactor.phoneNumberId,
          });
        } else {
          setError('Phone verification not available');
          setIsLoading(false);
          return;
        }
      }
      setPendingVerification(true);
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const message = err.errors[0]?.message || 'Failed to send code';
        // If user doesn't exist during sign in, suggest sign up
        if (message.includes("Couldn't find your account")) {
          setError("No account found. Please sign up first.");
        } else {
          setError(message);
        }
      } else {
        setError('Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'signUp') {
        const result = await signUp!.attemptPhoneNumberVerification({ code });
        if (result.status === 'complete') {
          await setActiveSignUp!({ session: result.createdSessionId });
          onSuccess();
        }
      } else {
        const result = await signIn!.attemptFirstFactor({
          strategy: 'phone_code',
          code,
        });
        if (result.status === 'complete') {
          await setActiveSignIn!({ session: result.createdSessionId });
          onSuccess();
        }
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.message || 'Invalid code');
      } else {
        setError('Verification failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (pendingVerification) {
      setPendingVerification(false);
      setCode('');
      setError('');
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={handleBack} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 pt-4">
          <Text
            className="text-3xl text-black mb-3"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            {pendingVerification ? 'enter your code' : 'enter your phone number'}
          </Text>
          <Text
            className="text-lg text-gray-500 mb-8"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {pendingVerification
              ? `we sent a code to ${phoneNumber}`
              : "we'll send you a verification code"}
          </Text>

          {!pendingVerification ? (
            <TextInput
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setError('');
              }}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              autoFocus
              className="w-full border-2 border-gray-200 rounded-2xl px-5 text-black"
              style={{
                fontFamily: 'InstrumentSans_500Medium',
                fontSize: 18,
                height: 56,
              }}
            />
          ) : (
            <TextInput
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError('');
              }}
              placeholder="000000"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              autoFocus
              maxLength={6}
              className="w-full border-2 border-gray-200 rounded-2xl px-5 text-black text-center"
              style={{
                fontFamily: 'InstrumentSans_500Medium',
                fontSize: 24,
                height: 56,
                letterSpacing: 8,
              }}
            />
          )}

          {error ? (
            <Text
              className="text-red-500 mt-3 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              {error}
            </Text>
          ) : null}

          {pendingVerification && (
            <TouchableOpacity
              onPress={() => {
                setPendingVerification(false);
                handleSendCode();
              }}
              className="mt-4"
            >
              <Text
                className="text-gray-500 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                didn't receive a code?{' '}
                <Text style={{ color: '#fd6b03' }}>resend</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={pendingVerification ? handleVerifyCode : handleSendCode}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#fca560' : '#fd6b03',
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading && <ActivityIndicator color="#fff" size="small" />}
            <Text
              className="text-white text-lg"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {isLoading
                ? pendingVerification
                  ? 'verifying...'
                  : 'sending...'
                : pendingVerification
                  ? 'verify'
                  : 'send code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
