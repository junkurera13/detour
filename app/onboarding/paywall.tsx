import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';
import { useOnboarding } from '@/context/OnboardingContext';

const timelineSteps = [
  {
    day: 'today',
    title: 'start your free trial',
    description: 'get instant access to all nearby nomads & unlimited messages',
  },
  {
    day: 'day 3',
    title: 'keep exploring but with a reminder!',
    description: 'get a reminder your trial is about to end',
  },
  {
    day: 'day 7',
    title: 'trial ends',
    description: "you'll be charged for max. you can cancel anytime before.",
  },
];

const maxFeatures = [
  {
    title: 'unlock full nomad lists',
    description: 'nearby and at your destinations',
  },
  {
    title: 'priority visibility',
    description: 'your profile near the top of the nearby list',
  },
  {
    title: 'see who viewed your profile',
    description: 'nearby nomads who viewed your profile',
  },
  {
    title: 'personalized activity ideas',
    description: 'based off your location and interests',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createUser = useMutation(api.users.create);
  const useInviteCode = useMutation(api.inviteCodes.use);

  // Debug logging
  useEffect(() => {
    console.log('Paywall Auth State:', {
      isClerkLoaded,
      isSignedIn,
      isConvexLoading,
      isAuthenticated,
    });
  }, [isClerkLoaded, isSignedIn, isConvexLoading, isAuthenticated]);

  // Show loading while auth is being established
  const isAuthLoading = !isClerkLoaded || isConvexLoading;

  const handleCreateUser = async () => {
    console.log('handleCreateUser called', { isSubmitting, isAuthenticated, isSignedIn });

    if (isSubmitting) return;

    // Check if still loading
    if (isConvexLoading || !isClerkLoaded) {
      Alert.alert('Please wait', 'Still connecting to server...');
      return;
    }

    // Check authentication - if Clerk is signed in but Convex isn't authenticated yet, wait
    if (!isAuthenticated) {
      if (isSignedIn) {
        // Clerk is signed in but Convex hasn't synced yet - this is a JWT template issue
        console.error('Clerk signed in but Convex not authenticated. Check JWT template setup.');
        Alert.alert(
          'Authentication Sync Issue',
          'Your login is not syncing properly. Please ensure the JWT template named "convex" is set up in Clerk Dashboard, then restart the app.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Not Signed In',
          'Please sign in first.',
          [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
        );
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const userStatus = data.joinPath === 'invite' ? 'approved' : 'pending';

      // Create user in Convex (tokenIdentifier is captured automatically from Clerk via ctx.auth)
      const userId = await createUser({
        name: data.name,
        username: data.username,
        birthday: data.birthday?.toISOString() ?? new Date().toISOString(),
        gender: data.gender,
        lookingFor: data.lookingFor,
        datingPreference: data.datingPreference.length > 0 ? data.datingPreference : undefined,
        lifestyle: data.lifestyle,
        timeNomadic: data.timeNomadic,
        interests: data.interests,
        photos: data.photos,
        instagram: data.instagram || undefined,
        currentLocation: data.currentLocation,
        futureTrip: data.futureTrip || undefined,
        joinPath: data.joinPath ?? 'apply',
        inviteCode: data.inviteCode || undefined,
        userStatus,
      });

      // If user joined via invite code, consume it
      if (data.joinPath === 'invite' && data.inviteCode) {
        await useInviteCode({ code: data.inviteCode, userId });
      }

      // Update local onboarding state
      updateData({
        hasCompletedOnboarding: true,
        userStatus,
      });

      // Route based on status
      if (userStatus === 'approved') {
        router.replace('/onboarding/done');
      } else {
        router.replace('/pending');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      Alert.alert(
        'Error',
        'Failed to create your account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTrial = () => {
    handleCreateUser();
  };

  const handleClose = () => {
    handleCreateUser();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text
          className="text-2xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          detour
        </Text>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={true}
        bounces={true}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
      >
        {/* Title */}
        <Text
          className="text-3xl text-black mb-8"
          style={{ fontFamily: 'InstrumentSans_700Bold' }}
        >
          make unlimited nomad friends with detour max
        </Text>

        {/* Timeline Progress */}
        <View className="mb-4">
          {timelineSteps.map((step, index) => (
            <View key={step.day} className="flex-row">
              {/* Progress indicator */}
              <View className="items-center mr-4">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: index === 0 ? '#fd6b03' : '#E5E7EB' }}
                />
                {index < timelineSteps.length - 1 && (
                  <View
                    className="w-0.5 flex-1 my-1"
                    style={{ backgroundColor: '#E5E7EB', minHeight: 60 }}
                  />
                )}
              </View>

              {/* Content */}
              <View className="flex-1 pb-6">
                <Text
                  className="text-sm text-gray-400 uppercase mb-1"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  {step.day}
                </Text>
                <Text
                  className="text-base text-black mb-1"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {step.title}
                </Text>
                <Text
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Included with detour max */}
        <View className="border border-gray-200 rounded-2xl p-4">
          <Text
            className="text-lg text-black mb-4"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            included with detour max
          </Text>

          {maxFeatures.map((feature, index) => (
            <View key={feature.title} className={`flex-row items-start ${index < maxFeatures.length - 1 ? 'mb-4' : ''}`}>
              <Ionicons name="checkmark-circle" size={20} color="#fd6b03" style={{ marginTop: 2 }} />
              <View className="flex-1 ml-3">
                <Text
                  className="text-base text-black"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  {feature.title}
                </Text>
                <Text
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-6 pb-6 pt-4 border-t border-gray-100">
        <Text
          className="text-center text-gray-500 mb-3"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          free for 3 days, then $99/year
        </Text>

        <TouchableOpacity
          onPress={handleStartTrial}
          disabled={isSubmitting}
          style={{
            backgroundColor: isSubmitting ? '#fca560' : '#fd6b03',
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
            className="text-white text-lg"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            {isSubmitting ? 'creating account...' : 'try for $0.00'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center items-center mt-4 gap-4">
          <TouchableOpacity>
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              terms
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-300">•</Text>
          <TouchableOpacity>
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              privacy policy
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-300">•</Text>
          <TouchableOpacity>
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              restore
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
