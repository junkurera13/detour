import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export default function DoneScreen() {
  const router = useRouter();
  const { data } = useOnboarding();

  const opacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    confettiOpacity.value = withDelay(200, withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1500, withTiming(0, { duration: 500 }))
    ));
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 items-center justify-center">
        <Animated.View style={confettiStyle} className="absolute top-20">
          <Text className="text-4xl">🎉</Text>
        </Animated.View>

        <Animated.View style={textStyle}>
          <Text
            className="text-3xl text-black text-center mb-3"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            you're all set, {data.name.toLowerCase()}!
          </Text>

          <Text
            className="text-lg text-gray-500 text-center px-4 leading-7"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            your profile is ready. start exploring{'\n'}and find your people on the road.
          </Text>
        </Animated.View>
      </View>

      <View className="px-6 pb-8">
        <Button
          title="find nomads nearby"
          onPress={handleContinue}
          variant="accent"
        />
      </View>
    </SafeAreaView>
  );
}
