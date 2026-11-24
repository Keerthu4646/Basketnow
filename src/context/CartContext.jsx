/**
 * TODO BN-801 - CartContext: Context + useReducer + localStorage.
 * - useReducer(cartReducer, undefined, loadCart)  -> cart = { items, couponCode }
 * - isCartOpen (useState); useEffect saves "bn-cart" and "bn-coupon" whenever the cart changes
 * - derived with the pricing utils: lines, cartQtyById, coupon, bill, offers
 * - actions: openCart, closeCart, changeQty, applyCoupon -> { ok, reason }, removeCoupon, reorder, clearCart
 * - put everything in ONE object with useMemo and give it to <CartContext.Provider value={...}>
 * - export function useCart(): useContext + a clear error when used outside <CartProvider>
 */
export function CartProvider({ children }) {
  return children;
}

export function useCart() {
  throw new Error("useCart is not built yet (BN-801)");
}
