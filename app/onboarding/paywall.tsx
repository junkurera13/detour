import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useMutation, useConvexAuth } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';
import { useOnboarding } from '@/context/OnboardingContext';
import { DETOUR_PLUS_ENTITLEMENT, useRevenueCat } from '@/context/RevenueCatContext';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

const timelineSteps = [
  {
    day: 'today',
    title: 'start your free trial',
    description: 'get instant access to all nearby nomads & unlimited messages',
  },
  {
    day: 'day 5',
    title: 'keep exploring but with a reminder!',
    description: 'get a reminder your trial is about to end',
  },
  {
    day: 'day 7',
    title: 'trial ends',
    description: "you'll be charged $99.99/year. cancel anytime before.",
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
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    offerings,
    purchasePackage,
    restorePurchases,
    isLoading: isRevenueCatLoading,
  } = useRevenueCat();

  const {
    uploadPhotos,
    isUploading,
    progress: uploadProgress,
  } = usePhotoUpload();

  const createUser = useMutation(api.users.create);
  const updateUser = useMutation(api.users.update);
  const consumeInviteCode = useMutation(api.inviteCodes.use);
  const { convexUser } = useAuthenticatedUser();

  // Debug logging
  useEffect(() => {
    console.log('Paywall Auth State:', {
      isClerkLoaded,
      isSignedIn,
      isConvexLoading,
      isAuthenticated,
    });
  }, [isClerkLoaded, isSignedIn, isConvexLoading, isAuthenticated]);

  const createUserInternal = async () => {
    console.log('handleCreateUser called', { isProcessing, isAuthenticated, isSignedIn });

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

    try {
      // If user has invite code, they're approved; otherwise pending (for new users only)
      const userStatus = data.joinPath === 'invite' ? 'approved' : 'pending';

      // Check if user already exists (pending user who got invite code)
      if (convexUser) {
        // Existing user - just update their status and consume invite code
        if (data.joinPath === 'invite' && data.inviteCode) {
          await consumeInviteCode({ code: data.inviteCode, userId: convexUser._id });
          await updateUser({ id: convexUser._id, userStatus: 'approved' });
        }

        // Update local onboarding state
        updateData({
          hasCompletedOnboarding: true,
          userStatus: 'approved',
        });

        router.replace('/onboarding/done');
        return;
      }

      // New user - upload photos and create account
      let photoUrls = data.photos;
      if (data.photos.length > 0) {
        const hasLocalPhotos = data.photos.some(
          (p) => p.startsWith('file://') || p.startsWith('ph://')
        );
        if (hasLocalPhotos) {
          try {
            photoUrls = await uploadPhotos(data.photos);
          } catch (uploadErr) {
            console.error('Photo upload failed:', uploadErr);
            Alert.alert(
              'Photo Upload Failed',
              'Failed to upload your photos. Please try again.',
              [{ text: 'OK' }]
            );
            return;
          }
        }
      }

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
        photos: photoUrls,
        instagram: data.instagram || undefined,
        currentLocation: data.currentLocation,
        futureTrips: data.futureTrips.length > 0 ? data.futureTrips : undefined,
        joinPath: data.joinPath ?? 'apply',
        inviteCode: data.inviteCode || undefined,
        userStatus,
      });

      // If user joined via invite code, consume it
      if (data.joinPath === 'invite' && data.inviteCode) {
        await consumeInviteCode({ code: data.inviteCode, userId });
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
    }
  };

  const hasDetourPlus = (info: any) =>
    Boolean(info?.entitlements?.active?.[DETOUR_PLUS_ENTITLEMENT]);

  const currentOffering = offerings?.current;
  const packageById = (id: string) =>
    currentOffering?.availablePackages?.find((pkg: { identifier: string }) => pkg.identifier === id);
  const yearlyPackage = currentOffering?.annual ?? packageById('yearly') ?? packageById('detour_plus_yearly');

  const priceLabel = yearlyPackage?.product?.priceString ?? '$99.99/year';

  // TODO: Set to false once App Store Connect Paid Apps Agreement is complete (waiting for Korean BRN)
  const ALLOW_PAYWALL_BYPASS = true;

  const handleStartTrial = async () => {
    if (isProcessing) return;

    // If offerings aren't available (App Store Connect not fully set up), allow bypass
    if (!yearlyPackage) {
      console.log('[Paywall] No yearlyPackage, ALLOW_PAYWALL_BYPASS =', ALLOW_PAYWALL_BYPASS);

      // Always allow bypass for now since App Store Connect isn't fully configured
      Alert.alert(
        'Development Mode',
        'RevenueCat products not available. Skip paywall for testing?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Skip & Continue',
            onPress: async () => {
              setIsProcessing(true);
              try {
                await createUserInternal();
              } finally {
                setIsProcessing(false);
              }
            },
          },
        ]
      );
      return;
    }

    setIsProcessing(true);
    try {
      const info = await purchasePackage(yearlyPackage);
      if (!info) return;

      if (!hasDetourPlus(info)) {
        Alert.alert('Subscription inactive', 'Purchase did not unlock detour plus.');
        return;
      }

      await createUserInternal();
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase failed', 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (isProcessing || isUploading) return;
    setIsProcessing(true);
    try {
      const info = await restorePurchases();
      if (info && hasDetourPlus(info)) {
        await createUserInternal();
        return;
      }
      Alert.alert('No active subscription', 'We could not find an active detour plus subscription.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-center px-6 py-4">
        <Text
          className="text-2xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          detour
        </Text>
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
          make unlimited nomad friends with detour plus
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

        {/* Included with detour plus */}
        <View className="border border-gray-200 rounded-2xl p-4">
          <Text
            className="text-lg text-black mb-4"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            included with detour plus
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
          free for 7 days, then {priceLabel}
        </Text>

        <TouchableOpacity
          onPress={handleStartTrial}
          disabled={isProcessing || isRevenueCatLoading || isUploading}
          style={{
            backgroundColor: isProcessing || isUploading ? '#fca560' : '#fd6b03',
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isProcessing && <ActivityIndicator color="#fff" size="small" />}
          <Text
            className="text-white text-lg"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            {isProcessing ? 'processing...' : 'start free trial'}
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
          <TouchableOpacity onPress={handleRestore}>
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              restore
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              marginHorizontal: 24,
              width: '80%',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#fd6b03" />
            <Text
              style={{
                fontFamily: 'InstrumentSans_600SemiBold',
                fontSize: 18,
                color: '#000',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              uploading photos...
            </Text>
            {uploadProgress && (
              <>
                <Text
                  style={{
                    fontFamily: 'InstrumentSans_400Regular',
                    fontSize: 14,
                    color: '#6B7280',
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {uploadProgress.current} of {uploadProgress.total}
                </Text>
                <View
                  style={{
                    marginTop: 16,
                    height: 8,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 4,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: '#fd6b03',
                      width: `${uploadProgress.percentage}%`,
                    }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
