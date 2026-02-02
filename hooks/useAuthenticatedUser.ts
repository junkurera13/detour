import { useAuth } from '@clerk/clerk-expo';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useAuthenticatedUser() {
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const { isAuthenticated: convexAuthenticated, isLoading: convexLoading } = useConvexAuth();

  // Get Convex user data - only query when authenticated
  const convexUser = useQuery(
    api.users.getCurrentUser,
    convexAuthenticated ? {} : "skip"
  );

  const isLoading = !clerkLoaded || convexLoading || (convexAuthenticated && convexUser === undefined);

  return {
    isSignedIn: isSignedIn ?? false,
    isLoading,
    clerkLoaded,
    convexAuthenticated,
    convexUser,
    needsOnboarding: isSignedIn && convexAuthenticated && convexUser === null,
    hasCompletedOnboarding: convexUser !== null && convexUser !== undefined,
    userStatus: convexUser?.userStatus ?? null,
  };
}
