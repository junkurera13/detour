import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Image } from 'react-native';
import { useOnboarding } from '@/context/OnboardingContext';

export default function TabLayout() {
  const { data } = useOnboarding();
  const profilePhoto = data.photos[0];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fd6b03',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 88,
          paddingTop: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="map-marker-radius" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="binoculars" size={28} color={color} />
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
            <MaterialCommunityIcons name="hand-heart" size={28} color={color} />
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
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: focused ? '#fd6b03' : '#E5E7EB',
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="account" size={18} color={color} />
              </View>
            )
          ),
        }}
      />
    </Tabs>
  );
}
