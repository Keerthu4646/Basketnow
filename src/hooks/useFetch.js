/**
 * TODO BN-806 - useFetch(loader, deps): load data for one screen.
 * Returns { data, isLoading, error, reload }
 * - runs loader({ signal }) in useEffect whenever deps (or reload) change
 * - AbortController: abort the old request when deps change or the component unmounts,
 *   so an old slow answer can never overwrite a newer one (race condition)
 */
export function useFetch() {
  return { data: null, isLoading: true, error: null, reload: () => {} };
}
