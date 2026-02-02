import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import SwipeCard from './SwipeCard';

const MAX_VISIBLE_CARDS = 3;

interface CardStackProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
  onEmpty?: () => void;
  keyExtractor: (item: T) => string;
}

export default function CardStack<T>({
  data,
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  onEmpty,
  keyExtractor,
}: CardStackProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeLeft = useCallback(() => {
    const currentItem = data[currentIndex];
    if (onSwipeLeft && currentItem) {
      onSwipeLeft(currentItem);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= data.length) {
      if (onEmpty) {
        onEmpty();
      }
    }
    setCurrentIndex(nextIndex);
  }, [currentIndex, data, onSwipeLeft, onEmpty]);

  const handleSwipeRight = useCallback(() => {
    const currentItem = data[currentIndex];
    if (onSwipeRight && currentItem) {
      onSwipeRight(currentItem);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= data.length) {
      if (onEmpty) {
        onEmpty();
      }
    }
    setCurrentIndex(nextIndex);
  }, [currentIndex, data, onSwipeRight, onEmpty]);

  // Only render visible cards for performance
  const visibleCards = data.slice(currentIndex, currentIndex + MAX_VISIBLE_CARDS);

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleCards.map((item, index) => {
        const actualIndex = currentIndex + index;
        return (
          <SwipeCard
            key={keyExtractor(item)}
            cardIndex={index}
            totalCards={visibleCards.length}
            onSwipeLeft={index === 0 ? handleSwipeLeft : undefined}
            onSwipeRight={index === 0 ? handleSwipeRight : undefined}
          >
            {renderCard(item, actualIndex)}
          </SwipeCard>
        );
      }).reverse()}
    </View>
  );
}

// Export for programmatic swipe from buttons
export interface CardStackRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
