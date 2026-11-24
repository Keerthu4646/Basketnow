import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api/api";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { getTrackingInfo } from "../utils/tracking";
/**
 * Shared shop data: the catalogue, the orders, the saved address and the developer switches.
 * Any component can read it with useShop() - no props passed through the layers in between.
 */
const ShopContext = createContext(null);
export function ShopProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);         // an ApiError, or null
  const [reloadKey, setReloadKey] = useState(0);
  const [orders, setOrders] = useState([]);                 // orders now live on the SERVER
  const [savedAddress, setSavedAddress] = useLocalStorage("bn-address", null);
  const [simulateErrors, setSimulateErrorsState] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  useEffect(() => {
    api.setSimulateErrors(simulateErrors);
  }, [simulateErrors]);
  // Load the catalogue and the orders from the API on start and on every "Try again"
  useEffect(() => {
    const controller = new AbortController();          // cancels the requests if this effect is cleaned up
    setIsLoading(true);
    setLoadError(null);
    Promise.all([api.fetchProducts({ signal: controller.signal }), api.fetchOrders({ signal: controller.signal })])
      .then(([productList, orderList]) => {
        setProducts(productList);
        setOrders(orderList);
      })
      .catch((err) => { if (!controller.signal.aborted) setLoadError(err); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [reloadKey]);
  /** Fetch fresh stock without showing the loading skeleton (after an order or a cancel). */
  function refreshProducts() {
    api.fetchProducts().then(setProducts).catch(() => {});
  }
  // ---------- derived ----------
  const hasPreviousOrders = orders.some((o) => !o.cancelledAt);
  const activeOrders = orders.filter((o) => {
    const info = getTrackingInfo(o, Date.now());
    return !info.isCancelled && !info.isDelivered;
  }).length;
  // ---------- actions ----------
  /** The SERVER builds the order (prices, bill, stock check). We only send what the customer chose. */
  async function placeOrder(orderRequest, { saveAddress, idempotencyKey }) {
    const order = await api.placeOrder(orderRequest, idempotencyKey); // throws ApiError -> CheckoutPage shows it
    setOrders((prev) => [order, ...prev]);
    setSavedAddress(saveAddress ? orderRequest.address : null);
    refreshProducts();                                   // the server reduced the stock
    return order;
  }
  async function cancelOrder(orderId) {
    const updated = await api.cancelOrder(orderId);      // the server returns the stock
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    refreshProducts();
  }
  /** OPTIMISTIC update: change the screen now, tell the server, undo (reload) if the server says no. */
  async function updateStock(variantId, stock) {
    setProducts((prev) =>
      prev.map((p) => ({ ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, stock } : v)) }))
    );
    try {
      setInventoryError("");
      await api.updateStock(variantId, stock);
    } catch (err) {
      setInventoryError(`Stock not saved: ${err.message}`);
      refreshProducts();                                 // show the server's real numbers again
    }
  }
  async function addProduct(values) {
    const product = await api.addProduct(values);        // throws ApiError (400 + fields) if invalid
    setProducts((prev) => [product, ...prev]);
    return product;
  }
  async function deleteProduct(productId) {
    try {
      setInventoryError("");
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      setInventoryError(`Product not deleted: ${err.message}`);
    }
  }
  async function resetDemo() {
    await api.resetDemoData();
    setSavedAddress(null);
    setReloadKey((k) => k + 1); // reload products and orders from the API
  }
  const value = {
    products, isLoading, loadError, reloadProducts: () => setReloadKey((k) => k + 1),
    orders, hasPreviousOrders, activeOrders, savedAddress,
    simulateErrors, setSimulateErrors: setSimulateErrorsState,
    placeOrder, cancelOrder, updateStock, addProduct, deleteProduct, resetDemo, inventoryError,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
/** Read the shop data. Throws a clear message if <ShopProvider> is missing. */
export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop() must be used inside <ShopProvider>");
  return context;
}