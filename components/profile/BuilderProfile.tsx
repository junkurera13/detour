import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const helpCategoryLabels: Record<string, { label: string; emoji: string }> = {
  'repairs': { label: 'repairs', emoji: '🔧' },
  'electrical': { label: 'electrical', emoji: '⚡' },
  'build': { label: 'build', emoji: '🪚' },
  'plumbing': { label: 'plumbing', emoji: '🚿' },
  'solar': { label: 'solar', emoji: '☀️' },
  'insulation': { label: 'insulation', emoji: '🧱' },
  'water-systems': { label: 'water systems', emoji: '💧' },
  'flooring': { label: 'flooring', emoji: '🪵' },
  'cabinetry': { label: 'cabinetry', emoji: '🗄️' },
  'windows-ventilation': { label: 'windows & ventilation', emoji: '🪟' },
  'other': { label: 'other', emoji: '📦' },
};

type ActiveRequest = {
  _id: string;
  title: string;
  category: string;
  status: string;
  isUrgent: boolean;
};

type BuilderStats = {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  totalOffers: number;
  acceptedOffers: number;
  specialties: string[];
  activeRequests: ActiveRequest[];
};

type UserData = {
  builderBio?: string;
  builderSpecialties?: string[];
};

interface BuilderProfileProps {
  user: UserData | null;
  builderStats: BuilderStats | null | undefined;
  editingBuilder: boolean;
  setEditingBuilder: (editing: boolean) => void;
  editBuilderBio: string;
  setEditBuilderBio: (bio: string) => void;
  editBuilderSpecialties: string[];
  setEditBuilderSpecialties: (fn: (prev: string[]) => string[]) => void;
  savingBuilder: boolean;
  onSave: () => void;
}

export function BuilderProfile({
  user,
  builderStats,
  editingBuilder,
  setEditingBuilder,
  editBuilderBio,
  setEditBuilderBio,
  editBuilderSpecialties,
  setEditBuilderSpecialties,
  savingBuilder,
  onSave,
}: BuilderProfileProps) {
  return (
    <>
      {/* Builder Profile - Help Activity */}
      <View className="px-6 mb-6">
        <View className="bg-gray-50 rounded-3xl p-5">
          {editingBuilder ? (
            <>
              {/* Edit mode */}
              <View className="mb-4">
                <Text
                  className="text-base text-gray-500 mb-2"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  bio
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-2xl px-4 py-3 text-black text-lg"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  value={editBuilderBio}
                  onChangeText={(text) => setEditBuilderBio(text.slice(0, 80))}
                  placeholder="e.g. electrician by trade, happy to help"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={80}
                />
                <Text
                  className="text-gray-400 text-xs mt-1 text-right"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {editBuilderBio.length}/80
                </Text>
              </View>

              <View className="mb-4">
                <Text
                  className="text-base text-gray-500 mb-2"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  specialties
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {Object.entries(helpCategoryLabels).map(([id, info]) => {
                    const selected = editBuilderSpecialties.includes(id);
                    return (
                      <TouchableOpacity
                        key={id}
                        onPress={() => setEditBuilderSpecialties((prev) =>
                          prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
                        )}
                        className={`px-4 py-2.5 rounded-full flex-row items-center border-2 ${
                          selected ? 'bg-white border-orange-primary' : 'bg-white border-transparent'
                        }`}
                      >
                        <Text className="mr-1.5 text-base">{info.emoji}</Text>
                        <Text
                          className={`text-base ${selected ? 'text-orange-primary' : 'text-black'}`}
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {info.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setEditingBuilder(false)}
                  className="flex-1 py-3 rounded-full bg-white items-center"
                >
                  <Text
                    className="text-black text-base"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onSave}
                  disabled={savingBuilder}
                  className="flex-1 py-3 rounded-full bg-orange-primary items-center"
                  style={{ opacity: savingBuilder ? 0.5 : 1 }}
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {savingBuilder ? 'saving...' : 'save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* View mode */}
              <TouchableOpacity
                onPress={() => {
                  setEditBuilderBio(user?.builderBio || '');
                  setEditBuilderSpecialties(() => user?.builderSpecialties || []);
                  setEditingBuilder(true);
                }}
                className="absolute top-4 right-4 z-10"
                accessibilityRole="button"
                accessibilityLabel="Edit builder profile"
              >
                <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Bio */}
              <Text
                className="text-base text-gray-500 mb-2"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                about
              </Text>
              {user?.builderBio ? (
                <View className="mb-5">
                  <Text
                    className="text-black text-lg"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {user.builderBio}
                  </Text>
                </View>
              ) : (
                <View className="mb-5" />
              )}

              {/* Specialties */}
              {builderStats && builderStats.specialties.length > 0 ? (
                <View className="mb-5">
                  <Text
                    className="text-base text-gray-500 mb-2"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    specialties
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {builderStats.specialties.map((cat) => {
                      const info = helpCategoryLabels[cat];
                      return (
                        <View key={cat} className="bg-white px-4 py-2.5 rounded-full flex-row items-center">
                          {info && <Text className="mr-1.5 text-base">{info.emoji}</Text>}
                          <Text
                            className="text-black text-base"
                            style={{ fontFamily: 'InstrumentSans_500Medium' }}
                          >
                            {info?.label || cat}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

            </>
          )}
        </View>

        {/* Stats bento */}
        {builderStats && (
          <View className="bg-gray-50 rounded-3xl p-5 mt-3">
            <View className="flex-row mb-5">
              <View className="flex-1 items-center py-3 bg-white rounded-2xl mr-2">
                <Text
                  className="text-2xl text-black"
                  style={{ fontFamily: 'InstrumentSans_700Bold' }}
                >
                  {builderStats.completedRequests}
                </Text>
                <Text
                  className="text-sm text-gray-500 mt-1"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  completed
                </Text>
              </View>
              <View className="flex-1 items-center py-3 bg-white rounded-2xl">
                <Text
                  className="text-2xl text-black"
                  style={{ fontFamily: 'InstrumentSans_700Bold' }}
                >
                  {builderStats.totalRequests}
                </Text>
                <Text
                  className="text-sm text-gray-500 mt-1"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  requests
                </Text>
              </View>
            </View>

            {/* Current help requests */}
            {builderStats.activeRequests.length > 0 && (
              <View>
                <Text
                  className="text-base text-gray-500 mb-2"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  current requests
                </Text>
                {builderStats.activeRequests.map((req) => {
                  const catInfo = helpCategoryLabels[req.category];
                  return (
                    <View
                      key={req._id}
                      className="bg-white rounded-2xl p-3 mb-2 flex-row items-center"
                    >
                      <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                        <Text>{catInfo?.emoji || '📦'}</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-black text-base"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                          numberOfLines={1}
                        >
                          {req.title}
                        </Text>
                        <Text
                          className="text-gray-400 text-sm"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          {req.status === 'open' ? 'open' : 'in progress'}
                        </Text>
                      </View>
                      {req.isUrgent && (
                        <Ionicons name="warning" size={18} color="#DC2626" />
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Empty state */}
            {builderStats.activeRequests.length === 0 && builderStats.totalRequests === 0 && (
              <View className="items-center py-4">
                <Ionicons name="hammer-outline" size={32} color="#D1D5DB" />
                <Text
                  className="text-gray-400 text-base mt-2 text-center"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  no help activity yet
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </>
  );
}
