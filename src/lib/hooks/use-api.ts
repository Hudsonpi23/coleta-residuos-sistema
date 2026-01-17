"use client";

import { useState, useCallback } from "react";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UseApiOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useApi<T>(options?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (url: string, fetchOptions?: RequestInit): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(url, {
          ...fetchOptions,
          headers: {
            "Content-Type": "application/json",
            ...fetchOptions?.headers,
          },
        });

        const json: ApiResponse<T> = await res.json();

        if (!res.ok || !json.success) {
          const errorMessage = json.error || "Erro na requisição";
          setError(errorMessage);
          options?.onError?.(errorMessage);
          return null;
        }

        setData(json.data ?? null);
        options?.onSuccess?.();
        return json.data ?? null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const get = useCallback(
    (url: string) => execute(url, { method: "GET" }),
    [execute]
  );

  const post = useCallback(
    (url: string, body: unknown) =>
      execute(url, { method: "POST", body: JSON.stringify(body) }),
    [execute]
  );

  const put = useCallback(
    (url: string, body: unknown) =>
      execute(url, { method: "PUT", body: JSON.stringify(body) }),
    [execute]
  );

  const del = useCallback(
    (url: string) => execute(url, { method: "DELETE" }),
    [execute]
  );

  return { data, loading, error, get, post, put, del, execute };
}

// Hook for fetching data on mount
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url);
      const json: ApiResponse<T> = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Erro na requisição");
        return;
      }

      setData(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Fetch on mount and when URL changes
  useState(() => {
    if (url) refetch();
  });

  return { data, loading, error, refetch };
}
