import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useNow } from "../../hooks/useNow";
import { getTrackingInfo } from "../../utils/tracking";
import { formatPrice, formatDateTime, pluralize } from "../../utils/format";
import { useShop } from "../../context/ShopContext";
import { useCart } from "../../context/CartContext";
function statusTone(info) {
  if (info.isCancelled) return "red";
  if (info.isDelivered) return "green";
  return "yellow";
}
/** Order history, newest first, with live statuses and one-tap reorder. */
function OrdersPage() {
  const navigate = useNavigate();
  const onTrack = (orderId) => navigate(`/orders/${orderId}`);
  const onBackToShop = () => navigate("/");
  const { orders } = useShop();
  const { reorder: onReorder } = useCart();
  const now = useNow(1000);
  const [message, setMessage] = useState("");
  if (orders.length === 0) {
    return (
      <EmptyState
        icon="
🧾
"
        title="No orders yet"
        message="Your past orders will appear here."
        action={<Button onClick={onBackToShop}>Start shopping</Button>}
      />
    );
  }
  function handleReorder(order) {
    const added = onReorder(order);
    setMessage(added > 0 ? `${pluralize(added, "item")} added to your cart.` : "Sorry, none of these items are in stock right now.");
  }
  return (
    <section>
      <h1>My Orders</h1>
      {message && <p className="info-box" role="status">{message}</p>}
      <ul className="orders">
        {orders.map((order) => {
          const info = getTrackingInfo(order, now);
          const itemCount = order.lines.reduce((s, l) => s + l.qty, 0);
          return (
            <li key={order.id} className="order-card">
              <div className="order-emojis" aria-hidden="true">
                {order.lines.slice(0, 4).map((l) => <span key={l.variantId}>{l.image}</span>)}
              </div>
              <div className="order-info">
                <b>#{order.id}</b> <Badge tone={statusTone(info)}>{info.label}</Badge>
                <small>{formatDateTime(order.createdAt)} · {pluralize(itemCount, "item")} · {formatPrice(order.bill.grandTotal)}</small>
              </div>
              <div className="order-actions">
                {!info.isCancelled && !info.isDelivered && <Button size="sm" onClick={() => onTrack(order.id)}>Track</Button>}
                {(info.isDelivered || info.isCancelled) && (
                  <Button size="sm" variant="secondary" onClick={() => handleReorder(order)}>Reorder</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onTrack(order.id)}>Details</Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
export default OrdersPage;
