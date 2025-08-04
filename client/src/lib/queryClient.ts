import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Default fetcher for React Query
export const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const url = queryKey[0] as string;
  const token = localStorage.getItem("auth_token");
  
  const response = await fetch(url, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  
  if (!response.ok) {
    // Don't throw error for auth endpoints to allow graceful handling
    if (response.status === 401 && url.includes('/api/users/me')) {
      return null;
    }
    throw new Error(`Request failed: ${response.statusText}`);
  }
  
  return response.json();
};

// API request helper for mutations
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("auth_token");
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
};

// Set default query function
queryClient.setQueryDefaults([], {
  queryFn: defaultQueryFn,
});