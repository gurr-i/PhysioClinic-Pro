import { QueryClient, QueryFunction, MutationCache, QueryCache } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Enhanced error types
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

// Enhanced error handling with better user feedback
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData;
    let errorMessage = res.statusText;

    try {
      const text = await res.text();
      if (text) {
        try {
          errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // If we can't read the response, use status text
    }

    throw new ApiError(res.status, res.statusText, errorMessage, errorData);
  }
}

// Enhanced API request with timeout and retry logic
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<Response> {
  const { timeout = 30000, retries = 0, retryDelay = 1000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      await throwIfResNotOk(res);
      return res;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }

      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        // Don't retry client errors (4xx)
        throw error;
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }

      // If it's a network error, wrap it
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Unable to connect to server');
      }

      throw error;
    }
  }

  throw lastError!;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }

      throw error;
    }
  };

// Enhanced retry logic
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  // Don't retry client errors (4xx)
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }

  // Retry network errors and server errors up to 3 times
  return failureCount < 3;
};

// Global error handling
const queryCache = new QueryCache({
  onError: (error, query) => {
    console.error('Query error:', error, query.queryKey);

    if (error instanceof NetworkError) {
      toast({
        title: "Connection Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
    } else if (error instanceof ApiError) {
      if (error.status >= 500) {
        toast({
          title: "Server Error",
          description: "Something went wrong on our end. Please try again later.",
          variant: "destructive",
        });
      }
    }
  },
});

const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {
    console.error('Mutation error:', error, mutation.options.mutationKey);

    if (error instanceof NetworkError) {
      toast({
        title: "Connection Error",
        description: "Unable to save changes. Please check your connection.",
        variant: "destructive",
      });
    } else if (error instanceof ApiError) {
      if (error.status >= 500) {
        toast({
          title: "Save Failed",
          description: "Unable to save changes. Please try again.",
          variant: "destructive",
        });
      }
    }
  },
});

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
