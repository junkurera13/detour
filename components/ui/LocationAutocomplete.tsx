import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { env } from '@/lib/env';

interface LocationResult {
  id: string;
  name: string;
  fullName: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onSelect: (location: LocationResult) => void;
  placeholder?: string;
}

export function LocationAutocomplete({
  value,
  onSelect,
  placeholder = 'Search for a city...',
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Sync with external value changes (e.g., from "use current location")
  useEffect(() => {
    if (value !== query && value) {
      setQuery(value);
      setResults([]);
      setShowResults(false);
    }
  }, [value]);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const token = env.mapboxToken;
    if (!token) {
      console.warn('Mapbox token not configured');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${token}&types=place,locality,neighborhood&limit=5`
      );

      const data = await response.json();

      if (data.features) {
        const locations: LocationResult[] = data.features.map((feature: any) => ({
          id: feature.id,
          name: feature.text,
          fullName: feature.place_name,
          coordinates: feature.center
            ? {
                longitude: feature.center[0],
                latitude: feature.center[1],
              }
            : undefined,
        }));
        setResults(locations);
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query !== value) {
        searchLocations(query);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, value, searchLocations]);

  const handleSelect = (location: LocationResult) => {
    setQuery(location.fullName);
    setShowResults(false);
    setResults([]);
    Keyboard.dismiss();
    onSelect(location);
  };

  return (
    <View className="w-full">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F9FAFB',
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            fontSize: 16,
            color: '#000',
            fontFamily: 'InstrumentSans_400Regular',
            padding: 0,
            letterSpacing: 0,
          }}
        />
        {isLoading && <ActivityIndicator size="small" color="#9CA3AF" />}
        {query.length > 0 && !isLoading && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {showResults && results.length > 0 && (
        <View
          style={{
            marginTop: 8,
            backgroundColor: '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            overflow: 'hidden',
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: index < results.length - 1 ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <Ionicons name="location" size={18} color="#fd6b03" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      color: '#000',
                      fontFamily: 'InstrumentSans_500Medium',
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: '#6B7280',
                      fontFamily: 'InstrumentSans_400Regular',
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {item.fullName}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}
