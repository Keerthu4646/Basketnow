/**
 * TODO BN-801 - ShopContext: the shop data that many far-apart components need.
 * - const ShopContext = createContext(null)
 * - export function ShopProvider({ children }) owns: products, isLoading, loadError, reloadKey, orders,
 *   savedAddress (useLocalStorage "bn-address"), simulateErrors
 * - derived: hasPreviousOrders, activeOrders (orders not cancelled and not delivered yet)
 * - actions: reloadProducts, placeOrder, cancelOrder, updateStock, addProduct, deleteProduct, resetDemo,
 *   setSimulateErrors
 * - export function useShop(): useContext + a clear error when used outside <ShopProvider>
 * Later tickets move every action to the REST API (BN-805, BN-806, BN-808).
 */
export function ShopProvider({ children }) {
  return children;
}

export function useShop() {
  throw new Error("useShop is not built yet (BN-801)");
}
