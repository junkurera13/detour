import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';

const features = [
  { icon: 'infinite', label: 'unlimited connections' },
  { icon: 'location', label: "see who's nearby" },
  { icon: 'chatbubbles', label: 'unlimited messaging' },
  { icon: 'eye-off', label: 'incognito mode' },
  { icon: 'star', label: 'priority in search' },
  { icon: 'globe', label: 'see travelers heading your way' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  const handleStartTrial = () => {
    updateData({ hasCompletedOnboarding: true });
    router.replace('/onboarding/done');
  };

  const handleSkip = () => {
    updateData({ hasCompletedOnboarding: true });
    router.replace('/onboarding/done');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6 pt-4">
          <TouchableOpacity
            onPress={handleSkip}
            className="self-end"
          >
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              maybe later
            </Text>
          </TouchableOpacity>

          <View className="items-center mt-8 mb-6">
            <LinearGradient
              colors={['#fd6b03', '#fd9003']}
              className="w-20 h-20 rounded-3xl items-center justify-center mb-4"
            >
              <Ionicons name="compass" size={40} color="#fff" />
            </LinearGradient>
            <Text
              className="text-3xl text-black text-center"
              style={{ fontFamily: 'InstrumentSans_700Bold' }}
            >
              unlock detour pro
            </Text>
            <Text
              className="text-gray-500 text-center mt-2"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              start your 7-day free trial
            </Text>
          </View>

          <View className="bg-gray-50 rounded-3xl p-5 mb-6">
            {features.map((feature, index) => (
              <View
                key={feature.label}
                className={`flex-row items-center ${
                  index < features.length - 1 ? 'mb-4' : ''
                }`}
              >
                <LinearGradient
                  colors={['#fd6b03', '#fd9003']}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <Ionicons name={feature.icon as any} size={20} color="#fff" />
                </LinearGradient>
                <Text
                  className="text-black ml-3 flex-1"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  {feature.label}
                </Text>
                <Ionicons name="checkmark" size={20} color="#10B981" />
              </View>
            ))}
          </View>

          <View className="gap-3 mb-6">
            <TouchableOpacity
              onPress={() => setSelectedPlan('yearly')}
              className={`p-4 rounded-2xl border-2 ${
                selectedPlan === 'yearly'
                  ? 'border-orange-primary bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <View className="flex-row items-center">
                    <Text
                      className="text-lg text-black"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      yearly
                    </Text>
                    <View className="bg-orange-100 px-2 py-0.5 rounded-full ml-2">
                      <Text
                        className="text-xs"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold', color: '#fd6b03' }}
                      >
                        save 50%
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-gray-500 mt-0.5"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    $4.99/month, billed annually
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    selectedPlan === 'yearly'
                      ? 'border-orange-primary'
                      : 'border-gray-300'
                  }`}
                  style={selectedPlan === 'yearly' ? { backgroundColor: '#fd6b03' } : {}}
                >
                  {selectedPlan === 'yearly' && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPlan('monthly')}
              className={`p-4 rounded-2xl border-2 ${
                selectedPlan === 'monthly'
                  ? 'border-orange-primary bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className="text-lg text-black"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    monthly
                  </Text>
                  <Text
                    className="text-gray-500 mt-0.5"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    $9.99/month
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    selectedPlan === 'monthly'
                      ? 'border-orange-primary'
                      : 'border-gray-300'
                  }`}
                  style={selectedPlan === 'monthly' ? { backgroundColor: '#fd6b03' } : {}}
                >
                  {selectedPlan === 'monthly' && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-8 pt-4 bg-white border-t border-gray-100">
        <Button
          title="start 7-day free trial"
          onPress={handleStartTrial}
        />
        <Text
          className="text-xs text-gray-400 text-center mt-3"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          cancel anytime. no charge until trial ends.
        </Text>
      </View>
    </SafeAreaView>
  );
}
