import { useAuthenticatedUser } from './useAuthenticatedUser';

/**
 * @deprecated Use useAuthenticatedUser instead.
 * This hook is kept for backward compatibility.
 */
export function useCurrentUser() {
  const { convexUser, isLoading } = useAuthenticatedUser();

  return {
    userId: convexUser?._id ?? null,
    user: convexUser,
    isLoading,
  };
}
