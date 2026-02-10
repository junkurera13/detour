import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { Input } from '@/components/ui/Input';
import { SelectionChip } from '@/components/ui/SelectionChip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 24;
const GRID_GAP = 8;
const GRID_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;
const SMALL_TILE_SIZE = (GRID_WIDTH - GRID_GAP * 2) / 3;
const LARGE_TILE_WIDTH = SMALL_TILE_SIZE * 2 + GRID_GAP;
const LARGE_TILE_HEIGHT = SMALL_TILE_SIZE * 2 + GRID_GAP;

const lifestyleOptions = [
  { id: 'van-life', label: 'van life', emoji: '🚐' },
  { id: 'backpacker', label: 'backpacker', emoji: '🎒' },
  { id: 'digital-nomad', label: 'digital nomad', emoji: '💻' },
  { id: 'rv-life', label: 'rv life', emoji: '🏕️' },
  { id: 'boat-life', label: 'boat life', emoji: '⛵' },
  { id: 'house-sitting', label: 'house sitting', emoji: '🏠' },
  { id: 'slow-travel', label: 'slow travel', emoji: '🐢' },
  { id: 'perpetual-traveler', label: 'perpetual traveler', emoji: '✈️' },
  { id: 'seasonal-worker', label: 'seasonal worker', emoji: '🌾' },
  { id: 'expat', label: 'expat', emoji: '🌍' },
  { id: 'hostel-hopper', label: 'hostel hopper', emoji: '🛏️' },
  { id: 'workaway', label: 'workaway/volunteer', emoji: '🤝' },
];

const interestCategories = [
  {
    category: 'eat & drink',
    options: [
      { id: 'grab-coffee', label: 'grab coffee' },
      { id: 'try-street-food', label: 'try street food' },
      { id: 'cook-together', label: 'cook together' },
      { id: 'hit-night-markets', label: 'hit night markets' },
      { id: 'go-wine-tasting', label: 'go wine tasting' },
      { id: 'try-local-beer', label: 'try local beer' },
      { id: 'brunch-dates', label: 'brunch dates' },
      { id: 'find-hidden-gems', label: 'find hidden gems' },
    ],
  },
  {
    category: 'get outside',
    options: [
      { id: 'go-hiking', label: 'go hiking' },
      { id: 'go-surfing', label: 'go surfing' },
      { id: 'go-diving', label: 'go diving' },
      { id: 'go-camping', label: 'go camping' },
      { id: 'go-climbing', label: 'go climbing' },
      { id: 'go-cycling', label: 'go cycling' },
      { id: 'beach-days', label: 'beach days' },
      { id: 'go-skating', label: 'go skating' },
      { id: 'go-skiing', label: 'go skiing' },
      { id: 'explore-the-city', label: 'explore the city' },
      { id: 'road-trips', label: 'road trips' },
    ],
  },
  {
    category: 'play sports',
    options: [
      { id: 'play-pickleball', label: 'play pickleball' },
      { id: 'play-padel', label: 'play padel' },
      { id: 'play-soccer', label: 'play soccer' },
      { id: 'play-basketball', label: 'play basketball' },
      { id: 'play-tennis', label: 'play tennis' },
      { id: 'play-volleyball', label: 'play volleyball' },
      { id: 'play-golf', label: 'play golf' },
    ],
  },
  {
    category: 'go out',
    options: [
      { id: 'grab-drinks', label: 'grab drinks' },
      { id: 'go-dancing', label: 'go dancing' },
      { id: 'see-live-music', label: 'see live music' },
      { id: 'go-clubbing', label: 'go clubbing' },
      { id: 'do-karaoke', label: 'do karaoke' },
      { id: 'see-comedy', label: 'see comedy' },
      { id: 'go-to-festivals', label: 'go to festivals' },
    ],
  },
  {
    category: 'stay active',
    options: [
      { id: 'hit-the-gym', label: 'hit the gym' },
      { id: 'do-yoga', label: 'do yoga' },
      { id: 'go-running', label: 'go running' },
      { id: 'do-crossfit', label: 'do crossfit' },
      { id: 'try-muay-thai', label: 'try muay thai' },
      { id: 'morning-stretches', label: 'morning stretches' },
    ],
  },
  {
    category: 'explore & learn',
    options: [
      { id: 'visit-museums', label: 'visit museums' },
      { id: 'take-photos', label: 'take photos' },
      { id: 'find-street-art', label: 'find street art' },
      { id: 'watch-films', label: 'watch films' },
      { id: 'learn-languages', label: 'learn languages' },
      { id: 'take-a-class', label: 'take a class' },
      { id: 'browse-markets', label: 'browse markets' },
    ],
  },
  {
    category: 'cowork & create',
    options: [
      { id: 'cowork-at-cafes', label: 'cowork at cafes' },
      { id: 'brainstorm-ideas', label: 'brainstorm ideas' },
      { id: 'make-content', label: 'make content' },
      { id: 'build-stuff', label: 'build stuff' },
    ],
  },
  {
    category: 'take it easy',
    options: [
      { id: 'watch-sunsets', label: 'watch sunsets' },
      { id: 'read-together', label: 'read together' },
      { id: 'play-board-games', label: 'play board games' },
      { id: 'chill-at-the-beach', label: 'chill at the beach' },
      { id: 'meditate', label: 'meditate' },
      { id: 'spa-days', label: 'spa days' },
    ],
  },
];

type Section = 'basic' | 'lifestyle' | 'interests' | 'builder';

interface Pet {
  type: string;
  name: string;
}

const petTypeOptions = [
  { id: 'dog', label: 'dog', emoji: '🐕' },
  { id: 'cat', label: 'cat', emoji: '🐈' },
  { id: 'bird', label: 'bird', emoji: '🐦' },
  { id: 'rabbit', label: 'rabbit', emoji: '🐰' },
  { id: 'fish', label: 'fish', emoji: '🐟' },
  { id: 'reptile', label: 'reptile', emoji: '🦎' },
  { id: 'other', label: 'other', emoji: '🐾' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { convexUser: user } = useAuthenticatedUser();
  const updateUser = useMutation(api.users.update);
  const { uploadPhotos, isUploading, progress } = usePhotoUpload();

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [instagram, setInstagram] = useState('');
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [addingPet, setAddingPet] = useState(false);
  const [newPetType, setNewPetType] = useState('');
  const [newPetName, setNewPetName] = useState('');
  const [builderBio, setBuilderBio] = useState('');
  const [builderSpecialties, setBuilderSpecialties] = useState<string[]>([]);

  // UI state
  const [activeSection, setActiveSection] = useState<Section>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Username validation
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const checkUsernameAvailable = useQuery(
    api.users.checkUsernameAvailable,
    username && username !== user?.username ? { username } : 'skip'
  );

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setInstagram(user.instagram || '');
      setLifestyle(user.lifestyle || []);
      setInterests(user.interests || []);
      setPhotos(user.photos || []);
      setPets(user.pets || []);
      setBuilderBio(user.builderBio || '');
      setBuilderSpecialties(user.builderSpecialties || []);
    }
  }, [user]);

  // Check for changes
  useEffect(() => {
    if (!user) return;
    const changed =
      name !== user.name ||
      username !== user.username ||
      instagram !== (user.instagram || '') ||
      JSON.stringify(lifestyle) !== JSON.stringify(user.lifestyle) ||
      JSON.stringify(interests) !== JSON.stringify(user.interests) ||
      JSON.stringify(photos) !== JSON.stringify(user.photos) ||
      JSON.stringify(pets) !== JSON.stringify(user.pets || []) ||
      builderBio !== (user.builderBio || '') ||
      JSON.stringify(builderSpecialties) !== JSON.stringify(user.builderSpecialties || []);
    setHasChanges(changed);
  }, [name, username, instagram, lifestyle, interests, photos, pets, builderBio, builderSpecialties, user]);

  // Username validation
  useEffect(() => {
    if (!username || username === user?.username) {
      setUsernameError(null);
      return;
    }
    if (username.length < 3) {
      setUsernameError('username must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setUsernameError('only lowercase letters, numbers, and underscores');
      return;
    }
    if (checkUsernameAvailable === false) {
      setUsernameError('username is taken');
    } else {
      setUsernameError(null);
    }
  }, [username, checkUsernameAvailable, user?.username]);

  const pickImage = async (index: number) => {
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
      const newPhotos = [...photos];
      if (index < photos.length) {
        newPhotos[index] = result.assets[0].uri;
      } else {
        newPhotos.push(result.assets[0].uri);
      }
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    if (photos.length <= 1) {
      Alert.alert('cannot remove', 'you need at least one photo.');
      return;
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleLifestyle = (id: string) => {
    setLifestyle((prev) => {
      if (prev.includes(id)) {
        return prev.filter((l) => l !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const toggleBuilderSpecialty = (id: string) => {
    setBuilderSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 15) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (!user || !hasChanges) return;

    // Validation
    if (!name.trim()) {
      Alert.alert('error', 'name is required');
      return;
    }
    if (usernameError) {
      Alert.alert('error', usernameError);
      return;
    }
    if (photos.length < 1) {
      Alert.alert('error', 'at least one photo is required');
      return;
    }
    if (lifestyle.length < 1) {
      Alert.alert('error', 'select at least one lifestyle');
      return;
    }
    if (interests.length < 5) {
      Alert.alert('error', 'select at least 5 interests');
      return;
    }

    setIsSaving(true);

    try {
      // Upload any new local photos
      const uploadedPhotos = await uploadPhotos(photos);

      const args: Record<string, unknown> = {
        id: user._id,
        name: name.trim(),
        username: username.trim(),
        lifestyle,
        interests,
        photos: uploadedPhotos,
      };
      if (instagram.trim()) args.instagram = instagram.trim();
      args.pets = pets.length > 0 ? pets : [];
      if (builderBio.trim()) args.builderBio = builderBio.trim();
      if (builderSpecialties.length > 0) args.builderSpecialties = builderSpecialties;
      await updateUser(args as any);

      router.back();
    } catch {
      Alert.alert('error', 'failed to save changes. please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('discard changes?', 'you have unsaved changes.', [
        { text: 'keep editing', style: 'cancel' },
        { text: 'discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const renderPhotoSlot = (index: number, isLarge: boolean = false) => {
    const photo = photos[index];
    const size = isLarge
      ? { width: LARGE_TILE_WIDTH, height: LARGE_TILE_HEIGHT }
      : { width: SMALL_TILE_SIZE, height: SMALL_TILE_SIZE };

    return (
      <TouchableOpacity
        key={index}
        onPress={() => pickImage(index)}
        onLongPress={() => photo && removePhoto(index)}
        style={[
          size,
          {
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: photo ? 'transparent' : '#F3F4F6',
            borderWidth: photo ? 0 : 2,
            borderStyle: 'dashed',
            borderColor: '#D1D5DB',
          },
        ]}
        activeOpacity={0.7}
      >
        {photo ? (
          <View style={{ flex: 1 }}>
            <Image
              source={{ uri: photo }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => removePhoto(index)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 12,
                padding: 4,
              }}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
            {isLarge && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    fontFamily: 'InstrumentSans_500Medium',
                  }}
                >
                  main photo
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={isLarge ? 40 : 28} color="#9CA3AF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const sections: { id: Section; label: string }[] = [
    { id: 'basic', label: 'about' },
    { id: 'lifestyle', label: 'lifestyle' },
    { id: 'interests', label: 'interests' },
    { id: 'builder', label: 'builder' },
  ];

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#fd6b03" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
          <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text
            className="text-lg text-black"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            edit profile
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || isSaving || isUploading}
            className="p-2 -mr-2"
          >
            {isSaving || isUploading ? (
              <ActivityIndicator size="small" color="#fd6b03" />
            ) : (
              <Text
                style={{
                  fontFamily: 'InstrumentSans_600SemiBold',
                  fontSize: 16,
                  color: hasChanges ? '#fd6b03' : '#9CA3AF',
                }}
              >
                save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section tabs */}
        <View className="px-6 py-3 border-b border-gray-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  onPress={() => setActiveSection(section.id)}
                  className={`px-4 py-2 rounded-full ${
                    activeSection === section.id ? 'bg-orange-primary' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    style={{
                      fontFamily: 'InstrumentSans_500Medium',
                      color: activeSection === section.id ? '#fff' : '#374151',
                    }}
                  >
                    {section.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {activeSection === 'basic' && (
            <View className="px-6 pt-6 gap-5">
              <Input
                label="name"
                value={name}
                onChangeText={setName}
                placeholder="your name"
                autoCapitalize="words"
              />
              <View>
                <Input
                  label="username"
                  value={username}
                  onChangeText={(text) => setUsername(text.toLowerCase())}
                  placeholder="username"
                  autoCapitalize="none"
                  prefix="@"
                />
                {usernameError && (
                  <Text
                    className="text-red-500 text-sm mt-1"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {usernameError}
                  </Text>
                )}
              </View>
              <Input
                label="instagram"
                value={instagram}
                onChangeText={(text) => setInstagram(text.replace('@', ''))}
                placeholder="username (optional)"
                autoCapitalize="none"
                prefix="@"
              />
              <View>
                <Text
                  className="text-sm text-black mb-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  photos
                </Text>
                {/* Row 1: Large photo + 2 small stacked */}
                <View style={{ flexDirection: 'row', gap: GRID_GAP }}>
                  {renderPhotoSlot(0, true)}
                  <View style={{ gap: GRID_GAP }}>
                    {renderPhotoSlot(1)}
                    {renderPhotoSlot(2)}
                  </View>
                </View>
                {/* Row 2: 3 small photos */}
                <View style={{ flexDirection: 'row', gap: GRID_GAP, marginTop: GRID_GAP }}>
                  {renderPhotoSlot(3)}
                  {renderPhotoSlot(4)}
                  {renderPhotoSlot(5)}
                </View>
              </View>

              {/* Pets */}
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
                        onPress={() => setPets((prev) => prev.filter((_, i) => i !== index))}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                      what's their name?
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
                          setPets((prev) => [...prev, { type: newPetType, name: newPetName.trim() }]);
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
            </View>
          )}

          {activeSection === 'lifestyle' && (
            <View className="px-6 pt-6">
              <Text
                className="text-gray-500 mb-4"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                select up to 3 ({lifestyle.length}/3)
              </Text>
              <View className="flex-row flex-wrap">
                {lifestyleOptions.map((option) => (
                  <SelectionChip
                    key={option.id}
                    label={option.label}
                    emoji={option.emoji}
                    selected={lifestyle.includes(option.id)}
                    onPress={() => toggleLifestyle(option.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {activeSection === 'interests' && (
            <View className="px-6 pt-6">
              <Text
                className="text-gray-500 mb-4"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                select 5-15 interests ({interests.length}/15)
              </Text>
              {interestCategories.map((category) => (
                <View key={category.category} className="mb-6">
                  <Text
                    className="text-base text-gray-500 mb-3"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {category.category}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {category.options.map((option) => (
                      <SelectionChip
                        key={option.id}
                        label={option.label}
                        selected={interests.includes(option.id)}
                        onPress={() => toggleInterest(option.id)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeSection === 'builder' && (
            <View className="px-6 pt-6 gap-5">
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                your builder profile helps others trust you when you offer help
              </Text>
              <View>
                <Input
                  label="bio"
                  value={builderBio}
                  onChangeText={(text) => setBuilderBio(text.slice(0, 80))}
                  placeholder="e.g. electrician by trade, happy to help"
                  multiline
                />
                <Text
                  className="text-gray-400 text-xs mt-1 text-right"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {builderBio.length}/80
                </Text>
              </View>
              <View>
                <Text
                  className="text-sm text-black mb-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  specialties
                </Text>
                <View className="flex-row flex-wrap">
                  {[
                    { id: 'repairs', label: 'repairs', emoji: '🔧' },
                    { id: 'electrical', label: 'electrical', emoji: '⚡' },
                    { id: 'build', label: 'build', emoji: '🪚' },
                    { id: 'plumbing', label: 'plumbing', emoji: '🚿' },
                    { id: 'solar', label: 'solar', emoji: '☀️' },
                    { id: 'insulation', label: 'insulation', emoji: '🧱' },
                    { id: 'water-systems', label: 'water systems', emoji: '💧' },
                    { id: 'flooring', label: 'flooring', emoji: '🪵' },
                    { id: 'cabinetry', label: 'cabinetry', emoji: '🗄️' },
                    { id: 'windows-ventilation', label: 'windows & ventilation', emoji: '🪟' },
                    { id: 'other', label: 'other', emoji: '📦' },
                  ].map((option) => (
                    <SelectionChip
                      key={option.id}
                      label={option.label}
                      emoji={option.emoji}
                      selected={builderSpecialties.includes(option.id)}
                      onPress={() => toggleBuilderSpecialty(option.id)}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Upload progress modal */}
      <Modal visible={isUploading} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-2xl p-6 mx-6 w-72">
            <Text
              className="text-lg text-center mb-4"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              uploading photos...
            </Text>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-orange-primary"
                style={{ width: `${progress?.percentage || 0}%` }}
              />
            </View>
            <Text
              className="text-gray-500 text-center mt-2"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              {progress?.current || 0} of {progress?.total || 0}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
