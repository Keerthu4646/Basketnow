/**
 * TODO BN-805 / BN-806 - The HTTP client for the whole app (needs: npm install axios).
 * - setSimulateErrors(value): when true every request sends the header X-Simulate-Error: 1
 * - http = axios.create({ baseURL: "/api", timeout: 8000 }) with a request interceptor (X-Request-Id)
 *   and a response interceptor that turns every failure into an ApiError
 * - fetchJson(path, { signal, timeoutMs }): the same call with the browser's fetch (checks response.ok)
 * - class ApiError extends Error { status, code, fields, details }
 * - friendlyMessage(error): text a customer understands; isRetryable(error)
 */
export {};
