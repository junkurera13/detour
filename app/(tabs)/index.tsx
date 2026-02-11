import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { computeCompatibility, CompatibilityUser } from '@/utils/compatibility';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { calculateAge, haversineKm } from '@/utils/profile';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SwipeableCard, SWIPE_THRESHOLD, Profile } from '@/components/discovery/SwipeableCard';
import { PreferencesModal } from '@/components/discovery/PreferencesModal';

type PublicDiscoverUser = Pick<
  Doc<"users">,
  | "_id"
  | "name"
  | "birthday"
  | "gender"
  | "lookingFor"
  | "datingGoals"
  | "lifestyle"
  | "timeNomadic"
  | "interests"
  | "photos"
  | "instagram"
  | "currentLocation"
  | "latitude"
  | "longitude"
  | "futureTrips"
  | "pets"
>;


function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  if (km < 10) return `${km.toFixed(1)}km away`;
  return `${Math.round(km)}km away`;
}

// Convert Convex user to Profile interface
function convexUserToProfile(
  user: PublicDiscoverUser,
  refCoords: { latitude: number; longitude: number } | null,
  currentUser?: CompatibilityUser | null,
): Profile {
  const km = (refCoords && user.latitude != null && user.longitude != null)
    ? haversineKm(refCoords.latitude, refCoords.longitude, user.latitude, user.longitude)
    : null;

  return {
    id: user._id,
    name: user.name,
    age: calculateAge(user.birthday),
    gender: user.gender,
    location: user.currentLocation,
    lifestyle: user.lifestyle,
    photos: user.photos.length > 0 ? user.photos : ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'],
    distance: km != null ? formatDistance(km) : user.currentLocation.split(',')[0].trim(),
    distanceKm: km,
    interests: user.interests,
    bio: '',
    timeNomadic: user.timeNomadic,
    lookingFor: user.lookingFor.join(', '),
    instagram: user.instagram,
    ...(currentUser ? (() => {
      const { score, breakdown } = computeCompatibility(currentUser, user);
      return { compatibility: score, compatibilityBreakdown: breakdown };
    })() : {}),
  };
}


export default function NearbyScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const { convexUser, isLoading: isAuthLoading } = useAuthenticatedUser();
  const userId = convexUser?._id;
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const [localSwipedIds, setLocalSwipedIds] = useState<Set<string>>(new Set());
  const [prefsVisible, setPrefsVisible] = useState(false);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(70);
  const [prefDistance, setPrefDistance] = useState(25);
  const prefsLoaded = useRef(false);
  const [prefLocation, setPrefLocation] = useState('');
  const [prefCoords, setPrefCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationInitialized = useRef(false);
  const swipeProgress = useSharedValue(0);

  // Fetch profiles from Convex
  const convexUsers = useQuery(
    api.users.getDiscoverUsers,
    userId ? { limit: 50 } : "skip"
  );

  // Create swipe mutation
  const createSwipe = useMutation(api.swipes.create);

  // Base location for reset button comparison
  const baseLocation = convexUser?.currentLocation || data.currentLocation || '';

  // Convex user coordinates for preferences modal reset
  const convexUserCoords = (convexUser?.latitude != null && convexUser?.longitude != null)
    ? { latitude: convexUser.latitude, longitude: convexUser.longitude }
    : null;

  // Initialize prefLocation and coordinates from user data once
  useEffect(() => {
    if (!locationInitialized.current && baseLocation) {
      setPrefLocation(baseLocation);
      if (convexUser?.latitude != null && convexUser?.longitude != null) {
        setPrefCoords({ latitude: convexUser.latitude, longitude: convexUser.longitude });
      }
      locationInitialized.current = true;
    }
  }, [baseLocation, convexUser?.latitude, convexUser?.longitude]);

  // Load saved preferences from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('nearby_prefs');
        if (saved) {
          const prefs = JSON.parse(saved);
          if (prefs.ageMin != null) setAgeMin(prefs.ageMin);
          if (prefs.ageMax != null) setAgeMax(prefs.ageMax);
          if (prefs.distance != null) setPrefDistance(prefs.distance);
        }
      } catch (e) { console.error("Failed to load preferences:", e); }
      prefsLoaded.current = true;
    })();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (!prefsLoaded.current) return;
    AsyncStorage.setItem('nearby_prefs', JSON.stringify({ ageMin, ageMax, distance: prefDistance })).catch((e) => console.warn('Failed to save preferences:', e));
  }, [ageMin, ageMax, prefDistance]);

  const profiles = useMemo(() => {
    // If we have Convex users, use them
    if (convexUsers && convexUsers.length > 0) {
      return convexUsers.map((u) => convexUserToProfile(u, prefCoords, convexUser));
    }
    return [];
  }, [convexUsers, prefCoords, convexUser]);

  // Current user's interests for hobby-weighted sorting
  const userInterests = useMemo(() => {
    return new Set(convexUser?.interests || data.interests || []);
  }, [convexUser?.interests, data.interests]);

  // Filter profiles by distance, age, gender preferences, then sort by shared interests
  const filteredProfiles = useMemo(() => {
    const filtered = profiles.filter((p) => {
      if (localSwipedIds.has(p.id)) return false;

      // Distance filter — only show profiles within prefDistance km
      // "everyone" (Infinity) shows all profiles regardless of distance
      // If coordinates are unavailable, include the profile (can't compute distance)
      if (prefDistance !== Infinity && p.distanceKm != null) {
        if (p.distanceKm > prefDistance) return false;
      }

      // Age filter
      if (p.age < ageMin || p.age > ageMax) return false;

      // Gender filter — nearby is dating only, filter by datingPreference
      const datingPref = convexUser?.datingPreference || data.datingPreference || [];
      if (datingPref.length > 0 && !datingPref.includes('everyone')) {
        const prefToGender: Record<string, string> = { women: 'woman', men: 'man' };
        const profileGender = p.gender.toLowerCase();
        if (!datingPref.some((g) => profileGender === (prefToGender[g] || g))) return false;
      }

      return true;
    });

    // Sort by shared interest count (most shared first)
    if (userInterests.size > 0) {
      filtered.sort((a, b) => {
        const aShared = a.interests.filter((i) => userInterests.has(i)).length;
        const bShared = b.interests.filter((i) => userInterests.has(i)).length;
        return bShared - aShared;
      });
    }

    return filtered;
  }, [profiles, localSwipedIds, ageMin, ageMax, prefDistance, userInterests, convexUser?.datingPreference, data.datingPreference]);

  const isLoading = isAuthLoading || (userId && convexUsers === undefined);

  // Animated style for X button - scales up when swiping left
  const passButtonAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      swipeProgress.value,
      [-SWIPE_THRESHOLD, 0],
      [1.3, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  // Animated style for heart button - scales up when swiping right
  const likeButtonAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      swipeProgress.value,
      [0, SWIPE_THRESHOLD],
      [1, 1.3],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  const recordSwipe = useCallback(async (action: 'like' | 'pass', profileId: string) => {
    if (!userId || isProcessingSwipe) return;

    setIsProcessingSwipe(true);
    try {
      const result = await createSwipe({
        swipedId: profileId as Id<"users">,
        action,
      });

      if (result.isMatch) {
        // TODO: Show match modal in future enhancement
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to record swipe:', error);
      Alert.alert('error', 'failed to record swipe. please try again.');
    } finally {
      setIsProcessingSwipe(false);
    }
  }, [createSwipe, isProcessingSwipe, userId]);

  const handleSwipeLeft = useCallback(() => {
    const profile = filteredProfiles[0];
    if (!profile) return;
    setSwipeDirection(null);
    setLocalSwipedIds((prev) => new Set(prev).add(profile.id));
    recordSwipe('pass', profile.id);
  }, [recordSwipe, filteredProfiles]);

  const handleSwipeRight = useCallback(() => {
    const profile = filteredProfiles[0];
    if (!profile) return;
    setSwipeDirection(null);
    setLocalSwipedIds((prev) => new Set(prev).add(profile.id));
    recordSwipe('like', profile.id);
  }, [recordSwipe, filteredProfiles]);

  const handlePassPress = useCallback(() => {
    const profile = filteredProfiles[0];
    if (!profile || isProcessingSwipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwipeDirection('left');
  }, [filteredProfiles, isProcessingSwipe]);

  const handleLikePress = useCallback(() => {
    const profile = filteredProfiles[0];
    if (!profile || isProcessingSwipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwipeDirection('right');
  }, [filteredProfiles, isProcessingSwipe]);

  const visibleProfiles = filteredProfiles.slice(0, 2);
  const isEmpty = !isLoading && filteredProfiles.length === 0;

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-4 flex-row items-center justify-between">
          <Text
            className="text-5xl text-black"
            style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
          >
            nearby
          </Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => setPrefsVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Open preferences"
              accessibilityRole="button"
            >
              <Ionicons name="options-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/explore-people')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fd6b03',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#fd6b03',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}
              activeOpacity={0.8}
              accessibilityLabel="Explore people"
              accessibilityRole="button"
            >
              <Ionicons name="diamond" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Stack */}
        <View style={styles.cardContainer}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#fd6b03" />
              <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>
                finding nomads nearby...
              </Text>
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>no more profiles</Text>
              <Text style={styles.emptySubtitle}>
                check back later for new people nearby
              </Text>
            </View>
          ) : (
            visibleProfiles.map((profile, index) => (
              <SwipeableCard
                key={profile.id}
                profile={profile}
                isFirst={index === 0}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                swipeDirection={index === 0 ? swipeDirection : null}
                swipeProgress={swipeProgress}
              />
            )).reverse()
          )}
        </View>

        {/* Action Buttons */}
        {!isEmpty && (
          <View style={styles.actionButtons}>
            <Animated.View style={passButtonAnimatedStyle}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePassPress}
                activeOpacity={0.8}
                accessibilityLabel="Pass"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={32} color="#fd6b03" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={likeButtonAnimatedStyle}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLikePress}
                activeOpacity={0.8}
                accessibilityLabel="Like"
                accessibilityRole="button"
              >
                <Ionicons name="heart" size={32} color="#fd6b03" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>

      {/* Preferences Modal */}
      <PreferencesModal
        visible={prefsVisible}
        onClose={() => setPrefsVisible(false)}
        ageMin={ageMin}
        ageMax={ageMax}
        setAgeMin={setAgeMin}
        setAgeMax={setAgeMax}
        prefDistance={prefDistance}
        setPrefDistance={setPrefDistance}
        baseLocation={baseLocation}
        prefLocation={prefLocation}
        setPrefLocation={setPrefLocation}
        setPrefCoords={setPrefCoords}
        convexUserCoords={convexUserCoords}
      />

    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 45,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#000',
    fontFamily: 'InstrumentSans_600SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'InstrumentSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
