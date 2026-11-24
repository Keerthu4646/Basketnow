import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "../../features/cart/CartDrawer";
import { useCart } from "../../context/CartContext";
/** The frame around every page. <Outlet /> is where the page of the current URL is drawn. */
function Layout() {
  const { pathname } = useLocation();
  const { closeCart } = useCart();
  // A new page: scroll to the top and close the cart drawer
  useEffect(() => {
    window.scrollTo(0, 0);
    closeCart();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <CartDrawer />
      <Footer />
    </div>
  );
}
export default Layout;