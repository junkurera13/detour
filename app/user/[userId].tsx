import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { mockUsers } from '@/data/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  // Try fetching from Convex (real user)
  const isMockUser = userId?.startsWith('user_');
  const convexUser = useQuery(
    api.users.getById,
    !isMockUser && userId ? { id: userId as Id<"users"> } : "skip"
  );

  // Find mock user if applicable
  const mockUser = isMockUser ? mockUsers.find((u) => u.id === userId) : null;

  // Normalize data
  const user = convexUser
    ? {
        name: convexUser.name,
        age: calculateAge(convexUser.birthday),
        location: convexUser.currentLocation,
        lifestyle: convexUser.lifestyle,
        photos: convexUser.photos,
        interests: convexUser.interests,
        bio: '',
        timeNomadic: convexUser.timeNomadic,
        lookingFor: convexUser.lookingFor.join(', '),
        instagram: convexUser.instagram,
      }
    : mockUser
    ? {
        name: mockUser.name,
        age: mockUser.age,
        location: mockUser.location,
        lifestyle: mockUser.lifestyle,
        photos: mockUser.photos,
        interests: mockUser.interests,
        bio: mockUser.bio,
        timeNomadic: mockUser.timeNomadic,
        lookingFor: mockUser.lookingFor,
        instagram: mockUser.instagram,
      }
    : null;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Main Photo */}
        <Image
          source={{ uri: user.photos[0] }}
          style={styles.mainPhoto}
          resizeMode="cover"
        />

        {/* Name & Location */}
        <View style={styles.nameSection}>
          <Text style={styles.nameText}>{user.name}, {user.age}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#9CA3AF" />
            <Text style={styles.locationText}>{user.location}</Text>
          </View>
        </View>

        {/* Bio */}
        {user.bio ? (
          <View style={styles.section}>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        ) : null}

        {/* Nomad Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>nomad life</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="globe-outline" size={20} color="#fd6b03" />
              <Text style={styles.infoLabel}>lifestyle</Text>
              <Text style={styles.infoValue}>{user.lifestyle.join(', ')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#fd6b03" />
              <Text style={styles.infoLabel}>time nomadic</Text>
              <Text style={styles.infoValue}>{user.timeNomadic}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="heart-outline" size={20} color="#fd6b03" />
              <Text style={styles.infoLabel}>looking for</Text>
              <Text style={styles.infoValue}>{user.lookingFor}</Text>
            </View>
          </View>
        </View>

        {/* Interests */}
        {user.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>interests</Text>
            <View style={styles.tagsContainer}>
              {user.interests.map((interest) => (
                <View key={interest} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* More Photos */}
        {user.photos.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>more photos</Text>
            <View style={styles.photosGrid}>
              {user.photos.slice(1).map((photo, index) => (
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

        {/* Instagram */}
        {user.instagram ? (
          <View style={styles.section}>
            <View style={styles.instagramRow}>
              <Ionicons name="logo-instagram" size={20} color="#E4405F" />
              <Text style={styles.instagramText}>@{user.instagram}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'InstrumentSans_600SemiBold',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'InstrumentSans_400Regular',
  },
  mainPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  nameSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  nameText: {
    fontSize: 28,
    color: '#000',
    fontFamily: 'InstrumentSans_700Bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    color: '#9CA3AF',
    marginLeft: 4,
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 15,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
    width: (SCREEN_WIDTH - 40 - 8) / 2,
    height: (SCREEN_WIDTH - 40 - 8) / 2,
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
