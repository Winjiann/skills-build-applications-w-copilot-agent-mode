import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useApiData<T>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });

    getJson<T>(path).then(
      (data) => {
        if (active) setState({ data, loading: false, error: null });
      },
      (error: unknown) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
