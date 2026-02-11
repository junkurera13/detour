import { View, PanResponder } from 'react-native';
import { useRef } from 'react';
import * as Haptics from 'expo-haptics';

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 3;

export function RangeSlider({
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
