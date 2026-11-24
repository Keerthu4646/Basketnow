import { formatPrice } from "../../utils/format";
import { FREE_DELIVERY_THRESHOLD } from "../../data/config";
/** "Add ₹40 more for FREE delivery" with a progress bar. */
function FreeDeliveryProgress({ itemTotal, amountRemaining }) {
  const percent = Math.min(100, Math.round((itemTotal / FREE_DELIVERY_THRESHOLD) * 100));
  return (
    <div className={amountRemaining > 0 ? "free-delivery" : "free-delivery done"}>
      <p>
        {amountRemaining > 0 ? (
          <>Add <b>{formatPrice(amountRemaining)}</b> more for <b>FREE delivery</b></>
        ) : (
          <>Yay! You get <b>FREE delivery</b> on this order</>
        )}
      </p>
      <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
export default FreeDeliveryProgress;