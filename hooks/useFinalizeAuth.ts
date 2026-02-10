import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOnboarding } from '@/context/OnboardingContext';

type FinalizeAuthResult =
  | { ok: true }
  | { ok: false; error: unknown };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isAuthSyncError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Not authenticated') ||
    message.includes('token not ready') ||
    message.includes('No auth provider')
  );
}

export function useFinalizeAuth() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const { getToken } = useAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreateByToken);

  return useCallback(async (): Promise<FinalizeAuthResult> => {
    const maxRetries = 6;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const convexToken = await getToken({ template: 'convex' });

        if (!convexToken) {
          throw new Error('Convex token not ready');
        }

        const result = await getOrCreateUser({});

        if (result.isNew || !result.user) {
          router.replace('/onboarding/name');
          return { ok: true };
        }

        const user = result.user;
        updateData({
          name: user.name,
          username: user.username,
          hasCompletedOnboarding: true,
          userStatus: user.userStatus as 'none' | 'pending' | 'approved',
        });

        if (user.userStatus === 'approved') {
          router.replace('/(tabs)');
        } else {
          router.replace('/pending');
        }

        return { ok: true };
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delayMs = isAuthSyncError(error) ? 400 * attempt : 900 * attempt;
          await sleep(delayMs);
        }
      }
    }

    return { ok: false, error: lastError };
  }, [getOrCreateUser, getToken, router, updateData]);
}
