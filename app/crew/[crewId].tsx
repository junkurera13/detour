import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

const interestLabels: Record<string, string> = {
  'grab-coffee': 'coffee', 'try-street-food': 'street food', 'cook-together': 'cooking',
  'go-hiking': 'hiking', 'go-surfing': 'surfing', 'go-diving': 'diving',
  'go-camping': 'camping', 'go-climbing': 'climbing', 'go-cycling': 'cycling',
  'beach-days': 'beach', 'go-dancing': 'dancing', 'see-live-music': 'live music',
  'hit-the-gym': 'gym', 'do-yoga': 'yoga', 'go-running': 'running',
  'visit-museums': 'museums', 'take-photos': 'photography', 'find-street-art': 'street art',
  'cowork-at-cafes': 'coworking', 'brainstorm-ideas': 'brainstorming',
  'make-content': 'content', 'build-stuff': 'building', 'watch-sunsets': 'sunsets',
  'read-together': 'reading', 'play-board-games': 'board games', 'meditate': 'meditation',
};

function getAge(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  if (sMonth === eMonth) return `${sMonth} ${s.getDate()} - ${e.getDate()}`;
  return `${sMonth} ${s.getDate()} - ${eMonth} ${e.getDate()}`;
}

export default function CrewDetailScreen() {
  const router = useRouter();
  const { crewId } = useLocalSearchParams<{ crewId: string }>();
  const { convexUser } = useAuthenticatedUser();
  const crews = useQuery(api.crews.getCrewsForUser, convexUser?._id ? {} : "skip");
  const crew = crews?.find(c => c.crewId === crewId);

  if (!crews) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <Text style={{ fontFamily: 'InstrumentSans_400Regular', color: '#9CA3AF' }}>loading...</Text>
      </SafeAreaView>
    );
  }

  if (!crew) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <Text style={{ fontFamily: 'InstrumentSans_400Regular', color: '#9CA3AF' }}>crew not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text style={{ fontFamily: 'InstrumentSans_500Medium', color: '#fd6b03' }}>go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const userInterests = convexUser?.interests || [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 20, color: '#000' }}>
          route mesh
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Crew Info */}
        <View className="px-6 pt-5 pb-3">
          <Text style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: '#000' }}>
            {crew.destinationShort}
          </Text>
          <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            {formatDateRange(crew.overlapStart, crew.overlapEnd)} — {crew.overlapDays} days together
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{
              backgroundColor: '#fd6b03',
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 12,
            }}>
              <Text style={{ color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 12 }}>
                {crew.memberCount} nomads
              </Text>
            </View>
          </View>
        </View>

        {/* Member List */}
        <View className="px-6 pt-2">
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#000', marginBottom: 12 }}>
            your crew
          </Text>

          {/* Current user */}
          {convexUser && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <Image
                source={{ uri: (convexUser.photos || [])[0] }}
                style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB' }}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000' }}>
                    {convexUser.name}{convexUser.birthday ? `, ${getAge(convexUser.birthday)}` : ''}
                  </Text>
                  <View style={{
                    backgroundColor: '#10B981',
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    marginLeft: 8,
                  }}>
                    <Text style={{ color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 10 }}>you</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                  {(convexUser.currentLocation || '').split(',')[0]}
                </Text>
              </View>
            </View>
          )}

          {crew.members.map((member, index) => {
            const age = getAge(member.birthday);
            const arrival = new Date(member.tripStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const sharedInterests = member.interests
              .filter(i => userInterests.includes(i))
              .slice(0, 3);

            return (
              <TouchableOpacity
                key={member.userId}
                onPress={() => router.push(`/user/${member.userId}` as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <Image
                  source={{ uri: member.photo }}
                  style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB' }}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000' }}>
                    {member.name}, {age}
                  </Text>
                  <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {member.currentLocation.split(',')[0]} — arrives {arrival}
                  </Text>
                  {sharedInterests.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {sharedInterests.map(interest => (
                        <View
                          key={interest}
                          style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}
                        >
                          <Text style={{ color: '#fd6b03', fontFamily: 'InstrumentSans_500Medium', fontSize: 11 }}>
                            {interestLabels[interest] || interest}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 12, color: '#0D9488' }}>
                    {member.overlapDays}d
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

