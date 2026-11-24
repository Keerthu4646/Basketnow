import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { cartReducer, loadCart } from "./cartReducer";
import { useShop } from "./ShopContext";
import { buildCartLines, getBill, getMaxQty, indexVariants, validateCoupon } from "../utils/pricing";
import { COUPONS } from "../data/coupons";
/**
 * The cart as SHARED state: Header (count), ProductCard (ADD / stepper), CartDrawer, Checkout
 * and Orders (reorder) all read and change it through useCart().
 */
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const { products, hasPreviousOrders } = useShop();
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart); // loadCart runs once
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Save the cart on every change (same keys as before, so an old cart is still there)
  useEffect(() => {
    try {
      localStorage.setItem("bn-cart", JSON.stringify(state.items));
      localStorage.setItem("bn-coupon", JSON.stringify(state.couponCode));
    } catch {
      // storage full or blocked: the cart still works in memory
    }
  }, [state]);
  // useMemo: rebuild the value only when the cart, the products or the order history change
  const value = useMemo(() => {
    const lines = buildCartLines(state.items, products);
    const cartQtyById = Object.fromEntries(lines.map((l) => [l.variantId, l.qty]));
    const coupon = COUPONS.find((c) => c.code === state.couponCode) || null;
    const bill = getBill({ lines, coupon, hasPreviousOrders });
    const offers = COUPONS.map((c) => ({ coupon: c, result: validateCoupon(c, { lines, itemTotal: bill.itemTotal, hasPreviousOrders }) }));
    const index = indexVariants(products);
    const maxFor = (variantId) => (index[variantId] ? getMaxQty(index[variantId].variant.stock) : 0);
    function changeQty(variantId, qty) {
      dispatch({ type: "SET_QTY", variantId, qty, max: maxFor(variantId) });
    }
    function applyCoupon(code) {
      const found = COUPONS.find((c) => c.code === code);
      if (!found) return { ok: false, reason: `"${code}" is not a valid coupon` };
      const result = validateCoupon(found, { lines, itemTotal: bill.itemTotal, hasPreviousOrders });
      if (result.ok) dispatch({ type: "APPLY_COUPON", code });
      return result;
    }
    function reorder(order) {
      const available = order.lines.filter((l) => maxFor(l.variantId) > 0);
      dispatch({ type: "ADD_LINES", lines: available.map((l) => ({ variantId: l.variantId, qty: l.qty, max: maxFor(l.variantId) })) });
      if (available.length > 0) setIsCartOpen(true);
      return available.length;
    }
    return {
      lines, cartQtyById, coupon, couponCode: state.couponCode, bill, offers, isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      changeQty, applyCoupon, reorder,
      removeCoupon: () => dispatch({ type: "REMOVE_COUPON" }),
      clearCart: () => dispatch({ type: "CLEAR" }),
    };
  }, [state, products, hasPreviousOrders, isCartOpen]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
/** Read and change the cart. Throws a clear message if <CartProvider> is missing. */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart() must be used inside <CartProvider>");
  return context;
}