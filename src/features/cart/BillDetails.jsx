import { formatPrice } from "../../utils/format";
/** Price breakdown. Every number comes from getBill(); this component only displays. */
function BillDetails({ bill, couponCode }) {
  return (
    <div className="bill">
      <h4>Bill details</h4>
      <p><span>Items total</span><span><s className="muted">{formatPrice(bill.mrpTotal)}</s> {formatPrice(bill.itemTotal)}</span></p>
      {bill.couponDiscount > 0 && (
        <p className="ok-text"><span>Coupon ({couponCode})</span><span>− {formatPrice(bill.couponDiscount)}</span></p>
      )}
      <p><span>Delivery fee</span><span>{bill.deliveryFee === 0 ? <b className="ok-text">FREE</b> : formatPrice(bill.deliveryFee)}</span></p>
      <p><span>Handling fee</span><span>{formatPrice(bill.handlingFee)}</span></p>
      {bill.slotFee > 0 && <p><span>Express delivery</span><span>{formatPrice(bill.slotFee)}</span></p>}
      <p className="bill-total"><span>Grand total</span><span>{formatPrice(bill.grandTotal)}</span></p>
      {bill.totalSavings > 0 && (
        <p className="savings">You are saving {formatPrice(bill.totalSavings)} on this order 
�
�
</p>
      )}
    </div>
  );
}
export default BillDetails;