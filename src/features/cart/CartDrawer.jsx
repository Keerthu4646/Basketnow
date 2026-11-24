import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CartLine from "./CartLine";
import FreeDeliveryProgress from "./FreeDeliveryProgress";
import CouponPicker from "./CouponPicker";
import BillDetails from "./BillDetails";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { formatPrice, pluralize } from "../../utils/format";
import { useCart } from "../../context/CartContext";
/** Slide-in cart panel. Reads everything from CartContext and goes to /checkout with the router. */
function CartDrawer() {
  const navigate = useNavigate();
  const {
    isCartOpen: isOpen, closeCart: onClose, lines, bill, offers, couponCode,
    applyCoupon: onApplyCoupon, removeCoupon: onRemoveCoupon, changeQty: onChangeQty, clearCart: onClearCart,
  } = useCart();
  // Close with the Escape key while open (listener cleaned up on close/unmount)
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="overlay drawer-overlay" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Cart" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>My Cart</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close cart">✕</button>
        </div>
        {lines.length === 0 ? (
          <EmptyState
            icon="
🛒
"
            title="Your cart is empty"
            message="Add fresh fruits, dairy and daily essentials to get started."
            action={<Button onClick={onClose}>Start shopping</Button>}
          />
        ) : (
          <>
            <div className="drawer-body">
              <FreeDeliveryProgress itemTotal={bill.itemTotal} amountRemaining={bill.amountForFreeDelivery} />
              <div className="drawer-section">
                <div className="section-head">
                  <b>{pluralize(bill.itemCount, "item")}</b>
                  <button className="link danger" onClick={onClearCart}>Clear cart</button>
                </div>
                <ul className="cart-lines">
                  {lines.map((line) => (
                    <CartLine key={line.variantId} line={line} onChangeQty={onChangeQty} />
                  ))}
                </ul>
              </div>
              <CouponPicker offers={offers} appliedCode={couponCode} onApply={onApplyCoupon} onRemove={onRemoveCoupon} />
              {couponCode && bill.couponResult && !bill.couponResult.ok && (
                <p className="warning-box">{couponCode} is no longer applicable: {bill.couponResult.reason}</p>
              )}
              <BillDetails bill={bill} couponCode={couponCode} />
            </div>
            <div className="drawer-foot">
              <div>
                <b>{formatPrice(bill.grandTotal)}</b>
                <small>TOTAL</small>
              </div>
              <Button size="lg" onClick={() => navigate("/checkout")}>Proceed to checkout →</Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
export default CartDrawer;