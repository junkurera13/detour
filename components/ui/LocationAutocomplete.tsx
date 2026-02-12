import { useState, useEffect, useCallback, useRef } from 'react';
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

export interface LocationResult {
  id: string;
  name: string;
  fullName: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  category?: string; // POI category from Mapbox Search Box API
}

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
}

// Mapbox Search Box API types
interface SearchBoxSuggestion {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
  feature_type: string;
  poi_category?: string[];
}

interface LocationAutocompleteProps {
  value: string;
  onSelect: (location: LocationResult) => void;
  placeholder?: string;
  enablePOI?: boolean; // When true, uses Mapbox Search Box API for POI search
}

function generateSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function LocationAutocomplete({
  value,
  onSelect,
  placeholder,
  enablePOI = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const sessionTokenRef = useRef(generateSessionToken());

  const defaultPlaceholder = enablePOI ? 'search city, campsite, or spot...' : 'Search for a city...';

  // Sync with external value changes (e.g., from "use current location")
  useEffect(() => {
    if (value !== query && value) {
      setQuery(value);
      setResults([]);
      setShowResults(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Search Box API (POI mode) — two-step: suggest then retrieve on select
  const searchPOI = useCallback(async (searchQuery: string) => {
    const token = env.mapboxToken;
    if (!token) return;

    setIsLoading(true);
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
        searchQuery
      )}&access_token=${token}&session_token=${sessionTokenRef.current}&types=poi,place&limit=8&language=en`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.suggestions) {
        const locations: LocationResult[] = data.suggestions.map((s: SearchBoxSuggestion) => ({
          id: s.mapbox_id,
          name: s.name,
          fullName: s.full_address || s.place_formatted || s.name,
          category: s.poi_category?.[0],
        }));
        setResults(locations);
      }
    } catch (error) {
      console.error('POI search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Geocoding v5 (city mode) — single-step
  const searchCities = useCallback(async (searchQuery: string) => {
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
        const locations: LocationResult[] = data.features.map((feature: MapboxFeature) => ({
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

  const searchLocations = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      if (enablePOI) {
        await searchPOI(searchQuery);
      } else {
        await searchCities(searchQuery);
      }
    },
    [enablePOI, searchPOI, searchCities]
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query !== value) {
        searchLocations(query);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, value, searchLocations]);

  // For POI mode, retrieve full details (coordinates) on select
  const retrievePOIDetails = async (mapboxId: string): Promise<LocationResult | null> => {
    const token = env.mapboxToken;
    if (!token) return null;

    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${token}&session_token=${sessionTokenRef.current}`;
      const response = await fetch(url);
      const data = await response.json();

      const feature = data.features?.[0];
      if (!feature) return null;

      // Reset session token after retrieval (Search Box API billing)
      sessionTokenRef.current = generateSessionToken();

      return {
        id: mapboxId,
        name: feature.properties?.name || '',
        fullName: feature.properties?.full_address || feature.properties?.place_formatted || feature.properties?.name || '',
        coordinates: feature.geometry?.coordinates
          ? {
              longitude: feature.geometry.coordinates[0],
              latitude: feature.geometry.coordinates[1],
            }
          : undefined,
        category: feature.properties?.poi_category?.[0],
      };
    } catch (error) {
      console.error('POI retrieve error:', error);
      return null;
    }
  };

  const handleSelect = async (location: LocationResult) => {
    setShowResults(false);
    setResults([]);
    Keyboard.dismiss();

    if (enablePOI && !location.coordinates) {
      // Need to retrieve full details for POI results
      setIsLoading(true);
      const details = await retrievePOIDetails(location.id);
      setIsLoading(false);

      if (details) {
        setQuery(details.fullName);
        onSelect(details);
      } else {
        // Fallback: use what we have
        setQuery(location.fullName);
        onSelect(location);
      }
    } else {
      setQuery(location.fullName);
      onSelect(location);
    }
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
          placeholder={placeholder || defaultPlaceholder}
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
                <Ionicons
                  name={item.category ? 'pin' : 'location'}
                  size={18}
                  color="#fd6b03"
                  style={{ marginRight: 12 }}
                />
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
                    {item.category ? `${item.category} · ${item.fullName}` : item.fullName}
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
