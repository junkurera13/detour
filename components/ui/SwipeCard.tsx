import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500;

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  cardIndex: number;
  totalCards: number;
}

export default function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  cardIndex,
  totalCards,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isActive = cardIndex === 0;

  const triggerHaptic = (type: 'light' | 'medium') => {
    if (type === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    triggerHaptic('medium');
    if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === 'right' && onSwipeRight) {
      onSwipeRight();
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onStart(() => {
      runOnJS(triggerHaptic)('light');
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
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
        translateY.value = withTiming(translateY.value + 50, { duration: 300 });
      } else if (shouldSwipeLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('left');
        });
        translateY.value = withTiming(translateY.value + 50, { duration: 300 });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    const scale = isActive
      ? 1
      : interpolate(cardIndex, [0, 1, 2], [1, 0.95, 0.9], Extrapolation.CLAMP);

    const translateYOffset = isActive
      ? 0
      : interpolate(cardIndex, [0, 1, 2], [0, 10, 20], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: isActive ? translateX.value : 0 },
        { translateY: isActive ? translateY.value : translateYOffset },
        { rotate: isActive ? `${rotate}deg` : '0deg' },
        { scale },
      ],
      zIndex: totalCards - cardIndex,
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity: isActive ? opacity : 0 };
  });

  const nopeOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity: isActive ? opacity : 0 };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
        {children}
        <Animated.View style={[styles.labelContainer, styles.likeLabel, likeOpacityStyle]}>
          <Animated.Text style={styles.labelText}>LIKE</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.labelContainer, styles.nopeLabel, nopeOpacityStyle]}>
          <Animated.Text style={styles.labelText}>NOPE</Animated.Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

// Export method for programmatic swipe (from buttons)
export function useSwipeCard() {
  const translateX = useSharedValue(0);

  const swipeLeft = (onComplete: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
      runOnJS(onComplete)();
    });
  };

  const swipeRight = (onComplete: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
      runOnJS(onComplete)();
    });
  };

  return { translateX, swipeLeft, swipeRight };
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  labelContainer: {
    position: 'absolute',
    top: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeLabel: {
    right: 20,
    borderColor: '#22c55e',
    transform: [{ rotate: '15deg' }],
  },
  nopeLabel: {
    left: 20,
    borderColor: '#ef4444',
    transform: [{ rotate: '-15deg' }],
  },
  labelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
