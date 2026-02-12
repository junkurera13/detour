import { Tabs, Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { useLocationSync } from '@/hooks/useLocationSync';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const { data } = useOnboarding();
  const { convexUser, isSignedIn, isLoading: isAuthLoading } = useAuthenticatedUser();
  const { hasDetourPlus, isLoading: isRevenueCatLoading, isConfigured } = useRevenueCat();
  const insets = useSafeAreaInsets();
  useLocationSync();

  // Guard: redirect away if user shouldn't be on tabs
  if (isAuthLoading || (isConfigured && isRevenueCatLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#fd6b03" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  if (!convexUser) {
    return <Redirect href="/onboarding/join-path" />;
  }

  if (convexUser.userStatus === 'pending') {
    return <Redirect href="/pending" />;
  }

  if (!hasDetourPlus) {
    return <Redirect href="/paywall" />;
  }
  const profilePhoto = convexUser?.photos?.[0] || data.photos[0];
  const tabBarHeight = 62 + insets.bottom;
  const tabBarPaddingBottom = Math.max(insets.bottom, 12);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fd6b03',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 16,
        },
        tabBarShowLabel: false,
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="dice-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="lightning-bolt-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused
                ? require('@/assets/images/heart-active-icon.png')
                : require('@/assets/images/heart-icon.png')
              }
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="hand-heart-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            profilePhoto ? (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: focused ? '#fd6b03' : '#E5E7EB',
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={{ uri: profilePhoto }}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            ) : (
              <Ionicons name="person-outline" size={28} color={color} />
            )
          ),
        }}
      />
    </Tabs>
  );
}
