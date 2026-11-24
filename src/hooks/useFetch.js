import { useCallback, useEffect, useState } from "react";
/**
 * Load data from the API when a component appears (and again when `deps` change).
 * Gives every screen the same states: isLoading, error, data - plus reload() for a "Try again" button.
 *
 *   const { data, isLoading, error, reload } = useFetch((signal) => fetchProduct(id, { signal }), [id]);
 */
export function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, isLoading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, isLoading: true, error: null }));      // keep old data while reloading
    loader(controller.signal)
      .then((data) => setState({ data, isLoading: false, error: null }))
      .catch((error) => {
        if (error.code === "CANCELLED" || controller.signal.aborted) return; // we cancelled it ourselves
        setState({ data: null, isLoading: false, error });
      });
    // CLEANUP: the URL changed or the page closed -> cancel the old request,
    // so a slow old answer can never overwrite the new one (a race condition).
    return () => controller.abort();
  }, [...deps, attempt]); // eslint-disable-line react-hooks/exhaustive-deps
  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}