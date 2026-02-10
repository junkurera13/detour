import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Modal, ScrollView, ActivityIndicator, PanResponder, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { mockUsers, MockUser } from '@/data/mockData';
import { isDemoUser } from '@/utils/isDemoUser';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';
import { computeCompatibility, CompatibilityBreakdown } from '@/utils/compatibility';
import { CompatibilityBadge } from '@/components/ui/CompatibilityBadge';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500;
const CARD_HEIGHT = Platform.OS === 'android' ? WINDOW_HEIGHT * 0.74 : WINDOW_HEIGHT * 0.71;

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  lifestyle: string[];
  photos: string[];
  distance: string;
  distanceKm: number | null; // null = no coordinates available
  interests: string[];
  bio: string;
  timeNomadic: string;
  lookingFor: string;
  instagram?: string;
  compatibility?: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
}

const DISTANCE_OPTIONS = [5, 10, 15, 20, 25, 50, 100, Infinity];
const AGE_MIN = 18;
const AGE_MAX = 70;

// Helper to calculate age from birthday string
function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Haversine distance in km between two lat/lng points
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  if (km < 10) return `${km.toFixed(1)}km away`;
  return `${Math.round(km)}km away`;
}

// Convert Convex user to Profile interface
function convexUserToProfile(
  user: Doc<"users">,
  refCoords: { latitude: number; longitude: number } | null,
  currentUser?: Doc<"users"> | null,
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

// Convert MockUser to Profile interface
function mockUserToProfile(user: MockUser): Profile {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    gender: user.gender,
    location: user.location,
    lifestyle: user.lifestyle,
    photos: user.photos,
    distance: user.location.split(',')[0].trim(),
    distanceKm: null,
    interests: user.interests,
    bio: user.bio,
    timeNomadic: user.timeNomadic,
    lookingFor: user.lookingFor,
    instagram: user.instagram,
  };
}

interface SwipeableCardProps {
  profile: Profile;
  isFirst: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  swipeDirection: 'left' | 'right' | null;
  swipeProgress: SharedValue<number>;
}

function SwipeableCard({ profile, isFirst, onSwipeLeft, onSwipeRight, swipeDirection, swipeProgress }: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const cardRouter = useRouter();

  const triggerHaptic = (type: 'light' | 'medium') => {
    if (type === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    triggerHaptic('medium');
    if (direction === 'left') {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }
  };

  // Handle programmatic swipe from buttons
  if (swipeDirection && isFirst) {
    const targetX = swipeDirection === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(targetX, { duration: 300 }, () => {
      runOnJS(handleSwipeComplete)(swipeDirection);
    });
  }

  const panGesture = Gesture.Pan()
    .enabled(isFirst)
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      runOnJS(triggerHaptic)('light');
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
      // Update swipe progress for button scaling
      swipeProgress.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldSwipeRight =
        event.velocityX > SWIPE_VELOCITY_THRESHOLD ||
        translateX.value > SWIPE_THRESHOLD;
      const shouldSwipeLeft =
        event.velocityX < -SWIPE_VELOCITY_THRESHOLD ||
        translateX.value < -SWIPE_THRESHOLD;

      if (shouldSwipeRight) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('right');
        });
        swipeProgress.value = withTiming(0, { duration: 300 });
      } else if (shouldSwipeLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('left');
        });
        swipeProgress.value = withTiming(0, { duration: 300 });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        swipeProgress.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: isFirst ? translateX.value : 0 },
        { translateY: isFirst ? translateY.value : 0 },
        { rotate: isFirst ? `${rotate}deg` : '0deg' },
        { scale: isFirst ? 1 : 0.95 },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled={true}
        >
          {/* Main Photo Section */}
          <View style={styles.mainPhotoContainer}>
            <Image
              source={{ uri: profile.photos[0] }}
              style={styles.cardImage}
              resizeMode="cover"
            />

            {/* Gradient overlay for text readability */}
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.4)']}
              locations={[0, 0.3, 0.7, 1]}
              style={styles.gradient}
            />

            {/* Profile info overlay */}
            <View style={styles.profileInfo}>
              <TouchableOpacity
                style={styles.nameRow}
                activeOpacity={0.7}
                onPress={() => cardRouter.push(`/user/${profile.id}`)}
              >
                <Text style={styles.nameText}>
                  {profile.name}, {profile.age}
                </Text>
                {profile.compatibility != null && (
                  <View style={{ marginLeft: 8 }}>
                    <CompatibilityBadge score={profile.compatibility} size="md" breakdown={profile.compatibilityBreakdown} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.distanceText}>{profile.distance}</Text>
              </View>
            </View>

            {/* 3-dot menu button */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content Sections */}
          <View style={styles.contentSections}>
            {/* Bio Section */}
            {profile.bio && (
              <View style={styles.section}>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            )}

            {/* Nomad Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>nomad life</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Ionicons name="globe-outline" size={20} color="#fd6b03" />
                  <Text style={styles.infoLabel}>lifestyle</Text>
                  <Text style={styles.infoValue}>{profile.lifestyle.join(', ')}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={20} color="#fd6b03" />
                  <Text style={styles.infoLabel}>time nomadic</Text>
                  <Text style={styles.infoValue}>{profile.timeNomadic}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="heart-outline" size={20} color="#fd6b03" />
                  <Text style={styles.infoLabel}>looking for</Text>
                  <Text style={styles.infoValue}>{profile.lookingFor}</Text>
                </View>
              </View>
            </View>

            {/* Interests Section */}
            {profile.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>interests</Text>
                <View style={styles.tagsContainer}>
                  {profile.interests.map((interest) => (
                    <View key={interest} style={styles.interestTag}>
                      <Text style={styles.interestTagText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* More Photos Section */}
            {profile.photos.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>more photos</Text>
                <View style={styles.photosGrid}>
                  {profile.photos.slice(1).map((photo, index) => (
                    <Image
                      key={index}
                      source={{ uri: photo }}
                      style={styles.gridPhoto}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Instagram Section */}
            {profile.instagram && (
              <View style={styles.section}>
                <View style={styles.instagramRow}>
                  <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                  <Text style={styles.instagramText}>@{profile.instagram}</Text>
                </View>
              </View>
            )}

            {/* Bottom padding for scroll */}
            <View style={{ height: 20 }} />
          </View>
        </ScrollView>

        {/* Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuModal}>
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => setMenuVisible(false)}
              >
                <Text style={styles.menuOptionText}>cancel</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => setMenuVisible(false)}
              >
                <Text style={[styles.menuOptionText, styles.menuOptionDanger]}>block</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => setMenuVisible(false)}
              >
                <Text style={[styles.menuOptionText, styles.menuOptionDanger]}>block and report</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </Animated.View>
    </GestureDetector>
  );
}

// Dual-thumb range slider component
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 3;

function RangeSlider({
  min,
  max,
  low,
  high,
  onLowChange,
  onHighChange,
}: {
  min: number;
  max: number;
  low: number;
  high: number;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
}) {
  const viewRef = useRef<View>(null);
  const trackInfo = useRef({ pageX: 0, width: 0 });
  const activeThumb = useRef<'low' | 'high' | null>(null);
  const lastValue = useRef<number | null>(null);

  // Keep current values in refs so PanResponder callbacks aren't stale
  const lowRef = useRef(low);
  const highRef = useRef(high);
  lowRef.current = low;
  highRef.current = high;
  const onLowRef = useRef(onLowChange);
  const onHighRef = useRef(onHighChange);
  onLowRef.current = onLowChange;
  onHighRef.current = onHighChange;

  const measure = () => {
    viewRef.current?.measureInWindow((x, _y, width) => {
      if (width > 0) trackInfo.current = { pageX: x, width };
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        measure();
        const pad = THUMB_SIZE / 2;
        const tw = trackInfo.current.width - THUMB_SIZE;
        const relX = evt.nativeEvent.pageX - trackInfo.current.pageX - pad;
        const lowX = ((lowRef.current - min) / (max - min)) * tw;
        const highX = ((highRef.current - min) / (max - min)) * tw;
        activeThumb.current =
          Math.abs(relX - lowX) <= Math.abs(relX - highX) ? 'low' : 'high';
      },
      onPanResponderMove: (evt) => {
        const pad = THUMB_SIZE / 2;
        const tw = trackInfo.current.width - THUMB_SIZE;
        if (tw <= 0) return;
        const relX = evt.nativeEvent.pageX - trackInfo.current.pageX - pad;
        const ratio = Math.max(0, Math.min(1, relX / tw));
        const newValue = Math.round(ratio * (max - min) + min);
        let clamped = newValue;
        if (activeThumb.current === 'low') {
          clamped = Math.min(Math.max(min, newValue), highRef.current - 1);
          onLowRef.current(clamped);
        } else if (activeThumb.current === 'high') {
          clamped = Math.max(Math.min(max, newValue), lowRef.current + 1);
          onHighRef.current(clamped);
        }
        if (lastValue.current !== clamped) {
          lastValue.current = clamped;
          Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: () => {
        activeThumb.current = null;
        lastValue.current = null;
      },
    })
  ).current;

  const range = max - min;
  const lowPct = ((low - min) / range) * 100;
  const highPct = ((high - min) / range) * 100;

  return (
    <View
      ref={viewRef}
      onLayout={measure}
      style={{ height: THUMB_SIZE + 16, justifyContent: 'center' }}
      {...panResponder.panHandlers}
    >
      {/* Padded inner area so thumb centers align with content edges */}
      <View style={{ marginHorizontal: THUMB_SIZE / 2 }}>
        {/* Background track */}
        <View
          style={{
            height: TRACK_HEIGHT,
            backgroundColor: '#E5E7EB',
            borderRadius: TRACK_HEIGHT / 2,
          }}
        />
        {/* Active track */}
        <View
          style={{
            position: 'absolute',
            left: `${lowPct}%`,
            right: `${100 - highPct}%`,
            height: TRACK_HEIGHT,
            backgroundColor: '#000',
            borderRadius: TRACK_HEIGHT / 2,
          }}
        />
        {/* Low thumb */}
        <View
          style={{
            position: 'absolute',
            left: `${lowPct}%`,
            top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
            marginLeft: -THUMB_SIZE / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: '#fff',
            borderWidth: 2.5,
            borderColor: '#000',
          }}
        />
        {/* High thumb */}
        <View
          style={{
            position: 'absolute',
            left: `${highPct}%`,
            top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
            marginLeft: -THUMB_SIZE / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: '#fff',
            borderWidth: 2.5,
            borderColor: '#000',
          }}
        />
      </View>
    </View>
  );
}

export default function NearbyScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const { convexUser, isLoading: isAuthLoading } = useAuthenticatedUser();
  const userId = convexUser?._id;
  const isDemo = isDemoUser(convexUser?.email);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const [localSwipedIds, setLocalSwipedIds] = useState<Set<string>>(new Set());
  const [prefsVisible, setPrefsVisible] = useState(false);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(70);
  const [prefDistance, setPrefDistance] = useState(25);
  const [prefLocation, setPrefLocation] = useState('');
  const [prefCoords, setPrefCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const locationInitialized = useRef(false);
  const swipeProgress = useSharedValue(0);

  // Fetch profiles from Convex
  const convexUsers = useQuery(
    api.users.getDiscoverUsers,
    userId ? { currentUserId: userId, limit: 50 } : "skip"
  );

  // Create swipe mutation
  const createSwipe = useMutation(api.swipes.create);

  // Base location for reset button comparison
  const baseLocation = convexUser?.currentLocation || data.currentLocation || '';

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

  // DEBUG: log query state to help diagnose empty nearby page
  useEffect(() => {
    console.log('[Nearby] convexUser:', convexUser ? `${convexUser.name} (${convexUser.userStatus})` : convexUser);
    console.log('[Nearby] userId:', userId);
    console.log('[Nearby] convexUsers count:', convexUsers === undefined ? 'skipped/loading' : convexUsers?.length);
    console.log('[Nearby] datingPreference:', convexUser?.datingPreference);
  }, [convexUser, userId, convexUsers]);

  const profiles = useMemo(() => {
    // If we have Convex users, use them
    if (convexUsers && convexUsers.length > 0) {
      return convexUsers.map((u) => convexUserToProfile(u, prefCoords, convexUser));
    }
    // Fall back to mock data only for demo user
    if (isDemo) {
      return mockUsers.map((u) => mockUserToProfile(u));
    }
    return [];
  }, [convexUsers, prefCoords, isDemo, convexUser]);

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

    // Skip recording swipe for mock users (their IDs start with "user_")
    // Only record swipes for real Convex users
    if (profileId.startsWith('user_')) {
      return;
    }

    setIsProcessingSwipe(true);
    try {
      const result = await createSwipe({
        swiperId: userId,
        swipedId: profileId as any, // The id is the Convex _id
        action,
      });

      if (result.isMatch) {
        // TODO: Show match modal in future enhancement
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to record swipe:', error);
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
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwipeDirection('left');
    setTimeout(() => {
      setLocalSwipedIds((prev) => new Set(prev).add(profile.id));
      recordSwipe('pass', profile.id);
      setSwipeDirection(null);
    }, 350);
  }, [recordSwipe, filteredProfiles]);

  const handleLikePress = useCallback(() => {
    const profile = filteredProfiles[0];
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwipeDirection('right');
    setTimeout(() => {
      setLocalSwipedIds((prev) => new Set(prev).add(profile.id));
      recordSwipe('like', profile.id);
      setSwipeDirection(null);
    }, 350);
  }, [recordSwipe, filteredProfiles]);

  const visibleProfiles = filteredProfiles.slice(0, 2);
  const isEmpty = !isLoading && filteredProfiles.length === 0;

  return (
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
              >
                <Ionicons name="close" size={32} color="#fd6b03" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={likeButtonAnimatedStyle}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLikePress}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={32} color="#fd6b03" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>

      {/* Preferences Modal */}
      <Modal
        visible={prefsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrefsVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          {/* Header */}
          <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
            <Text
              className="text-3xl text-black"
              style={{ fontFamily: 'InstrumentSerif_400Regular' }}
            >
              preferences
            </Text>
            <TouchableOpacity
              onPress={() => setPrefsVisible(false)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {/* Location */}
            <View className="pt-4 pb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-sm text-gray-500 uppercase"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  location
                </Text>
                {prefLocation !== baseLocation && !isEditingLocation && (
                  <TouchableOpacity
                    onPress={() => {
                      setPrefLocation(baseLocation);
                      setPrefCoords(
                        convexUser?.latitude != null && convexUser?.longitude != null
                          ? { latitude: convexUser.latitude, longitude: convexUser.longitude }
                          : null
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-sm"
                      style={{ fontFamily: 'InstrumentSans_500Medium', color: '#fd6b03' }}
                    >
                      reset
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {isEditingLocation ? (
                <LocationAutocomplete
                  value={prefLocation}
                  onSelect={(location) => {
                    setPrefLocation(location.fullName);
                    setPrefCoords(location.coordinates || null);
                    setIsEditingLocation(false);
                  }}
                  placeholder="search for a city..."
                />
              ) : (
                <TouchableOpacity
                  onPress={() => setIsEditingLocation(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center"
                >
                  <Ionicons name="location" size={18} color="#fd6b03" />
                  <Text
                    className="ml-3 text-black flex-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 15 }}
                  >
                    {prefLocation || 'Tap to set location'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Age Range */}
            <View className="pt-4 pb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  className="text-sm text-gray-500 uppercase"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  age range
                </Text>
                <Text
                  className="text-black"
                  style={{ fontFamily: 'InstrumentSans_700Bold', fontSize: 16 }}
                >
                  {ageMin} - {ageMax === AGE_MAX ? '70+' : ageMax}
                </Text>
              </View>
              <RangeSlider
                min={AGE_MIN}
                max={AGE_MAX}
                low={ageMin}
                high={ageMax}
                onLowChange={setAgeMin}
                onHighChange={setAgeMax}
              />
            </View>

            {/* Distance */}
            <View className="pb-6">
              <Text
                className="text-sm text-gray-500 uppercase mb-3"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                distance
              </Text>
              <View className="bg-gray-50 rounded-2xl overflow-hidden px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-black"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    max distance
                  </Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => {
                        const idx = DISTANCE_OPTIONS.indexOf(prefDistance);
                        if (idx > 0) setPrefDistance(DISTANCE_OPTIONS[idx - 1]);
                      }}
                      className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                      disabled={prefDistance === DISTANCE_OPTIONS[0]}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={prefDistance === DISTANCE_OPTIONS[0] ? '#D1D5DB' : '#000'}
                      />
                    </TouchableOpacity>
                    <Text
                      className="mx-4 text-black min-w-[50px] text-center"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {prefDistance === Infinity ? 'everyone' : `${prefDistance} km`}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const idx = DISTANCE_OPTIONS.indexOf(prefDistance);
                        if (idx < DISTANCE_OPTIONS.length - 1) setPrefDistance(DISTANCE_OPTIONS[idx + 1]);
                      }}
                      className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                      disabled={prefDistance === DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1]}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={prefDistance === DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1] ? '#D1D5DB' : '#000'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </Modal>

    </GestureHandlerRootView>
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
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: CARD_HEIGHT,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 0,
  },
  mainPhotoContainer: {
    width: '100%',
    height: CARD_HEIGHT,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'InstrumentSans_700Bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 14,
  },
  distanceText: {
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'InstrumentSans_500Medium',
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
  menuButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  menuOption: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  menuOptionText: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'InstrumentSans_500Medium',
  },
  menuOptionDanger: {
    color: '#ef4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  contentSections: {
    padding: 20,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'InstrumentSans_600SemiBold',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'InstrumentSans_400Regular',
    lineHeight: 24,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'InstrumentSans_400Regular',
    width: 90,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'InstrumentSans_500Medium',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestTagText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'InstrumentSans_500Medium',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridPhoto: {
    width: (SCREEN_WIDTH - 32 - 40 - 8) / 2,
    height: (SCREEN_WIDTH - 32 - 40 - 8) / 2,
    borderRadius: 12,
  },
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instagramText: {
    fontSize: 15,
    color: '#374151',
    fontFamily: 'InstrumentSans_500Medium',
  },
});
