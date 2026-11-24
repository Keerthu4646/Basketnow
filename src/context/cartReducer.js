// The cart reducer: ONE place that lists every way the cart can change.
// A reducer is a pure function: (current state, action) -> NEW state. No API calls, no localStorage here.
export const EMPTY_CART = { items: [], couponCode: "" }; // items: [{ variantId, qty }] - details are derived
/** Lazy initial state: read the cart saved by the previous visit (same keys as before: bn-cart, bn-coupon). */
export function loadCart() {
  try {
    const items = JSON.parse(localStorage.getItem("bn-cart")) ?? [];
    const couponCode = JSON.parse(localStorage.getItem("bn-coupon")) ?? "";
    return { items: Array.isArray(items) ? items : [], couponCode };
  } catch {
    return EMPTY_CART; // broken JSON in storage -> start with an empty cart
  }
}
function setQty(items, variantId, qty, max) {
  const safeQty = Math.max(0, Math.min(qty, max));
  if (safeQty === 0) return items.filter((item) => item.variantId !== variantId);
  const exists = items.some((item) => item.variantId === variantId);
  return exists
    ? items.map((item) => (item.variantId === variantId ? { ...item, qty: safeQty } : item))
    : [...items, { variantId, qty: safeQty }];
}
export function cartReducer(state, action) {
  switch (action.type) {
    case "SET_QTY":
      return { ...state, items: setQty(state.items, action.variantId, action.qty, action.max) };
    case "ADD_LINES": {
      // reorder: add several items at once, each limited by its own max
      let items = state.items;
      for (const line of action.lines) {
        const current = items.find((item) => item.variantId === line.variantId)?.qty ?? 0;
        items = setQty(items, line.variantId, current + line.qty, line.max);
      }
      return { ...state, items };
    }
    case "APPLY_COUPON":
      return { ...state, couponCode: action.code };
    case "REMOVE_COUPON":
      return { ...state, couponCode: "" };
    case "CLEAR":
      return EMPTY_CART;
    default:
      throw new Error(`Unknown cart action: ${action.type}`); // a typo like "SET_QTI" fails loudly
  }
}