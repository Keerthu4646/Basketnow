/**
 * TODO BN-801 - The cart reducer: ONE pure function that lists every way the cart can change.
 * State shape: { items: [{ variantId, qty }], couponCode: "" }   (details are derived, never stored)
 * - export EMPTY_CART
 * - export loadCart(): lazy initial state, reads localStorage "bn-cart" and "bn-coupon" (JSON) in try/catch
 * - export cartReducer(state, action) with a switch on action.type:
 *     SET_QTY { variantId, qty, max }  clamp 0..max, 0 removes the line, new line is appended
 *     ADD_LINES { lines: [{ variantId, qty, max }] }  adds to existing quantities (used by reorder)
 *     APPLY_COUPON { code }  REMOVE_COUPON  CLEAR
 *     unknown type -> throw new Error(...)
 * - never mutate: map / filter / spread only. No API calls and no localStorage writes in the reducer.
 */
export const EMPTY_CART = { items: [], couponCode: "" };

export function loadCart() {
  return EMPTY_CART;
}

export function cartReducer(state) {
  return state;
}
