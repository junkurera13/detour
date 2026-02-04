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
    category: 'food & drink',
    options: [
      { id: 'foodie', label: 'foodie' },
      { id: 'cooking', label: 'cooking' },
      { id: 'baking', label: 'baking' },
      { id: 'coffee-cafes', label: 'coffee & cafes' },
      { id: 'food-markets', label: 'food markets' },
      { id: 'wine-tasting', label: 'wine tasting' },
      { id: 'craft-beer', label: 'craft beer' },
      { id: 'alcohol-free', label: 'alcohol-free' },
      { id: 'vegan', label: 'vegan' },
      { id: 'vegetarian', label: 'vegetarian' },
    ],
  },
  {
    category: 'outdoors & adventure',
    options: [
      { id: 'hiking', label: 'hiking' },
      { id: 'camping', label: 'camping' },
      { id: 'rock-climbing', label: 'rock climbing' },
      { id: 'surfing', label: 'surfing' },
      { id: 'cycling', label: 'cycling' },
      { id: 'mountaineering', label: 'mountaineering' },
      { id: 'diving', label: 'diving' },
      { id: 'beach', label: 'beach' },
      { id: 'snowboarding', label: 'snowboarding' },
      { id: 'skating', label: 'skating' },
      { id: 'skiing', label: 'skiing' },
      { id: 'pickleball', label: 'pickleball' },
      { id: 'padel', label: 'padel' },
      { id: 'soccer', label: 'soccer' },
      { id: 'basketball', label: 'basketball' },
      { id: 'tennis', label: 'tennis' },
      { id: 'golf', label: 'golf' },
      { id: 'park-days', label: 'park days' },
      { id: 'urban-exploring', label: 'urban exploring' },
    ],
  },
  {
    category: 'nightlife & entertainment',
    options: [
      { id: 'nightlife', label: 'nightlife' },
      { id: 'bars-drinks', label: 'bars & drinks' },
      { id: 'clubbing', label: 'clubbing' },
      { id: 'live-music', label: 'live music' },
      { id: 'music', label: 'music' },
      { id: 'karaoke', label: 'karaoke' },
      { id: 'dancing', label: 'dancing' },
      { id: 'comedy-shows', label: 'comedy shows' },
      { id: 'shopping', label: 'shopping' },
      { id: 'gaming', label: 'gaming' },
      { id: 'anime', label: 'anime' },
    ],
  },
  {
    category: 'fitness & wellness',
    options: [
      { id: 'gym-lifting', label: 'gym / lifting' },
      { id: 'yoga', label: 'yoga' },
      { id: 'wellness', label: 'wellness' },
      { id: 'running', label: 'running' },
      { id: 'meditation', label: 'meditation' },
      { id: 'cold-plunge', label: 'cold plunge' },
      { id: 'spa', label: 'spa' },
      { id: 'crossfit', label: 'crossfit' },
    ],
  },
  {
    category: 'arts & culture',
    options: [
      { id: 'museums-galleries', label: 'museums & galleries' },
      { id: 'photography', label: 'photography' },
      { id: 'street-art', label: 'street art' },
      { id: 'local-history', label: 'local history' },
      { id: 'film-cinema', label: 'film / cinema' },
      { id: 'theatre', label: 'theatre' },
      { id: 'local-markets', label: 'local markets' },
      { id: 'history', label: 'history' },
      { id: 'architecture', label: 'architecture' },
      { id: 'language-exchange', label: 'language exchange' },
    ],
  },
  {
    category: 'work & lifestyle',
    options: [
      { id: 'entrepreneur', label: 'entrepreneur' },
      { id: 'content-creator', label: 'content creator' },
      { id: 'freelancer', label: 'freelancer' },
      { id: 'cafe-working', label: 'cafe working' },
      { id: 'productivity-nerd', label: 'productivity nerd' },
    ],
  },
  {
    category: 'music & festivals',
    options: [
      { id: 'festivals', label: 'festivals' },
      { id: 'live-concerts', label: 'live concerts' },
      { id: 'making-music', label: 'making music' },
      { id: 'djing', label: 'DJing' },
      { id: 'jam-sessions', label: 'jam sessions' },
    ],
  },
  {
    category: 'chill & slow living',
    options: [
      { id: 'reading', label: 'reading' },
      { id: 'journaling', label: 'journaling' },
      { id: 'podcasts', label: 'podcasts' },
      { id: 'sunsets', label: 'sunsets' },
      { id: 'board-games', label: 'board games' },
      { id: 'solo-exploring', label: 'solo exploring' },
    ],
  },
];

type Section = 'basic' | 'photos' | 'lifestyle' | 'interests';

export default function EditProfileScreen() {
  const router = useRouter();
  const { convexUser: user } = useAuthenticatedUser();
  const updateUser = useMutation(api.users.update);
  const { uploadPhotos, isUploading, progress } = usePhotoUpload();

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [instagram, setInstagram] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [futureTrip, setFutureTrip] = useState('');
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

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
      setCurrentLocation(user.currentLocation || '');
      setFutureTrip(user.futureTrip || '');
      setLifestyle(user.lifestyle || []);
      setInterests(user.interests || []);
      setPhotos(user.photos || []);
    }
  }, [user]);

  // Check for changes
  useEffect(() => {
    if (!user) return;
    const changed =
      name !== user.name ||
      username !== user.username ||
      instagram !== (user.instagram || '') ||
      currentLocation !== user.currentLocation ||
      futureTrip !== (user.futureTrip || '') ||
      JSON.stringify(lifestyle) !== JSON.stringify(user.lifestyle) ||
      JSON.stringify(interests) !== JSON.stringify(user.interests) ||
      JSON.stringify(photos) !== JSON.stringify(user.photos);
    setHasChanges(changed);
  }, [name, username, instagram, currentLocation, futureTrip, lifestyle, interests, photos, user]);

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

  const toggleInterest = (id: string) => {
    setInterests((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 10) return prev;
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

      await updateUser({
        id: user._id,
        name: name.trim(),
        username: username.trim(),
        instagram: instagram.trim() || undefined,
        currentLocation: currentLocation.trim(),
        futureTrip: futureTrip.trim() || undefined,
        lifestyle,
        interests,
        photos: uploadedPhotos,
      });

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
    { id: 'basic', label: 'basic info' },
    { id: 'photos', label: 'photos' },
    { id: 'lifestyle', label: 'lifestyle' },
    { id: 'interests', label: 'interests' },
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
              <Input
                label="current location"
                value={currentLocation}
                onChangeText={setCurrentLocation}
                placeholder="where are you now?"
              />
              <Input
                label="next destination"
                value={futureTrip}
                onChangeText={setFutureTrip}
                placeholder="where are you heading? (optional)"
              />
            </View>
          )}

          {activeSection === 'photos' && (
            <View className="px-6 pt-6">
              <Text
                className="text-gray-500 mb-4"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                tap to add, hold to remove. ({photos.length}/6)
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
                select 5-10 interests ({interests.length}/10)
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
