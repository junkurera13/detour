import { renderHook } from '@testing-library/react-native';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

// Mock @clerk/clerk-expo
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
}));

// Mock convex/react
jest.mock('convex/react', () => ({
  useConvexAuth: jest.fn(),
  useQuery: jest.fn(),
}));

// Mock the generated API module
jest.mock('@/convex/_generated/api', () => ({
  api: {
    users: {
      getCurrentUser: 'users:getCurrentUser',
    },
  },
}));

import { useAuth } from '@clerk/clerk-expo';
import { useConvexAuth, useQuery } from 'convex/react';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseConvexAuth = useConvexAuth as jest.MockedFunction<typeof useConvexAuth>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('useAuthenticatedUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state when clerk is not loaded', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: undefined,
      isLoaded: false,
    } as any);
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useAuthenticatedUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSignedIn).toBe(false);
  });

  it('returns loading state when convex is loading', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as any);
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useAuthenticatedUser());

    expect(result.current.isLoading).toBe(true);
  });

  it('returns user data when fully authenticated', () => {
    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      userStatus: 'approved' as const,
    };

    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as any);
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuthenticatedUser());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.convexUser).toEqual(mockUser);
    expect(result.current.convexAuthenticated).toBe(true);
    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(result.current.needsOnboarding).toBe(false);
    expect(result.current.userStatus).toBe('approved');
  });

  it('returns null user when not signed in', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    } as any);
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useAuthenticatedUser());

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.convexUser).toBeUndefined();
    expect(result.current.hasCompletedOnboarding).toBe(false);
  });

  it('detects user needs onboarding when signed in but no convex user', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as any);
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue(null);

    const { result } = renderHook(() => useAuthenticatedUser());

    expect(result.current.needsOnboarding).toBe(true);
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.userStatus).toBeNull();
  });

  it('returns loading when authenticated but convex user is still undefined', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as any);
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useAuthenticatedUser());

    // convexAuthenticated && convexUser === undefined => isLoading = true
    expect(result.current.isLoading).toBe(true);
  });
});
