import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Modal, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { CompatibilityBadge } from '@/components/ui/CompatibilityBadge';
import { CompatibilityBreakdown } from '@/utils/compatibility';
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
export const SWIPE_THRESHOLD = 120;
export const SWIPE_VELOCITY_THRESHOLD = 500;
export const CARD_HEIGHT = Platform.OS === 'android' ? WINDOW_HEIGHT * 0.74 : WINDOW_HEIGHT * 0.71;
export { SCREEN_WIDTH, WINDOW_HEIGHT };

export interface Profile {
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

export interface SwipeableCardProps {
  profile: Profile;
  isFirst: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  swipeDirection: 'left' | 'right' | null;
  swipeProgress: SharedValue<number>;
}

export function SwipeableCard({ profile, isFirst, onSwipeLeft, onSwipeRight, swipeDirection, swipeProgress }: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const cardRouter = useRouter();
  const blockUser = useMutation(api.blocks.blockUser);
  const reportUser = useMutation(api.reports.create);
  const { convexUser: swipeCardUser } = useAuthenticatedUser();

  const triggerHaptic = (type: 'light' | 'medium') => {
    if (type === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
    triggerHaptic('medium');
    if (direction === 'left') {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  // Handle programmatic swipe from buttons
  useEffect(() => {
    if (!swipeDirection || !isFirst) return;
    const targetX = swipeDirection === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(targetX, { duration: 300 }, () => {
      runOnJS(handleSwipeComplete)(swipeDirection);
    });
  }, [handleSwipeComplete, isFirst, swipeDirection, translateX]);

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
              accessibilityLabel="Open profile menu"
              accessibilityRole="button"
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
                onPress={() => {
                  setMenuVisible(false);
                  if (!swipeCardUser) return;
                  Alert.alert(
                    'block this user?',
                    'they won\'t be able to see you and you won\'t see them.',
                    [
                      { text: 'cancel', style: 'cancel' },
                      {
                        text: 'block',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await blockUser({ blockedId: profile.id as Id<'users'> });
                            onSwipeLeft();
                          } catch (e) {
                              console.error("Failed to block user:", e);
                              Alert.alert('error', 'failed to block user. please try again.');
                            }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={[styles.menuOptionText, styles.menuOptionDanger]}>block</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  setMenuVisible(false);
                  Alert.alert(
                    'report and block this user?',
                    'this will report them for review and block them.',
                    [
                      { text: 'cancel', style: 'cancel' },
                      {
                        text: 'report & block',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await reportUser({ reportedId: profile.id as Id<'users'>, reason: 'reported from discovery' });
                            onSwipeLeft();
                          } catch (e) {
                              console.error("Failed to report user:", e);
                              Alert.alert('error', 'failed to report user. please try again.');
                            }
                        },
                      },
                    ]
                  );
                }}
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

const styles = StyleSheet.create({
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
  distanceText: {
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 14,
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
