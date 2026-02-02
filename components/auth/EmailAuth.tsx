import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn, useSignUp, useAuth, isClerkAPIResponseError } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

interface EmailAuthProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function EmailAuth({ onSuccess, onBack }: EmailAuthProps) {
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { isSignedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  // Helper to complete authentication
  const completeAuth = useCallback(async () => {
    // Check if already signed in
    if (isSignedIn) {
      onSuccess();
      return true;
    }

    // Try to activate signUp session
    if (signUp?.status === 'complete' && signUp?.createdSessionId) {
      await setActiveSignUp!({ session: signUp.createdSessionId });
      onSuccess();
      return true;
    }

    // Try to activate signIn session
    if (signIn?.status === 'complete' && signIn?.createdSessionId) {
      await setActiveSignIn!({ session: signIn.createdSessionId });
      onSuccess();
      return true;
    }

    return false;
  }, [isSignedIn, signUp, signIn, setActiveSignUp, setActiveSignIn, onSuccess]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email');
      return;
    }

    if (!signInLoaded || !signUpLoaded) {
      setError('Please wait...');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First try to sign in (existing user)
      const signInAttempt = await signIn!.create({
        identifier: email.trim(),
      });

      const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      ) as { strategy: 'email_code'; emailAddressId: string } | undefined;

      if (emailCodeFactor?.emailAddressId) {
        await signIn!.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        });
        setIsNewUser(false);
        setPendingVerification(true);
      } else {
        setError('Email verification not available for this account');
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const errorCode = err.errors[0]?.code;

        // User doesn't exist, try sign up
        if (errorCode === 'form_identifier_not_found') {
          try {
            // Create new sign-up - this will handle both fresh and resumed sign-ups
            const signUpAttempt = await signUp!.create({ emailAddress: email.trim() });

            // Check if email is already verified (resumed sign-up)
            if (signUpAttempt.status === 'complete') {
              if (signUpAttempt.createdSessionId) {
                await setActiveSignUp!({ session: signUpAttempt.createdSessionId });
              }
              onSuccess();
              return;
            }

            // If email already verified but not complete, check what's needed
            const emailVerified = signUpAttempt.verifications?.emailAddress?.status === 'verified';
            if (emailVerified && signUpAttempt.status === 'missing_requirements') {
              // Email verified but something else needed - this shouldn't happen with our Clerk config
              console.log('Email verified but missing:', signUpAttempt.missingFields);
              if (signUpAttempt.createdSessionId) {
                await setActiveSignUp!({ session: signUpAttempt.createdSessionId });
                onSuccess();
                return;
              }
            }

            // Try to prepare verification - might fail if already verified
            try {
              await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
            } catch (prepareErr) {
              // If already verified, check if we can complete
              if (isClerkAPIResponseError(prepareErr) &&
                  prepareErr.errors[0]?.message?.toLowerCase().includes('verified')) {
                if (signUp!.status === 'complete' && signUp!.createdSessionId) {
                  await setActiveSignUp!({ session: signUp!.createdSessionId });
                  onSuccess();
                  return;
                }
              }
              throw prepareErr;
            }
            setIsNewUser(true);
            setPendingVerification(true);
          } catch (signUpErr) {
            if (isClerkAPIResponseError(signUpErr)) {
              const signUpErrorCode = signUpErr.errors[0]?.code;
              const signUpErrorMessage = signUpErr.errors[0]?.message || '';

              // Email already exists - this means user exists but sign-in failed
              // Try switching to sign-in flow
              if (signUpErrorCode === 'form_identifier_exists' ||
                  signUpErrorMessage.toLowerCase().includes('already exists')) {
                setError('An account with this email exists. Please try again.');
              } else {
                setError(signUpErr.errors[0]?.message || 'Failed to send code');
              }
            } else {
              setError('Something went wrong');
            }
          }
        } else {
          setError(err.errors[0]?.message || 'Failed to send code');
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
      if (isNewUser) {
        const result = await signUp!.attemptEmailAddressVerification({ code });

        console.log('SignUp result:', {
          status: result.status,
          missingFields: result.missingFields,
          unverifiedFields: result.unverifiedFields,
          createdSessionId: result.createdSessionId,
        });

        if (result.status === 'complete') {
          if (result.createdSessionId) {
            await setActiveSignUp!({ session: result.createdSessionId });
          }
          onSuccess();
          return;
        } else if (result.status === 'missing_requirements') {
          // Log what's missing so we can debug
          const missing = result.missingFields?.join(', ') || 'unknown fields';
          console.error('Clerk requires additional fields:', missing);
          setError(`Clerk setup issue: requires ${missing}. Please check Clerk dashboard.`);
        } else {
          console.log('SignUp status:', result.status);
          setError(`Verification status: ${result.status}`);
        }
      } else {
        const result = await signIn!.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });

        if (result.status === 'complete') {
          if (result.createdSessionId) {
            await setActiveSignIn!({ session: result.createdSessionId });
          }
          onSuccess();
          return;
        } else if (result.status === 'needs_second_factor') {
          setError('Two-factor authentication required');
        } else {
          console.log('SignIn status:', result.status);
          setError('Verification incomplete');
        }
      }
    } catch (err) {
      console.error('Verification error:', err);

      if (isClerkAPIResponseError(err)) {
        const errorMessage = err.errors[0]?.message || 'Invalid code';
        const errorCode = err.errors[0]?.code;

        // Handle "already verified" - the email is verified, try to complete
        if (errorMessage.toLowerCase().includes('verified') ||
            errorCode === 'verification_already_verified') {

          console.log('Already verified, checking signUp status:', signUp?.status);

          // If signUp is complete, activate session and proceed
          if (signUp?.status === 'complete') {
            if (signUp.createdSessionId) {
              await setActiveSignUp!({ session: signUp.createdSessionId });
            }
            onSuccess();
            return;
          }

          // Try the completeAuth helper
          const completed = await completeAuth();
          if (completed) return;

          // If signed in through some other means, proceed
          if (isSignedIn) {
            onSuccess();
            return;
          }

          // If still not complete, the user might need to start fresh
          setError('Session expired. Please go back and try again with your email.');
        } else {
          setError(errorMessage);
        }
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

  const handleResendCode = async () => {
    setCode('');
    setError('');
    setIsLoading(true);

    try {
      if (isNewUser) {
        await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
      } else {
        const emailCodeFactor = signIn!.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        ) as { strategy: 'email_code'; emailAddressId: string } | undefined;

        if (emailCodeFactor?.emailAddressId) {
          await signIn!.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          });
        }
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.message || 'Failed to resend code');
      }
    } finally {
      setIsLoading(false);
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
            {pendingVerification ? 'enter your code' : 'enter your email'}
          </Text>
          <Text
            className="text-lg text-gray-500 mb-8"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {pendingVerification
              ? `we sent a code to ${email}`
              : "we'll send you a verification code"}
          </Text>

          {!pendingVerification ? (
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text.toLowerCase());
                setError('');
              }}
              placeholder="you@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
              onPress={handleResendCode}
              disabled={isLoading}
              className="mt-4"
            >
              <Text
                className="text-gray-500 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                {"didn't receive a code? "}
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
