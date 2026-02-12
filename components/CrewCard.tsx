import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()} - ${e.getDate()}`;
  }
  return `${sMonth} ${s.getDate()} - ${eMonth} ${e.getDate()}`;
}

interface CrewMember {
  userId: string;
  name: string;
  photo: string;
}

interface Crew {
  crewId: string;
  destination: string;
  destinationShort: string;
  overlapStart: string;
  overlapEnd: string;
  overlapDays: number;
  memberCount: number;
  members: CrewMember[];
}

interface CrewCardProps {
  crew: Crew;
  onPress: () => void;
}

export function CrewCard({ crew, onPress }: CrewCardProps) {
  const dateLabel = formatDateRange(crew.overlapStart, crew.overlapEnd);
  const avatars = crew.members.slice(0, 4);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ marginBottom: 12 }}
    >
      <View style={{
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#fd6b03',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        {/* Stacked avatars */}
        <View style={{ flexDirection: 'row', marginRight: 16 }}>
          {avatars.map((member, i) => (
            <Image
              key={member.userId}
              source={{ uri: member.photo }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 2,
                borderColor: '#fff',
                marginLeft: i === 0 ? 0 : -12,
                zIndex: avatars.length - i,
                backgroundColor: '#E5E7EB',
              }}
            />
          ))}
          {crew.memberCount > 5 && (
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#fd6b03',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: -12,
              borderWidth: 2,
              borderColor: '#fff',
            }}>
              <Text style={{ color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 }}>
                +{crew.memberCount - 5}
              </Text>
            </View>
          )}
        </View>

        {/* Crew info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 22, color: '#000' }}
            numberOfLines={1}
          >
            {crew.destinationShort}
          </Text>
          <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            {dateLabel}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <View style={{
              backgroundColor: '#fd6b03',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
            }}>
              <Text style={{ color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11 }}>
                {crew.memberCount} nomads
              </Text>
            </View>
            <Text style={{
              fontFamily: 'InstrumentSans_400Regular',
              fontSize: 12,
              color: '#9CA3AF',
              marginLeft: 8,
            }}>
              {crew.overlapDays}d overlap
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}
