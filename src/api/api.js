// API service functions: the ONLY place that knows URLs and HTTP methods.
// Components call fetchProducts(), placeOrder(), ... and never write "/api/..." themselves.
// The function names are the same as in the old in-browser mock, so most components did not change.
import { http, fetchJson } from "./client";
export { setSimulateErrors } from "./client";
/** GET /api/products -> Product[] */
export async function fetchProducts({ signal } = {}) {
  const response = await http.get("/products", { signal });
  return response.data;                             // axios already parsed the JSON
}
/** GET /api/products/:id -> Product */
export async function fetchProduct(productId, { signal } = {}) {
  const { data } = await http.get(`/products/${encodeURIComponent(productId)}`, { signal });
  return data;
}
/** GET /api/pincodes/:pincode -> { pincode, serviceable, city }  (written with fetch, to compare) */
export function checkPincode(pincode, { signal } = {}) {
  return fetchJson(`/pincodes/${pincode}`, { signal });
}
/**
 * POST /api/orders -> the created order. Send ids and quantities only - the server decides prices.
 * The Idempotency-Key makes a retry safe: the same key twice returns the SAME order, never a second one.
 */
export async function placeOrder(orderRequest, idempotencyKey) {
  const { data } = await http.post("/orders", orderRequest, {
    headers: { "Idempotency-Key": idempotencyKey },
    timeout: 15000,
  });
  return data;
}
/** GET /api/orders -> Order[] (newest first) */
export async function fetchOrders({ signal } = {}) {
  const { data } = await http.get("/orders", { signal });
  return data;
}
/** PATCH /api/orders/:id/cancel -> the updated order */
export async function cancelOrder(orderId) {
  const { data } = await http.patch(`/orders/${encodeURIComponent(orderId)}/cancel`);
  return data;
}
// ---------- inventory (store manager) ----------
/** PATCH /api/variants/:id  { stock } -> { variantId, stock } */
export async function updateStock(variantId, stock) {
  const { data } = await http.patch(`/variants/${encodeURIComponent(variantId)}`, { stock });
  return data;
}
/** POST /api/products -> the created product (the server gives it an id). 400 with fields if invalid. */
export async function addProduct(values) {
  const { data } = await http.post("/products", values);
  return data;
}
/** DELETE /api/products/:id -> nothing (HTTP 204 No Content) */
export async function deleteProduct(productId) {
  await http.delete(`/products/${encodeURIComponent(productId)}`);
}
/** POST /api/reset -> restore the original demo catalogue and remove all orders */
export async function resetDemoData() {
  await http.post("/reset");
}