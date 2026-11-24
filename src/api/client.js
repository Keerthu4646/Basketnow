import axios from "axios";
// The HTTP layer of the app. Two ways to call the BasketNow REST API (mock-server/mockApi.js):
//   http       - an axios instance: base URL, timeout and headers configured ONCE
//   fetchJson  - the browser's built-in fetch(), with the checks fetch does not do for us
// Whatever goes wrong, both throw the SAME kind of error: ApiError.
let simulateErrors = false;
/** Developer switch used by the footer "Simulate API errors" toggle. */
export function setSimulateErrors(value) {
  simulateErrors = value;
}
/** One error shape for the whole app: status, code, message and per-field messages for forms. */
export class ApiError extends Error {
  constructor({ status = 0, code = "UNKNOWN", message = "Something went wrong", fields = {}, details = {} }) {
    super(message);
    this.name = "ApiError";
    this.status = status;   // 0 = no answer at all (offline, server down, timeout)
    this.code = code;       // "VALIDATION_ERROR", "OUT_OF_STOCK", "NETWORK_ERROR", ...
    this.fields = fields;   // { phone: "Enter a valid..." } for forms
    this.details = details; // anything extra, e.g. which items are sold out
  }
  /** Worth trying again? Only for temporary problems: no answer, busy (503) or timeout (504). */
  get isRetryable() {
    return this.status === 0 || this.status === 503 || this.status === 504;
  }
}
/** Words a customer understands - never "Request failed with status code 503". */
export function friendlyMessage(error) {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";
  if (error.code === "NETWORK_ERROR") return "You seem to be offline, or our server is down. Check your connection.";
  if (error.code === "TIMEOUT") return "This is taking too long. Please try again.";
  if (error.status === 503) return "BasketNow is very busy right now. Please try again in a moment.";
  return error.message;
}
/** Turn ANY axios error into an ApiError. */
export function toApiError(error) {
  if (axios.isCancel(error)) return new ApiError({ code: "CANCELLED", message: "Request cancelled" });
  if (error.response) {
    // The server answered 4xx / 5xx with our standard body: { error: { code, message, fields, ... } }
    const { code, message, fields, ...details } = error.response.data?.error ?? {};
    return new ApiError({ status: error.response.status, code, message, fields, details });
  }
  if (error.code === "ECONNABORTED") return new ApiError({ code: "TIMEOUT", message: "The server took too long" });
  return new ApiError({ code: "NETWORK_ERROR", message: "Cannot reach the server" }); // no answer at all
}
export const http = axios.create({
  baseURL: "/api",                                  // same origin as the app: no CORS problems
  timeout: 8000,                                    // give up after 8 s instead of spinning forever
  headers: { "Content-Type": "application/json" },
});
// REQUEST interceptor: runs before EVERY request leaves the browser
http.interceptors.request.use((config) => {
  config.headers["X-Request-Id"] = Math.random().toString(36).slice(2, 10); // find this call in the server log
  if (simulateErrors) config.headers["X-Simulate-Error"] = "1";
  return config;
});
// RESPONSE interceptor: runs after EVERY response; every failure becomes an ApiError
http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error))
);
/** GET with fetch(). fetch does not throw for 404/500, does not parse JSON and has no timeout - we add all three. */
export async function fetchJson(path, { signal, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  signal?.addEventListener("abort", () => controller.abort("cancelled"));
  let response;
  try {
    response = await fetch(`/api${path}`, {
      headers: simulateErrors ? { "X-Simulate-Error": "1" } : {},
      signal: controller.signal,
    });
  } catch {
    // fetch throws ONLY when there is no response: offline, server down, aborted
    if (controller.signal.reason === "timeout") throw new ApiError({ code: "TIMEOUT", message: "The server took too long" });
    if (controller.signal.aborted) throw new ApiError({ code: "CANCELLED", message: "Request cancelled" });
    throw new ApiError({ code: "NETWORK_ERROR", message: "Cannot reach the server" });
  } finally {
    clearTimeout(timer);
  }
  const data = await response.json().catch(() => null);   // the body may be empty
  if (!response.ok) {                                       // 4xx / 5xx: fetch did NOT throw, so we do
    const { code, message, fields, ...details } = data?.error ?? {};
    throw new ApiError({ status: response.status, code, message: message ?? response.statusText, fields, details });
  }
  return data;
}
