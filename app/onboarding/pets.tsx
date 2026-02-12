import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { petTypeOptions } from '@/components/edit-profile/PetsManager';

interface PetEntry {
  type: string;
  name: string;
  photo: string;
}

export default function PetsScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [pets, setPets] = useState<PetEntry[]>(data.pets);
  const [addingPet, setAddingPet] = useState(false);
  const [newType, setNewType] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState('');

  const pickPhoto = async (callback: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('permission needed', 'please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      callback(result.assets[0].uri);
    }
  };

  const handleAddPet = () => {
    if (!newType || !newName.trim()) return;
    setPets((prev) => [...prev, { type: newType, name: newName.trim(), photo: newPhoto }]);
    setAddingPet(false);
    setNewType('');
    setNewName('');
    setNewPhoto('');
  };

  const handleRemovePet = (index: number) => {
    setPets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    updateData({ pets });
    router.push('/onboarding/time-nomadic');
  };

  const handleSkip = () => {
    updateData({ pets: [] });
    router.push('/onboarding/time-nomadic');
  };

  return (
    <OnboardingLayout
      title="travelling with anyone?"
      subtitle="add your travel companions (optional)"
      currentStep={9}
      showSkip
      onSkip={handleSkip}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          {/* Existing pets list */}
          {pets.map((pet, index) => {
            const typeInfo = petTypeOptions.find((p) => p.id === pet.type);
            return (
              <View
                key={index}
                className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 mb-3"
              >
                <View className="flex-row items-center">
                  {pet.photo ? (
                    <Image
                      source={{ uri: pet.photo }}
                      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB' }}
                    />
                  ) : (
                    <Text style={{ fontSize: 24 }}>{typeInfo?.emoji || '🐾'}</Text>
                  )}
                  <View className="ml-3">
                    <Text
                      className="text-black text-base"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {pet.name}
                    </Text>
                    <Text
                      className="text-gray-500 text-sm"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {typeInfo?.label || pet.type}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePet(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add pet form */}
          {addingPet ? (
            <View className="bg-gray-50 rounded-2xl p-4 mb-3">
              <Text
                className="text-sm text-gray-500 mb-3"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                what kind of pet?
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {petTypeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setNewType(opt.id)}
                    className="px-3 py-2 rounded-full flex-row items-center"
                    style={{
                      backgroundColor: newType === opt.id ? '#fd6b03' : '#E5E7EB',
                    }}
                  >
                    <Text className="mr-1">{opt.emoji}</Text>
                    <Text
                      style={{
                        fontFamily: 'InstrumentSans_500Medium',
                        color: newType === opt.id ? '#fff' : '#374151',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                className="text-sm text-gray-500 mb-2"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                what&apos;s their name?
              </Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="pet name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                maxLength={30}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-black mb-4"
                style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
              />

              {/* Photo picker */}
              <Text
                className="text-sm text-gray-500 mb-2"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                add a photo (optional)
              </Text>
              <TouchableOpacity
                onPress={() => pickPhoto(setNewPhoto)}
                activeOpacity={0.7}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: newPhoto ? 'transparent' : '#E5E7EB',
                  borderWidth: newPhoto ? 0 : 2,
                  borderStyle: 'dashed',
                  borderColor: '#D1D5DB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  overflow: 'hidden',
                }}
              >
                {newPhoto ? (
                  <Image
                    source={{ uri: newPhoto }}
                    style={{ width: 64, height: 64, borderRadius: 32 }}
                  />
                ) : (
                  <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                )}
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setAddingPet(false);
                    setNewType('');
                    setNewName('');
                    setNewPhoto('');
                  }}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <Text
                    className="text-gray-600"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddPet}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: newType && newName.trim() ? '#fd6b03' : '#FDBA74',
                  }}
                >
                  <Text
                    className="text-white"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : pets.length < 5 ? (
            <TouchableOpacity
              onPress={() => setAddingPet(true)}
              className="flex-row items-center justify-center py-4 rounded-2xl"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#6B7280" />
              <Text
                className="ml-2"
                style={{
                  fontFamily: 'InstrumentSans_500Medium',
                  fontSize: 15,
                  color: '#6B7280',
                }}
              >
                add a pet
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <View className="pt-6 pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
        />
      </View>
    </OnboardingLayout>
  );
}
