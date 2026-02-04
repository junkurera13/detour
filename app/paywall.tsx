import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { DETOUR_PLUS_ENTITLEMENT, useRevenueCat } from '@/context/RevenueCatContext';

const features = [
  {
    icon: 'people',
    title: 'unlimited connections',
    description: 'connect with all nearby nomads',
  },
  {
    icon: 'chatbubbles',
    title: 'unlimited messages',
    description: 'message your matches without limits',
  },
  {
    icon: 'eye',
    title: 'see who likes you',
    description: 'know who\'s interested before you swipe',
  },
  {
    icon: 'star',
    title: 'priority visibility',
    description: 'appear at the top of the nearby list',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    offerings,
    purchasePackage,
    restorePurchases,
    isLoading: isRevenueCatLoading,
  } = useRevenueCat();

  const currentOffering = offerings?.current;
  const packageById = (id: string) =>
    currentOffering?.availablePackages?.find((pkg: { identifier: string }) => pkg.identifier === id);

  const yearlyPackage = currentOffering?.annual ?? packageById('yearly') ?? packageById('detour_plus_yearly');
  const yearlyPrice = yearlyPackage?.product?.priceString ?? '$99.99/year';

  const hasDetourPlus = (info: any) =>
    Boolean(info?.entitlements?.active?.[DETOUR_PLUS_ENTITLEMENT]);

  const handleSubscribe = async () => {
    if (isProcessing) return;

    if (!yearlyPackage) {
      Alert.alert('Plans not ready', 'Pricing is still loading. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const info = await purchasePackage(yearlyPackage);
      if (!info) {
        setIsProcessing(false);
        return;
      }

      if (hasDetourPlus(info)) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Subscription inactive', 'Purchase did not activate your subscription.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase failed', 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const info = await restorePurchases();
      if (info && hasDetourPlus(info)) {
        router.replace('/(tabs)');
        return;
      }
      Alert.alert('No active subscription', 'We could not find an active subscription to restore.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log out?',
      'You\'ll need to sign in again to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text
          className="text-2xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          detour
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text
            className="text-gray-400"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            log out
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Title */}
        <Text
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'InstrumentSans_700Bold' }}
        >
          your trial has ended
        </Text>
        <Text
          className="text-base text-gray-500 mb-8"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          subscribe to keep connecting with nomads worldwide
        </Text>

        {/* Features */}
        <View className="mb-8">
          {features.map((feature) => (
            <View key={feature.title} className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center">
                <Ionicons name={feature.icon as any} size={24} color="#fd6b03" />
              </View>
              <View className="flex-1 ml-4">
                <Text
                  className="text-base text-black"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {feature.title}
                </Text>
                <Text
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Card */}
        <View className="border-2 border-orange-primary rounded-2xl p-5 bg-orange-50">
          <Text
            className="text-xl text-black mb-2"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            detour plus
          </Text>
          <Text
            className="text-3xl text-black mb-1"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            {yearlyPrice}
          </Text>
          <Text
            className="text-sm text-gray-500"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            billed annually • cancel anytime
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-6 pb-6 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={isProcessing || isRevenueCatLoading}
          style={{
            backgroundColor: isProcessing ? '#fca560' : '#fd6b03',
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isProcessing && <ActivityIndicator color="#fff" size="small" />}
          <Text
            className="text-white text-lg"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            {isProcessing ? 'processing...' : 'subscribe now'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center items-center mt-4 gap-4">
          <TouchableOpacity>
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              terms
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-300">•</Text>
          <TouchableOpacity>
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              privacy
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-300">•</Text>
          <TouchableOpacity onPress={handleRestore}>
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              restore
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
