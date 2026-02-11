import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthenticatedUser } from './useAuthenticatedUser';

export function useLocationSync() {
  const { convexUser } = useAuthenticatedUser();
  const updateUser = useMutation(api.users.update);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!convexUser || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const position = await Location.getCurrentPositionAsync({});
        const [address] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (!address) return;

        const newLocation = [address.city, address.country]
          .filter(Boolean)
          .join(', ')
          .toLowerCase();

        if (!newLocation) return;

        const currentLocation = convexUser.currentLocation?.toLowerCase().trim() ?? '';
        if (newLocation === currentLocation) return;

        await updateUser({
          currentLocation: newLocation,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (error) {
        // Silent fail — location sync is best-effort
      }
    })();
  }, [convexUser]);
}
