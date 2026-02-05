import { View, Text, Alert, ActivityIndicator, TouchableOpacity, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';
import { Button } from '@/components/ui/Button';
import { useOnboarding, TripStop } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function FutureTripScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [stops, setStops] = useState<TripStop[]>(
    data.futureTrips && data.futureTrips.length > 0 ? data.futureTrips : [{ location: '' }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<number | null>(null);
  const { isAuthenticated } = useConvexAuth();

  const createUser = useMutation(api.users.create);

  const updateStop = (index: number, updates: Partial<TripStop>) => {
    setStops((prev) =>
      prev.map((stop, i) => (i === index ? { ...stop, ...updates } : stop))
    );
  };

  const addStop = () => {
    if (stops.length >= 5) return;
    setStops((prev) => [...prev, { location: '' }]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 1) return;
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleFinish = async (tripStops: TripStop[]) => {
    if (isSubmitting) return;

    // Filter out empty stops
    const validStops = tripStops.filter((s) => s.location.trim());

    // Update trips in local state
    updateData({ futureTrips: validStops });

    // Invite users go to paywall (which handles user creation)
    if (data.joinPath === 'invite') {
      router.push('/onboarding/paywall');
      return;
    }

    // Apply users: create account and go to pending
    if (!isAuthenticated) {
      Alert.alert('Error', 'Authentication error. Please restart the app.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create user in Convex with pending status
      await createUser({
        name: data.name,
        username: data.username,
        birthday: data.birthday?.toISOString() ?? new Date().toISOString(),
        gender: data.gender,
        lookingFor: data.lookingFor,
        datingPreference: data.datingPreference.length > 0 ? data.datingPreference : undefined,
        lifestyle: data.lifestyle,
        timeNomadic: data.timeNomadic,
        interests: data.interests,
        photos: data.photos,
        instagram: data.instagram || undefined,
        currentLocation: data.currentLocation,
        futureTrips: validStops.length > 0 ? validStops : undefined,
        joinPath: 'apply',
        userStatus: 'pending',
      });

      // Update local state
      updateData({
        hasCompletedOnboarding: true,
        userStatus: 'pending',
      });

      // Go to pending screen
      router.replace('/pending');
    } catch (error) {
      console.error('Failed to create user:', error);
      Alert.alert(
        'Error',
        'Failed to create your account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    handleFinish(stops);
  };

  const handleSkip = () => {
    handleFinish([]);
  };

  if (isSubmitting) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#fd6b03" />
        <Text
          className="mt-4 text-gray-500"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          creating your profile...
        </Text>
      </View>
    );
  }

  return (
    <>
    <OnboardingLayout
      title="where to next?"
      subtitle="add your upcoming destinations to connect with nomads along your route"
      currentStep={12}
      showSkip
      onSkip={handleSkip}
      scrollable
      footer={
        <Button
          title="finish"
          onPress={handleContinue}
        />
      }
    >
      <View className="pt-6">
        {/* Timeline */}
        <View>
          {stops.map((stop, index) => (
            <View key={index} className="flex-row">
              {/* Timeline indicator */}
              <View className="items-center mr-4" style={{ width: 24 }}>
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: stop.location ? '#fd6b03' : '#E5E7EB' }}
                >
                  <Text
                    style={{
                      fontFamily: 'InstrumentSans_600SemiBold',
                      fontSize: 12,
                      color: stop.location ? '#fff' : '#9CA3AF',
                    }}
                  >
                    {index + 1}
                  </Text>
                </View>
                {index < stops.length - 1 && (
                  <View
                    className="w-0.5 flex-1 my-2"
                    style={{ backgroundColor: '#E5E7EB', minHeight: 80 }}
                  />
                )}
              </View>

              {/* Stop content */}
              <View className="flex-1 pb-4">
                <View
                  className="flex-row items-center justify-between mb-2"
                  style={{ paddingRight: 20 }}
                >
                  <Text
                    style={{
                      fontFamily: 'InstrumentSans_500Medium',
                      fontSize: 14,
                      color: '#6B7280',
                    }}
                  >
                    stop {index + 1}
                  </Text>
                  {stops.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeStop(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                <LocationAutocomplete
                  value={stop.location}
                  onSelect={(loc) => updateStop(index, { location: loc.fullName })}
                  placeholder="search city or region"
                />

                {/* Date picker button */}
                <TouchableOpacity
                  onPress={() => setShowDatePicker(index)}
                  className="flex-row items-center mt-3"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={stop.date ? '#fd6b03' : '#9CA3AF'}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: 'InstrumentSans_400Regular',
                      fontSize: 16,
                      color: stop.date ? '#000' : '#9CA3AF',
                    }}
                  >
                    {formatDate(stop.date) || 'add date (optional)'}
                  </Text>
                  {stop.date && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        updateStop(index, { date: undefined });
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Add stop button */}
        {stops.length < 5 && (
          <TouchableOpacity
            onPress={addStop}
            className="flex-row items-center justify-center py-4 rounded-2xl mt-2"
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
              add another stop
            </Text>
          </TouchableOpacity>
        )}

        {/* Hint */}
        <Text
          className="text-sm text-gray-400 mt-4 text-center"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          you can edit your route anytime from your profile
        </Text>

        {/* Spacer for scroll */}
        <View style={{ height: 100 }} />
      </View>
    </OnboardingLayout>

    {/* Date Picker Modal - iOS */}
    <Modal
      visible={showDatePicker !== null && Platform.OS === 'ios'}
      transparent
      animationType="slide"
    >
      <TouchableOpacity
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}
        activeOpacity={1}
        onPress={() => setShowDatePicker(null)}
      >
        <TouchableOpacity activeOpacity={1}>
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 34,
            }}
          >
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
              <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                <Text style={{ fontFamily: 'InstrumentSans_500Medium', color: '#6B7280' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (showDatePicker !== null && !stops[showDatePicker]?.date) {
                    updateStop(showDatePicker, { date: new Date().toISOString() });
                  }
                  setShowDatePicker(null);
                }}
              >
                <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', color: '#fd6b03' }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            {showDatePicker !== null && (
              <View style={{ height: 200 }}>
                <DateTimePicker
                  value={stops[showDatePicker]?.date ? new Date(stops[showDatePicker].date!) : new Date()}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  style={{ height: 200 }}
                  themeVariant="light"
                  textColor="#000000"
                  onChange={(_, selectedDate) => {
                    if (selectedDate && showDatePicker !== null) {
                      updateStop(showDatePicker, { date: selectedDate.toISOString() });
                    }
                  }}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>

    {/* Date Picker - Android */}
    {showDatePicker !== null && Platform.OS === 'android' && (
      <DateTimePicker
        value={stops[showDatePicker]?.date ? new Date(stops[showDatePicker].date!) : new Date()}
        mode="date"
        display="default"
        minimumDate={new Date()}
        onChange={(event, selectedDate) => {
          setShowDatePicker(null);
          if (event.type === 'set' && selectedDate && showDatePicker !== null) {
            updateStop(showDatePicker, { date: selectedDate.toISOString() });
          }
        }}
      />
    )}
  </>
  );
}
