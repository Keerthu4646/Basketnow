import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { useNow } from "../../hooks/useNow";
import { getTrackingInfo } from "../../utils/tracking";
import { formatPrice, formatDateTime } from "../../utils/format";
import { TRACKING_STEPS } from "../../data/config";
import { useShop } from "../../context/ShopContext";
import { friendlyMessage } from "../../api/client";
/** Live order tracking. useNow() re-renders every second; status is derived from the clock. */
function OrderTrackerPage() {
  const { orderId } = useParams();                    // /orders/BN10001 -> "BN10001"
  const { state } = useLocation();                    // { justPlaced: true } right after checkout
  const navigate = useNavigate();
  const { orders, cancelOrder: onCancel, isLoading } = useShop();
  const order = orders.find((o) => o.id === orderId);
  const now = useNow(1000);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState("");
  if (isLoading) return <p className="muted">Loading order {orderId}...</p>;
  if (!order) {
    return (
      <EmptyState
        icon="
🧾
"
        title="Order not found"
        message={`There is no order with id ${orderId}.`}
        action={<Link className="btn btn-primary btn-md" to="/orders">See my orders</Link>}
      />
    );
  }
  const info = getTrackingInfo(order, now);
  async function confirmCancel() {
    setConfirmOpen(false);
    try {
      await onCancel(order.id);
    } catch (err) {
      setCancelError(friendlyMessage(err)); // e.g. 409: the rider already left
    }
  }
  return (
    <section className="tracker">
      {state?.justPlaced && <p className="info-box" role="status">
🎉
 Order placed! You can follow it live on this page.</p>}
      <div className={info.isCancelled ? "tracker-hero cancelled" : info.isDelivered ? "tracker-hero delivered" : "tracker-hero"}>
        <span className="tracker-emoji" aria-hidden="true">{info.isCancelled ? "❌" : info.isDelivered ? "🏠" : "🛵"}</span>
        <div>
          <h1>{info.isCancelled ? "Order cancelled" : info.isDelivered ? "Order delivered!" : info.label}</h1>
          <p>
            Order <b>#{order.id}</b> · placed {formatDateTime(order.createdAt)}
            {!info.isCancelled && !info.isDelivered && <> · next update in <b>{info.secondsToNext}s</b></>}
          </p>
        </div>
      </div>
      {!info.isCancelled && (
        <ol className="timeline">
          {TRACKING_STEPS.map((step, i) => (
            <li key={step.id} className={i < info.stepIndex ? "done" : i === info.stepIndex ? "current" : ""}>
              <span className="dot">{i < info.stepIndex || info.isDelivered ? "✓" : i + 1}</span>
              {step.label}
            </li>
          ))}
        </ol>
      )}
      <div className="tracker-grid">
        <div className="panel">
          <h2>Items</h2>
          <ul className="summary-lines">
            {order.lines.map((l) => (
              <li key={l.variantId}>
                <span>{l.image} {l.name} <small>({l.variantLabel}) × {l.qty}</small></span>
                <span>{formatPrice(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="bill-total"><span>Total · {order.paymentLabel}</span><span>{formatPrice(order.bill.grandTotal)}</span></p>
        </div>
        <div className="panel">
          <h2>Delivering to</h2>
          <p><b>{order.address.fullName}</b> · {order.address.phone}</p>
          <p>{order.address.house}, {order.address.area}{order.address.landmark ? `, near ${order.address.landmark}` : ""}</p>
          <p>{order.city} - {order.address.pincode}</p>
          <p><Badge tone="blue">{order.slotLabel}</Badge></p>
        </div>
      </div>
      <div className="row">
        <Button variant="secondary" onClick={() => navigate("/")}>Continue shopping</Button>
        <Button variant="ghost" onClick={() => navigate("/orders")}>All orders</Button>
        {info.canCancel && (
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Cancel order</Button>
        )}
      </div>
      {cancelError && <p className="error-banner" role="alert">{cancelError}</p>}
      {/* The order exactly as the API sent it: JSON text turned into a JavaScript object, shown as text again */}
      <details className="json-box">
        <summary>Show order JSON (from GET /api/orders)</summary>
        <pre>{JSON.stringify(order, null, 2)}</pre>
      </details>
      <Modal
        isOpen={confirmOpen}
        title="Cancel this order?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Keep order</Button>
            <Button variant="danger" onClick={confirmCancel}>Yes, cancel</Button>
          </>
        }
      >
        <p>Your order is still being prepared. If you cancel now, the full amount of <b>{formatPrice(order.bill.grandTotal)}</b> will be refunded.</p>
      </Modal>
    </section>
  );
}
export default OrderTrackerPage;