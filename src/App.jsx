import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import NotFoundPage from "./components/layout/NotFoundPage";
import CatalogPage from "./features/catalog/CatalogPage";
import ProductPage from "./features/catalog/ProductPage";
import CheckoutPage from "./features/checkout/CheckoutPage";
import OrderTrackerPage from "./features/orders/OrderTrackerPage";
import OrdersPage from "./features/orders/OrdersPage";
import InventoryPage from "./features/admin/InventoryPage";
/**
 * The whole site map: URL -> page. The `view` state is gone - the URL is now the source of truth,
 * so pages can be refreshed, bookmarked, shared and reached with the Back button.
 */
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderTrackerPage />} />
        <Route path="/admin" element={<InventoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
export default App;