import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PriceTag from "../../components/ui/PriceTag";
import QuantityStepper from "../../components/ui/QuantityStepper";
import { discountPercent } from "../../utils/format";
import { getMaxQty } from "../../utils/pricing";
import { LOW_STOCK_LIMIT } from "../../data/config";
import { useCart } from "../../context/CartContext";
const TAG_LABELS = { bestseller: "Bestseller", organic: "Organic", new: "New" };
/**
 * One product tile. The selected pack size is local UI state (only this card cares about it).
 * The cart quantity and changeQty come straight from CartContext - no props through the grid.
 */
function ProductCard({ product }) {
  const { cartQtyById, changeQty: onChangeQty } = useCart();
  const firstInStock = product.variants.find((v) => v.stock > 0) || product.variants[0];
  const [variantId, setVariantId] = useState(firstInStock.id);
  // If the selected variant disappears (admin edit), fall back to the first one
  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  const qtyInCart = cartQtyById[variant.id] || 0;
  const maxQty = getMaxQty(variant.stock);
  const off = discountPercent(variant.price, variant.mrp);
  const isOut = variant.stock === 0;
  return (
    <article className={isOut ? "product-card is-out" : "product-card"}>
      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-media">
          <span className="product-emoji" aria-hidden="true">{product.image}</span>
          {off > 0 && <span className="off-ribbon">{off}% OFF</span>}
        </div>
      </Link>
      <div className="product-tags">
        {product.tags.map((tag) => (
          <Badge key={tag} tone={tag === "organic" ? "green" : tag === "new" ? "blue" : "yellow"}>{TAG_LABELS[tag]}</Badge>
        ))}
        {!isOut && variant.stock <= LOW_STOCK_LIMIT && <Badge tone="red">Only {variant.stock} left</Badge>}
      </div>
      <Link to={`/product/${product.id}`} className="product-link">
        <h3 className="product-name">{product.name}</h3>
      </Link>
      <p className="product-brand">{product.brand} · ★ {product.rating.toFixed(1)}</p>
      {product.variants.length > 1 ? (
        <div className="variant-pills" role="group" aria-label="Pack size">
          {product.variants.map((v) => (
            <button
              key={v.id}
              className={[v.id === variant.id ? "pill active" : "pill", v.stock === 0 ? "pill-out" : ""].join(" ")}
              onClick={() => setVariantId(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="variant-single">{variant.label}</p>
      )}
      <div className="product-foot">
        <PriceTag price={variant.price} mrp={variant.mrp} />
        {isOut ? (
          <Button variant="secondary" size="sm" disabled>Out of stock</Button>
        ) : qtyInCart === 0 ? (
          <Button variant="secondary" size="sm" onClick={() => onChangeQty(variant.id, 1)}>ADD</Button>
        ) : (
          <QuantityStepper value={qtyInCart} max={maxQty} label={product.name} onChange={(q) => onChangeQty(variant.id, q)} />
        )}
      </div>
    </article>
  );
}
export default ProductCard;
