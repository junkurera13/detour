import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { CompatibilityBreakdown } from '@/utils/compatibility';

function getBadgeColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 50) return '#fd6b03';
  if (score >= 31) return '#EF4444';
  return '#9CA3AF';
}

function SubScore({ value }: { value: number }) {
  return (
    <View
      style={{
        backgroundColor: getBadgeColor(value),
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 42,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'InstrumentSans_600SemiBold' }}>
        {value}%
      </Text>
    </View>
  );
}

function BreakdownRow({
  icon,
  iconColor,
  label,
  detail,
  subScore,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  detail: string;
  subScore: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 14, color: '#000', fontFamily: 'InstrumentSans_600SemiBold' }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'InstrumentSans_400Regular', marginTop: 1 }}>
          {detail}
        </Text>
      </View>
      <SubScore value={subScore} />
    </View>
  );
}

interface Props {
  score: number;
  size?: 'sm' | 'md';
  breakdown?: CompatibilityBreakdown;
}

export function CompatibilityBadge({ score, size = 'sm', breakdown }: Props) {
  const [visible, setVisible] = useState(false);
  const color = getBadgeColor(score);
  const isSmall = size === 'sm';

  const badge = (
    <View
      style={{
        backgroundColor: color,
        paddingHorizontal: isSmall ? 8 : 10,
        paddingVertical: isSmall ? 3 : 4,
        borderRadius: 12,
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: isSmall ? 12 : 14,
          fontFamily: 'InstrumentSans_600SemiBold',
        }}
      >
        {score}%
      </Text>
    </View>
  );

  if (!breakdown) return badge;

  // Build detail strings
  const interestDetail =
    breakdown.interests.shared.length > 0
      ? `${breakdown.interests.shared.length} in common: ${breakdown.interests.shared.slice(0, 4).join(', ')}${breakdown.interests.shared.length > 4 ? '...' : ''}`
      : 'no shared interests yet';

  const routeParts: string[] = [];
  if (breakdown.route.sameCity) routeParts.push('same city right now');
  if (breakdown.route.sharedTrips.length > 0)
    routeParts.push(`both heading to ${breakdown.route.sharedTrips.slice(0, 2).join(', ')}`);
  const routeDetail = routeParts.length > 0 ? routeParts.join(' + ') : 'no travel overlap';

  const lifestyleDetail =
    breakdown.lifestyle.shared.length > 0
      ? `${breakdown.lifestyle.shared.length} in common: ${breakdown.lifestyle.shared.slice(0, 3).join(', ')}${breakdown.lifestyle.shared.length > 3 ? '...' : ''}`
      : 'different lifestyles';

  const travellingWithDetail = (() => {
    const types = breakdown.travellingWith.sharedTypes;
    if (types.length > 0) {
      const label = types.length === 1 ? `you both have a ${types[0]}` : `you both have ${types.join(' & ')}`;
      return label;
    }
    return 'no shared pets';
  })();

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.7}>
        {badge}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setVisible(false)} />
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}>
            {/* Drag handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: color,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'InstrumentSans_700Bold' }}>
                  {score}%
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: '#000', fontFamily: 'InstrumentSans_700Bold', marginLeft: 10 }}>
                compatibility
              </Text>
            </View>

            {/* Breakdown rows */}
            <BreakdownRow
              icon="airplane-outline"
              iconColor="#3B82F6"
              label="route overlap"
              detail={routeDetail}
              subScore={breakdown.route.score}
            />
            <BreakdownRow
              icon="sparkles-outline"
              iconColor="#fd6b03"
              label="shared interests"
              detail={interestDetail}
              subScore={breakdown.interests.score}
            />
            <BreakdownRow
              icon="globe-outline"
              iconColor="#8B5CF6"
              label="lifestyle match"
              detail={lifestyleDetail}
              subScore={breakdown.lifestyle.score}
            />
            <BreakdownRow
              icon="paw-outline"
              iconColor="#EC4899"
              label="travelling with"
              detail={travellingWithDetail}
              subScore={breakdown.travellingWith.score}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
