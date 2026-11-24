import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { formatPrice, pluralize } from "../../utils/format";
import { useCart } from "../../context/CartContext";
import { useShop } from "../../context/ShopContext";
/** Top bar: logo, delivery promise, search, navigation tabs and the cart button. No state of its own. */
function Header() {
  const { bill, openCart } = useCart();      // shared state: no props needed
  const { activeOrders } = useShop();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // The search text lives in the URL (/?q=rice), so a search can be shared and survives a refresh.
  const searchText = pathname === "/" ? searchParams.get("q") ?? "" : "";
  function handleSearchChange(text) {
    const query = text ? `?q=${encodeURIComponent(text)}` : "";
    navigate(`/${query}`, { replace: pathname === "/" }); // typing does not fill the Back history
  }
  const onShopPages = pathname === "/" || pathname.startsWith("/product") || pathname === "/checkout";
  const tabClass = ({ isActive }) => (isActive ? "tab active" : "tab");
  return (
    <header className="header">
      <div className="header-row">
        <Link className="logo" to="/" aria-label="BasketNow home">
          basket<span>now</span>
        </Link>
        <div className="promise">
          <b>Delivery in 15 minutes</b>
          <small>Hyderabad · Kadapa · Nellore · Vizag</small>
        </div>
        <div className="search">
          <span aria-hidden="true">
🔍
</span>
          <input
            type="search"
            placeholder='Search "milk", "rice", "chips"...'
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <button className={bill.itemCount > 0 ? "cart-btn has-items" : "cart-btn"} onClick={openCart}>
          {bill.itemCount > 0 ? (
            <>
              <b>{pluralize(bill.itemCount, "item")}</b>
              <span>{formatPrice(bill.grandTotal)}</span>
            </>
          ) : (
            <b>My Cart</b>
          )}
        </button>
      </div>
      <nav className="tabs" aria-label="Main">
        <NavLink to="/" className={() => (onShopPages ? "tab active" : "tab")}>Shop</NavLink>
        <NavLink to="/orders" className={tabClass}>
          My Orders
          {activeOrders > 0 && <span className="tab-dot">{activeOrders}</span>}
        </NavLink>
        <NavLink to="/admin" className={tabClass}>Inventory</NavLink>
      </nav>
    </header>
  );
}
export default Header;