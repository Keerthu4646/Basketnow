import { useState } from "react";
import Button from "../../components/ui/Button";
/**
 * Enter a code or pick from the list. Each coupon shows whether it is usable right now and why not.
 * offers: [{ coupon, result: { ok, discount, reason } }]
 */
function CouponPicker({ offers, appliedCode, onApply, onRemove }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    const result = onApply(code.trim().toUpperCase());
    if (result.ok) {
      setCode("");
      setError("");
    } else {
      setError(result.reason);
    }
  }
  return (
    <div className="coupons">
      <h4>Coupons & offers</h4>
      <form className="coupon-form" onSubmit={handleSubmit}>
        <input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          aria-label="Coupon code"
        />
        <Button type="submit" variant="secondary" size="sm" disabled={!code.trim()}>Apply</Button>
      </form>
      {error && <p className="field-error">{error}</p>}
      <ul className="coupon-list">
        {offers.map(({ coupon, result }) => {
          const isApplied = coupon.code === appliedCode;
          return (
            <li key={coupon.code} className={result.ok ? "coupon" : "coupon unavailable"}>
              <div>
                <code>{coupon.code}</code>
                <p>{coupon.title}</p>
                <small className={result.ok ? "ok-text" : "muted"}>
                  {result.ok ? `You save ₹${result.discount}` : result.reason}
                </small>
              </div>
              {isApplied ? (
                <Button variant="ghost" size="sm" onClick={onRemove}>Remove</Button>
              ) : (
                <Button variant="ghost" size="sm" disabled={!result.ok} onClick={() => onApply(coupon.code)}>Apply</Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
export default CouponPicker;