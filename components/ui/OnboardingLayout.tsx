import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProgressBar } from './ProgressBar';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  currentStep?: number;
  totalSteps?: number;
  showBack?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  scrollable?: boolean;
}

export function OnboardingLayout({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps = 13,
  showBack = true,
  showSkip = false,
  onSkip,
  scrollable = false,
}: OnboardingLayoutProps) {
  const router = useRouter();

  const content = (
    <>
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-6">
          {showBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}

          {currentStep !== undefined && (
            <View className="flex-1 mx-4">
              <ProgressBar current={currentStep} total={totalSteps} />
            </View>
          )}

          {showSkip ? (
            <TouchableOpacity onPress={onSkip}>
              <Text
                className="text-gray-500 text-base"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                skip
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>

        <Text
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            className="text-base text-gray-500"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {scrollable ? (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 px-6">{children}</View>
      )}
    </>
  );

  return (
    <ImageBackground
      source={require('@/assets/images/onboarding-pages-bg.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
