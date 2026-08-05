import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry if it's a 404 or unauthorized
        if (error?.status === 404 || error?.status === 403) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
    },
  },
});
