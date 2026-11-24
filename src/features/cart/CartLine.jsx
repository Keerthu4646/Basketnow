import PriceTag from "../../components/ui/PriceTag";
import QuantityStepper from "../../components/ui/QuantityStepper";
/** One row in the cart. Setting quantity to 0 removes the item. */
function CartLine({ line, onChangeQty }) {
  return (
    <li className="cart-line">
      <span className="cart-line-emoji" aria-hidden="true">{line.image}</span>
      <div className="cart-line-info">
        <b>{line.name}</b>
        <small>{line.variantLabel}{line.qty === line.maxQty ? " · max quantity reached" : ""}</small>
        <PriceTag price={line.price * line.qty} mrp={line.mrp * line.qty} size="sm" />
      </div>
      <QuantityStepper value={line.qty} max={line.maxQty} label={line.name} onChange={(q) => onChangeQty(line.variantId, q)} />
    </li>
  );
}
export default CartLine;