import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Pet {
  type: string;
  name: string;
}

export const petTypeOptions = [
  { id: 'dog', label: 'dog', emoji: '🐕' },
  { id: 'cat', label: 'cat', emoji: '🐈' },
  { id: 'bird', label: 'bird', emoji: '🐦' },
  { id: 'rabbit', label: 'rabbit', emoji: '🐰' },
  { id: 'fish', label: 'fish', emoji: '🐟' },
  { id: 'reptile', label: 'reptile', emoji: '🦎' },
  { id: 'other', label: 'other', emoji: '🐾' },
];

interface PetsManagerProps {
  pets: Pet[];
  onAddPet: (pet: Pet) => void;
  onRemovePet: (index: number) => void;
}

export function PetsManager({ pets, onAddPet, onRemovePet }: PetsManagerProps) {
  const [addingPet, setAddingPet] = useState(false);
  const [newPetType, setNewPetType] = useState('');
  const [newPetName, setNewPetName] = useState('');

  return (
    <View>
      <Text
        className="text-sm text-black mb-2"
        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
      >
        pets
      </Text>
      <Text
        className="text-gray-500 mb-4"
        style={{ fontFamily: 'InstrumentSans_400Regular' }}
      >
        add your travel companions
      </Text>

      {pets.map((pet, index) => {
        const typeInfo = petTypeOptions.find((p) => p.id === pet.type);
        return (
          <View
            key={index}
            className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 mb-3"
          >
            <View className="flex-row items-center">
              <Text style={{ fontSize: 24 }}>{typeInfo?.emoji || '🐾'}</Text>
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
              onPress={() => onRemovePet(index)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Remove pet"
            >
              <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        );
      })}

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
                onPress={() => setNewPetType(opt.id)}
                className="px-3 py-2 rounded-full flex-row items-center"
                style={{
                  backgroundColor: newPetType === opt.id ? '#fd6b03' : '#E5E7EB',
                }}
              >
                <Text className="mr-1">{opt.emoji}</Text>
                <Text
                  style={{
                    fontFamily: 'InstrumentSans_500Medium',
                    color: newPetType === opt.id ? '#fff' : '#374151',
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
            value={newPetName}
            onChangeText={setNewPetName}
            placeholder="pet name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            maxLength={30}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-black mb-4"
            style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                setAddingPet(false);
                setNewPetType('');
                setNewPetName('');
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
              onPress={() => {
                if (!newPetType || !newPetName.trim()) return;
                onAddPet({ type: newPetType, name: newPetName.trim() });
                setAddingPet(false);
                setNewPetType('');
                setNewPetName('');
              }}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: newPetType && newPetName.trim() ? '#fd6b03' : '#FDBA74',
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
  );
}
