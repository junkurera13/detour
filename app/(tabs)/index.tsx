import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { mockUsers, MockUser } from '@/data/mockData';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.73;

interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  lifestyle: string[];
  photos: string[];
  distance: string;
  interests: string[];
  bio: string;
  timeNomadic: string;
  lookingFor: string;
  instagram?: string;
}

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

// Convert Convex user to Profile interface
function convexUserToProfile(user: Doc<"users">): Profile {
  return {
    id: user._id,
    name: user.name,
    age: calculateAge(user.birthday),
    location: user.currentLocation,
    lifestyle: user.lifestyle,
    photos: user.photos.length > 0 ? user.photos : ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'],
    distance: 'nearby',
    interests: user.interests,
    bio: '', // Schema doesn't have bio field
    timeNomadic: user.timeNomadic,
    lookingFor: user.lookingFor.join(', '),
    instagram: user.instagram,
  };
}

// Convert MockUser to Profile interface
function mockUserToProfile(user: MockUser): Profile {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    location: user.location,
    lifestyle: user.lifestyle,
    photos: user.photos,
    distance: user.isOnline ? 'online now' : (user.lastActive || 'nearby'),
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
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>
                  {profile.name}, {profile.age}
                </Text>
                <View style={styles.onlineIndicator} />
              </View>

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

export default function NearbyScreen() {
  const { data } = useOnboarding();
  const { convexUser } = useAuthenticatedUser();
  const userId = convexUser?._id;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const swipeProgress = useSharedValue(0);

  // Fetch profiles from Convex
  const convexUsers = useQuery(
    api.users.getDiscoverUsers,
    userId ? { currentUserId: userId, limit: 50 } : "skip"
  );

  // Create swipe mutation
  const createSwipe = useMutation(api.swipes.create);

  // Convert Convex users to Profile interface, fall back to mock data
  const profiles = useMemo(() => {
    // If we have Convex users, use them
    if (convexUsers && convexUsers.length > 0) {
      return convexUsers.map(convexUserToProfile);
    }
    // Fall back to mock data for testing when no real users exist
    return mockUsers.map(mockUserToProfile);
  }, [convexUsers]);

  const isLoading = userId && convexUsers === undefined;

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

  const recordSwipe = useCallback(async (action: 'like' | 'pass') => {
    if (!userId || isProcessingSwipe) return;

    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    // Skip recording swipe for mock users (their IDs start with "user_")
    // Only record swipes for real Convex users
    if (currentProfile.id.startsWith('user_')) {
      // Mock user - simulate a match sometimes for testing
      if (action === 'like' && Math.random() < 0.3) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('Mock match with', currentProfile.name);
      }
      return;
    }

    setIsProcessingSwipe(true);
    try {
      const result = await createSwipe({
        swiperId: userId,
        swipedId: currentProfile.id as any, // The id is the Convex _id
        action,
      });

      if (result.isMatch) {
        // TODO: Show match modal in future enhancement
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('Match created!', result.matchId);
      }
    } catch (error) {
      console.error('Failed to record swipe:', error);
    } finally {
      setIsProcessingSwipe(false);
    }
  }, [createSwipe, currentIndex, isProcessingSwipe, profiles, userId]);

  const handleSwipeLeft = useCallback(() => {
    setSwipeDirection(null);
    recordSwipe('pass');
    setCurrentIndex((prev) => prev + 1);
  }, [recordSwipe]);

  const handleSwipeRight = useCallback(() => {
    setSwipeDirection(null);
    recordSwipe('like');
    setCurrentIndex((prev) => prev + 1);
  }, [recordSwipe]);

  const handlePassPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwipeDirection('left');
    setTimeout(() => {
      recordSwipe('pass');
      setCurrentIndex((prev) => prev + 1);
      setSwipeDirection(null);
    }, 350);
  }, [recordSwipe]);

  const handleLikePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwipeDirection('right');
    setTimeout(() => {
      recordSwipe('like');
      setCurrentIndex((prev) => prev + 1);
      setSwipeDirection(null);
    }, 350);
  }, [recordSwipe]);

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 2);
  const isEmpty = !isLoading && currentIndex >= profiles.length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-4 flex-row justify-between items-start">
          <View className="flex-row items-center gap-3">
            <Text
              className="text-5xl text-black"
              style={{ fontFamily: 'InstrumentSerif_400Regular' }}
            >
              nearby
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#9CA3AF" />
              <Text
                className="text-gray-400 text-sm ml-1"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                {data.currentLocation || 'lisbon, portugal'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
            <Ionicons name="options-outline" size={20} color="#000" />
          </TouchableOpacity>
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
    elevation: 8,
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
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginLeft: 10,
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
    elevation: 4,
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
