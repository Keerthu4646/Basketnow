import { formatPrice } from "../../utils/format";
/** Selling price with the MRP struck through (MRP is hidden when there is no discount). */
function PriceTag({ price, mrp, size = "md" }) {
  return (
    <span className={`price-tag price-${size}`}>
      <span className="price-now">{formatPrice(price)}</span>
      {mrp > price && <s className="price-mrp">{formatPrice(mrp)}</s>}
    </span>
  );
}
export default PriceTag;