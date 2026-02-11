import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform, Modal, Dimensions, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { computeCompatibility, CompatibilityBreakdown } from '@/utils/compatibility';
import { CompatibilityBadge } from '@/components/ui/CompatibilityBadge';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
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

// Helper to format relative time
function formatRelativeTime(timestamp: number | undefined): string {
  if (!timestamp) return 'recently';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// Helper to calculate age from birthday
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

interface LikeUser {
  id: string;
  name: string;
  age: number;
  location: string;
  photos: string[];
  bio: string;
  lifestyle: string[];
  timeNomadic: string;
  lookingFor: string;
  interests: string[];
  instagram?: string;
  compatibility?: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
}

function convexUserToLikeUser(user: Doc<"users">, currentUser?: Doc<"users"> | null): LikeUser {
  const compat = currentUser ? computeCompatibility(currentUser, user) : undefined;
  return {
    id: user._id,
    name: user.name,
    age: calculateAge(user.birthday),
    location: user.currentLocation,
    photos: user.photos.length > 0 ? user.photos : ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
    bio: '',
    lifestyle: user.lifestyle,
    timeNomadic: user.timeNomadic,
    lookingFor: user.lookingFor.join(', '),
    interests: user.interests,
    instagram: user.instagram,
    compatibility: compat?.score,
    compatibilityBreakdown: compat?.breakdown,
  };
}

// Swipeable preview card for Likes You modal
function LikePreviewCard({
  user,
  onDismiss,
  swipeProgress,
  swipeDirection,
}: {
  user: LikeUser;
  onDismiss: (action: 'like' | 'pass') => void;
  swipeProgress: SharedValue<number>;
  swipeDirection: 'left' | 'right' | null;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const triggerHaptic = (type: 'light' | 'medium') => {
    Haptics.impactAsync(
      type === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    triggerHaptic('medium');
    onDismiss(direction === 'right' ? 'like' : 'pass');
  };

  // Handle programmatic swipe from buttons
  if (swipeDirection) {
    const targetX = swipeDirection === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(targetX, { duration: 300 }, () => {
      runOnJS(handleSwipeComplete)(swipeDirection);
    });
  }

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      runOnJS(triggerHaptic)('light');
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
      swipeProgress.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldSwipeRight =
        event.velocityX > SWIPE_VELOCITY_THRESHOLD || translateX.value > SWIPE_THRESHOLD;
      const shouldSwipeLeft =
        event.velocityX < -SWIPE_VELOCITY_THRESHOLD || translateX.value < -SWIPE_THRESHOLD;

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
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[cardStyles.card, cardAnimatedStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled={true}
        >
          {/* Main Photo */}
          <View style={cardStyles.mainPhotoContainer}>
            <Image
              source={{ uri: user.photos[0] }}
              style={cardStyles.cardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.4)']}
              locations={[0, 0.3, 0.7, 1]}
              style={cardStyles.gradient}
            />
            <View style={cardStyles.profileInfo}>
              <View style={cardStyles.nameRow}>
                <Text style={cardStyles.nameText}>
                  {user.name}, {user.age}
                </Text>
                {user.compatibility != null && (
                  <View style={{ marginLeft: 8 }}>
                    <CompatibilityBadge score={user.compatibility} breakdown={user.compatibilityBreakdown} />
                  </View>
                )}
              </View>
              <View style={cardStyles.locationRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={cardStyles.distanceText}>{user.location}</Text>
              </View>
            </View>
          </View>

          {/* Content Sections */}
          <View style={cardStyles.contentSections}>
            {user.bio ? (
              <View style={cardStyles.section}>
                <Text style={cardStyles.bioText}>{user.bio}</Text>
              </View>
            ) : null}

            <View style={cardStyles.section}>
              <Text style={cardStyles.sectionTitle}>nomad life</Text>
              <View style={cardStyles.infoGrid}>
                <View style={cardStyles.infoItem}>
                  <Ionicons name="globe-outline" size={20} color="#fd6b03" />
                  <Text style={cardStyles.infoLabel}>lifestyle</Text>
                  <Text style={cardStyles.infoValue}>{user.lifestyle.join(', ')}</Text>
                </View>
                <View style={cardStyles.infoItem}>
                  <Ionicons name="time-outline" size={20} color="#fd6b03" />
                  <Text style={cardStyles.infoLabel}>time nomadic</Text>
                  <Text style={cardStyles.infoValue}>{user.timeNomadic}</Text>
                </View>
                <View style={cardStyles.infoItem}>
                  <Ionicons name="heart-outline" size={20} color="#fd6b03" />
                  <Text style={cardStyles.infoLabel}>looking for</Text>
                  <Text style={cardStyles.infoValue}>{user.lookingFor}</Text>
                </View>
              </View>
            </View>

            {user.interests.length > 0 && (
              <View style={cardStyles.section}>
                <Text style={cardStyles.sectionTitle}>interests</Text>
                <View style={cardStyles.tagsContainer}>
                  {user.interests.map((interest) => (
                    <View key={interest} style={cardStyles.interestTag}>
                      <Text style={cardStyles.interestTagText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {user.photos.length > 1 && (
              <View style={cardStyles.section}>
                <Text style={cardStyles.sectionTitle}>more photos</Text>
                <View style={cardStyles.photosGrid}>
                  {user.photos.slice(1).map((photo, index) => (
                    <Image
                      key={index}
                      source={{ uri: photo }}
                      style={cardStyles.gridPhoto}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              </View>
            )}

            {user.instagram && (
              <View style={cardStyles.section}>
                <View style={cardStyles.instagramRow}>
                  <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                  <Text style={cardStyles.instagramText}>@{user.instagram}</Text>
                </View>
              </View>
            )}

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const DELETE_BUTTON_WIDTH = 80;

function SwipeableMessageRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const confirmDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('delete conversation?', 'this cannot be undone.', [
      { text: 'cancel', style: 'cancel', onPress: () => {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        isOpen.value = false;
      }},
      { text: 'delete', style: 'destructive', onPress: () => {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        onDelete();
      }},
    ]);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      if (isOpen.value) {
        const newX = -DELETE_BUTTON_WIDTH + event.translationX;
        translateX.value = Math.min(0, Math.max(-DELETE_BUTTON_WIDTH * 2, newX));
      } else {
        translateX.value = Math.min(0, event.translationX);
      }
    })
    .onEnd(() => {
      if (translateX.value < -DELETE_BUTTON_WIDTH / 2) {
        // Snap open to reveal delete button
        translateX.value = withSpring(-DELETE_BUTTON_WIDTH, { damping: 20, stiffness: 200 });
        isOpen.value = true;
      } else {
        // Snap closed
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        isOpen.value = false;
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => {
    const width = interpolate(
      translateX.value,
      [-DELETE_BUTTON_WIDTH * 2, -DELETE_BUTTON_WIDTH, 0],
      [DELETE_BUTTON_WIDTH * 2, DELETE_BUTTON_WIDTH, 0],
      Extrapolation.CLAMP
    );
    return { width };
  });

  return (
    <View style={{ overflow: 'hidden' }}>
      {/* Delete button behind the row */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: '#EF4444',
            justifyContent: 'center',
            alignItems: 'center',
          },
          deleteButtonStyle,
        ]}
      >
        <TouchableOpacity
          onPress={confirmDelete}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'InstrumentSans_500Medium', marginTop: 2 }}>
            delete
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Swipeable foreground row */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ backgroundColor: '#fff' }, rowStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState<'matches' | 'messages'>('matches');
  const { convexUser } = useAuthenticatedUser();
  const { hasDetourPlus } = useRevenueCat();
  const router = useRouter();
  const userId = convexUser?._id;
  const [showAllLikes, setShowAllLikes] = useState(false);
  const [previewUser, setPreviewUser] = useState<LikeUser | null>(null);
  const [previewSwipeDir, setPreviewSwipeDir] = useState<'left' | 'right' | null>(null);
  const [dismissedLikeIds, setDismissedLikeIds] = useState<Set<string>>(new Set());
  const [likedBackMatches, setLikedBackMatches] = useState<{ id: string; userId: string; name: string; age: number; photo: string; matchedAt: string; crossingPath: string | null; compatibility?: number; compatibilityBreakdown?: CompatibilityBreakdown }[]>([]);
  const [deletedConvoIds, setDeletedConvoIds] = useState<Set<string>>(new Set());
  const createSwipe = useMutation(api.swipes.create);
  const previewSwipeProgress = useSharedValue(0);

  const passButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      previewSwipeProgress.value,
      [-SWIPE_THRESHOLD, 0],
      [1.3, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const likeButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      previewSwipeProgress.value,
      [0, SWIPE_THRESHOLD],
      [1, 1.3],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const handlePreviewDismiss = async (action: 'like' | 'pass') => {
    if (!previewUser) return;
    const dismissedUser = previewUser;
    setPreviewSwipeDir(null);
    setPreviewUser(null);
    previewSwipeProgress.value = 0;

    setDismissedLikeIds((prev) => new Set(prev).add(dismissedUser.id));

    if (action === 'like' && userId) {
      try {
        const result = await createSwipe({
          swiperId: userId,
          swipedId: dismissedUser.id as any,
          action: 'like',
        });
        if (result?.isMatch) {
          setLikedBackMatches((prev) => [
            {
              id: result.matchId || dismissedUser.id,
              userId: dismissedUser.id,
              name: dismissedUser.name,
              age: dismissedUser.age,
              photo: dismissedUser.photos[0],
              matchedAt: 'just now',
              crossingPath: null,
            },
            ...prev,
          ]);
        }
      } catch (e) {
        console.error('Failed to like back:', e);
      }
    }
  };

  const handleOpenChat = (matchId: string) => {
    router.push(`/chat/${matchId}` as any);
  };

  // Fetch matches from Convex
  const matchesData = useQuery(
    api.matches.getByUser,
    userId ? { userId } : "skip"
  );

  // Fetch conversation previews for messages tab
  const conversationPreviews = useQuery(
    api.messages.getConversationPreviews,
    userId ? { userId } : "skip"
  );

  // Fetch real likes for current user
  const realLikes = useQuery(
    api.swipes.getLikesForUser,
    userId ? { userId } : "skip"
  );

  // Build likes you list from real data
  const likesYou = useMemo(() => {
    return (realLikes || []).map((l) => convexUserToLikeUser(l.user, convexUser));
  }, [realLikes, convexUser]);

  const visibleLikes = useMemo(
    () => likesYou.filter((u) => !dismissedLikeIds.has(u.id)),
    [likesYou, dismissedLikeIds]
  );

  const isLoading = userId && matchesData === undefined;

  // Current user's future trip locations for crossing paths detection
  const myTripLocations = useMemo(() => {
    if (!convexUser) return [];
    const trips = convexUser.futureTrips || [];
    return trips.map((t: { location: string }) => t.location.split(',')[0].trim().toLowerCase());
  }, [convexUser]);

  // Transform matches for display, fall back to mock data
  const matches = useMemo(() => {
    // If we have real matches from Convex, use them
    if (matchesData && matchesData.length > 0) {
      return matchesData.map((match) => {
        const otherUser = match.otherUser;
        const isNew = match.matchedAt && (Date.now() - match.matchedAt) < 24 * 60 * 60 * 1000;

        // Detect crossing paths from futureTrips overlap
        let crossingPath: string | null = null;
        if (otherUser && myTripLocations.length > 0) {
          const otherTrips = otherUser.futureTrips || [];
          for (const trip of otherTrips) {
            const city = trip.location.split(',')[0].trim().toLowerCase();
            if (myTripLocations.includes(city)) {
              crossingPath = trip.location.split(',')[0].trim();
              break;
            }
          }
        }

        const compatResult = (otherUser && convexUser)
          ? computeCompatibility(convexUser, otherUser)
          : undefined;

        return {
          id: match._id,
          userId: otherUser?._id,
          name: otherUser?.name ?? 'Unknown',
          age: otherUser?.birthday ? calculateAge(otherUser.birthday) : 0,
          matchedAt: formatRelativeTime(match.matchedAt),
          photo: otherUser?.photos?.[0] ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          isNew,
          crossingPath,
          compatibility: compatResult?.score,
          compatibilityBreakdown: compatResult?.breakdown,
        };
      });
    }
    return [];
  }, [matchesData, myTripLocations, convexUser]);

  // Combine real/mock matches with liked-back matches from the Likes You section
  const allMatches = useMemo(() => {
    return [
      ...likedBackMatches.map((m) => ({ ...m, isNew: true })),
      ...matches,
    ];
  }, [matches, likedBackMatches]);

  // For messages tab, use real conversation previews or fall back to mock
  const conversations = useMemo(() => {
    // If we have real conversation previews from Convex, use them
    if (conversationPreviews && conversationPreviews.length > 0) {
      return conversationPreviews.map((preview) => {
        const otherUser = preview.otherUser;
        return {
          id: preview.matchId,
          name: otherUser?.name ?? 'Unknown',
          lastMessage: preview.lastMessage?.content || 'Start a conversation!',
          time: formatRelativeTime(preview.lastMessage?.createdAt || preview.matchedAt),
          photo: otherUser?.photos?.[0] ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          unread: preview.unreadCount,
        };
      });
    }
    return [];
  }, [conversationPreviews]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-4 pb-4">
          <Text
            className="text-5xl text-black"
            style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
          >
            connections
          </Text>
        </View>

        <View className="flex-row px-6 mb-4">
          <TouchableOpacity
            onPress={() => setActiveTab('matches')}
            className={`flex-1 py-3 rounded-full mr-2 ${activeTab === 'matches' ? 'bg-black' : 'bg-gray-100'}`}
          >
            <Text
              className={`text-center ${activeTab === 'matches' ? 'text-white' : 'text-black'}`}
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              matches
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('messages')}
            className={`flex-1 py-3 rounded-full ml-2 ${activeTab === 'messages' ? 'bg-black' : 'bg-gray-100'}`}
          >
            <Text
              className={`text-center ${activeTab === 'messages' ? 'text-white' : 'text-black'}`}
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              messages
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'matches' ? (
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {isLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#fd6b03" />
                <Text
                  className="text-gray-500 mt-4"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  loading your connections...
                </Text>
              </View>
            ) : (
            <View className="pt-2">
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  className="text-lg text-black"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  likes you
                </Text>
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#fd6b03' }}>
                  <Text
                    className="text-white text-sm"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {visibleLikes.length}
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-6"
                contentContainerStyle={{ gap: 12 }}
              >
                {visibleLikes.slice(0, 7).map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    className="relative"
                    activeOpacity={0.9}
                    onPress={() => {
                      if (hasDetourPlus) {
                        setPreviewUser(user);
                      }
                    }}
                  >
                    <Image
                      source={{ uri: user.photos[0] }}
                      className="w-24 h-32 rounded-2xl"
                      resizeMode="cover"
                      blurRadius={hasDetourPlus ? 0 : 20}
                    />
                    {!hasDetourPlus && (
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                          <Ionicons name="lock-closed" size={20} color="#000" />
                        </View>
                      </View>
                    )}
                    {hasDetourPlus && (
                      <View className="absolute bottom-2 left-2 right-2">
                        <Text
                          className="text-white text-sm"
                          style={{ fontFamily: 'InstrumentSans_600SemiBold', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                        >
                          {user.name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {visibleLikes.length > 7 && (
                  <TouchableOpacity
                    className="w-24 h-32 bg-gray-100 rounded-2xl items-center justify-center"
                    activeOpacity={0.7}
                    onPress={() => setShowAllLikes(true)}
                  >
                    <Ionicons name="eye" size={24} color="#000" />
                    <Text
                      className="text-black text-xs mt-2 text-center"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      see all
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <Text
                className="text-lg text-black mb-4"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                your matches
              </Text>

              {allMatches.length === 0 ? (
                <View className="items-center py-12">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="heart-outline" size={32} color="#9CA3AF" />
                  </View>
                  <Text
                    className="text-gray-500 text-center"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    no matches yet. keep exploring!
                  </Text>
                </View>
              ) : (
                allMatches.map((match) => (
                  <View
                    key={match.id}
                    className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        if (match.userId) {
                          router.push(`/user/${match.userId}` as any);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: match.photo }}
                        className="w-16 h-16 rounded-full"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center">
                        <Text
                          className="text-black text-lg"
                          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                        >
                          {match.name}, {match.age}
                        </Text>
                        {match.compatibility != null && (
                          <View style={{ marginLeft: 6 }}>
                            <CompatibilityBadge score={match.compatibility} breakdown={match.compatibilityBreakdown} />
                          </View>
                        )}
                      </View>
                      <Text
                        className="text-gray-500 text-sm"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        matched {match.matchedAt}
                      </Text>
                      {match.crossingPath && (
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="git-compare-outline" size={12} color="#EA580C" />
                          <Text
                            className="text-orange-600 text-xs ml-1"
                            style={{ fontFamily: 'InstrumentSans_500Medium' }}
                          >
                            crossing paths in {match.crossingPath}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      className="w-10 h-10 bg-white rounded-full items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleOpenChat(match.id)}
                    >
                      <Ionicons name="chatbubble" size={20} color="#000" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {conversations.filter(c => !deletedConvoIds.has(c.id)).length === 0 ? (
              <View className="items-center py-20 px-6">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
                </View>
                <Text
                  className="text-xl text-black text-center mb-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  no messages yet
                </Text>
                <Text
                  className="text-gray-500 text-center"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  when you match with someone, you can start a conversation here.
                </Text>
              </View>
            ) : (
              conversations.filter(c => !deletedConvoIds.has(c.id)).map((convo) => (
                <SwipeableMessageRow
                  key={convo.id}
                  onDelete={() => {
                    setDeletedConvoIds(prev => new Set(prev).add(convo.id));
                  }}
                >
                  <TouchableOpacity
                    className="flex-row px-6 py-4 border-b border-gray-100"
                    activeOpacity={0.7}
                    onPress={() => handleOpenChat(convo.id)}
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: convo.photo }}
                        className="w-14 h-14 rounded-full"
                        resizeMode="cover"
                      />
                    </View>

                    <View className="flex-1 ml-4">
                      <Text
                        className="text-black text-base"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {convo.name}
                      </Text>
                      <Text
                        className={`text-sm mt-0.5 ${convo.unread > 0 ? 'text-black' : 'text-gray-500'}`}
                        style={{ fontFamily: convo.unread > 0 ? 'InstrumentSans_500Medium' : 'InstrumentSans_400Regular', maxWidth: '92%' }}
                        numberOfLines={1}
                      >
                        {convo.lastMessage}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text
                        className="text-sm text-gray-500"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {convo.time}
                      </Text>
                      {convo.unread > 0 && (
                        <View className="w-6 h-6 rounded-full items-center justify-center mt-1" style={{ backgroundColor: '#fd6b03' }}>
                          <Text
                            className="text-white text-xs"
                            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                          >
                            {convo.unread}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </SwipeableMessageRow>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Likes You Preview Modal */}
      <Modal
        visible={!!previewUser}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewUser(null)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setPreviewSwipeDir(null);
              setPreviewUser(null);
              previewSwipeProgress.value = 0;
            }}
          />
          <View style={cardStyles.modalOverlay}>
            <View style={cardStyles.modalCardContainer}>
              {previewUser && (
                <LikePreviewCard
                  user={previewUser}
                  onDismiss={handlePreviewDismiss}
                  swipeProgress={previewSwipeProgress}
                  swipeDirection={previewSwipeDir}
                />
              )}
            </View>
            {/* Action Buttons */}
            <View style={cardStyles.actionButtons}>
              <Animated.View style={passButtonStyle}>
                <TouchableOpacity
                  style={cardStyles.actionButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setPreviewSwipeDir('left');
                    setTimeout(() => handlePreviewDismiss('pass'), 350);
                  }}
                >
                  <Ionicons name="close" size={32} color="#fd6b03" />
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={likeButtonStyle}>
                <TouchableOpacity
                  style={cardStyles.actionButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setPreviewSwipeDir('right');
                    setTimeout(() => handlePreviewDismiss('like'), 350);
                  }}
                >
                  <Ionicons name="heart" size={32} color="#fd6b03" />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* See All Likes Modal */}
      <Modal
        visible={showAllLikes}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllLikes(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setShowAllLikes(false)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text
              className="text-2xl text-black"
              style={{ fontFamily: 'InstrumentSans_700Bold' }}
            >
              likes you
            </Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#fd6b03' }}>
              <Text
                className="text-white text-sm"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {visibleLikes.length}
              </Text>
            </View>
          </View>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          >
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {visibleLikes.map((user) => {
                const itemWidth = Math.floor((Dimensions.get('window').width - 48 - 16) / 3);
                return (
                <TouchableOpacity
                  key={user.id}
                  className="relative"
                  activeOpacity={0.9}
                  onPress={() => {
                    if (hasDetourPlus) {
                      setShowAllLikes(false);
                      setTimeout(() => setPreviewUser(user), 300);
                    }
                  }}
                  style={{ width: itemWidth, height: itemWidth * 1.33 }}
                >
                  <Image
                    source={{ uri: user.photos[0] }}
                    style={{ width: '100%', height: '100%', borderRadius: 16 }}
                    resizeMode="cover"
                    blurRadius={hasDetourPlus ? 0 : 20}
                  />
                  {!hasDetourPlus && (
                    <View className="absolute inset-0 items-center justify-center">
                      <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                        <Ionicons name="lock-closed" size={20} color="#000" />
                      </View>
                    </View>
                  )}
                  {hasDetourPlus && (
                    <View className="absolute bottom-2 left-2 right-2">
                      <Text
                        className="text-white text-sm"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                      >
                        {user.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </GestureHandlerRootView>
  );
}

const cardStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCardContainer: {
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 32,
    height: CARD_HEIGHT,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceText: {
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 14,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
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
});
