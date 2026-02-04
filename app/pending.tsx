import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useClerk } from '@clerk/clerk-expo';

export default function PendingScreen() {
  const router = useRouter();
  const { data, updateData, resetData } = useOnboarding();
  const { convexUser } = useAuthenticatedUser();
  const { signOut } = useClerk();
  const userId = convexUser?._id;
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debounce code input
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

  // Queries
  const waitlistPosition = useQuery(api.users.getWaitlistPosition);

  // Mutations
  const consumeInviteCode = useMutation(api.inviteCodes.use);
  const updateUser = useMutation(api.users.update);

  const isChecking = code.trim().length >= 4 && (debouncedCode !== code.trim().toUpperCase() || validation === undefined);
  const isValid = validation?.isValid === true;

  const handleApplyCode = async () => {
    if (!isValid || !userId || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Use the invite code
      await consumeInviteCode({ code: code.trim().toUpperCase(), userId });

      // Update user status to approved
      await updateUser({ id: userId, userStatus: 'approved' });

      // Update local state
      updateData({
        userStatus: 'approved',
        joinPath: 'invite',
        inviteCode: code.trim().toUpperCase(),
      });

      // Navigate to the done screen
      router.replace('/onboarding/done');
    } catch (err) {
      console.error('Failed to apply invite code:', err);
      setError('Failed to apply code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      resetData();
      router.replace('/onboarding');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/onboarding');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 items-center justify-center">
          {/* Waitlist Icon */}
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: '#FFF7ED' }}
          >
            <Ionicons name="hourglass-outline" size={40} color="#fd6b03" />
          </View>

          {/* Title */}
          <Text
            className="text-3xl text-black text-center mb-3"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            you&apos;re on the list{data.name ? `, ${data.name.toLowerCase()}` : ''}!
          </Text>

          {/* Description */}
          <Text
            className="text-lg text-gray-500 text-center px-4 leading-7"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            we&apos;re reviewing your application and will{'\n'}
            notify you when you&apos;re approved.
          </Text>

          {/* Position indicator */}
          <View
            className="mt-8 px-6 py-4 rounded-2xl"
            style={{ backgroundColor: '#F9FAFB' }}
          >
            {waitlistPosition === undefined ? (
              <ActivityIndicator size="small" color="#fd6b03" />
            ) : waitlistPosition ? (
              <Text
                className="text-center text-gray-500"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                your position: <Text style={{ color: '#fd6b03' }}>#{waitlistPosition.position}</Text>
              </Text>
            ) : (
              <Text
                className="text-center text-gray-500"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                checking your position...
              </Text>
            )}
          </View>

          {/* Invite Code Input Section */}
          {showCodeInput && (
            <View className="mt-8 w-full">
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
                className="w-full border-2 border-gray-200 rounded-2xl px-5 text-black text-center"
                style={{
                  fontFamily: 'InstrumentSans_500Medium',
                  fontSize: 18,
                  height: 56,
                }}
              />

              {/* Validation status */}
              {code.trim().length >= 4 && (
                <View className="flex-row items-center justify-center mt-3">
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

              {error && (
                <Text
                  className="text-red-500 text-sm text-center mt-2"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {error}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleApplyCode}
                disabled={!isValid || isSubmitting}
                className="mt-4"
                style={{
                  backgroundColor: !isValid || isSubmitting ? '#E5E7EB' : '#fd6b03',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isSubmitting && <ActivityIndicator color="#fff" size="small" />}
                <Text
                  style={{
                    fontFamily: 'InstrumentSans_600SemiBold',
                    fontSize: 16,
                    color: !isValid || isSubmitting ? '#9CA3AF' : '#fff',
                  }}
                >
                  {isSubmitting ? 'applying...' : 'skip the wait'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowCodeInput(false);
                  setCode('');
                  setError('');
                }}
                className="mt-3"
              >
                <Text
                  className="text-center text-gray-400 text-sm"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        {!showCodeInput && (
          <View className="px-6 pb-8">
            <Text
              className="text-center text-gray-400 text-sm mb-4"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              have an invite code?{' '}
              <Text
                style={{ color: '#fd6b03', textDecorationLine: 'underline' }}
                onPress={() => setShowCodeInput(true)}
              >
                skip the wait
              </Text>
            </Text>

            <TouchableOpacity onPress={handleLogout}>
              <Text
                className="text-center text-gray-400 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                log out
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
