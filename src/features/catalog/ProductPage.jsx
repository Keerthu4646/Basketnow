import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import PriceTag from "../../components/ui/PriceTag";
import QuantityStepper from "../../components/ui/QuantityStepper";
import { ProductGridSkeleton } from "./ProductGrid";
import { useShop } from "../../context/ShopContext";
import { useCart } from "../../context/CartContext";
import { discountPercent } from "../../utils/format";
import { getMaxQty } from "../../utils/pricing";
import { LOW_STOCK_LIMIT } from "../../data/config";
/** Route /product/:productId - one page for every product. The id comes from the URL. */
function ProductPage() {
  const { productId } = useParams();                  // "/product/p204" -> "p204"
  const navigate = useNavigate();
  const { products, isLoading } = useShop();
  const { cartQtyById, changeQty, openCart } = useCart();
  const [chosenId, setChosenId] = useState(null);
  if (isLoading) return <ProductGridSkeleton count={1} />;
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return (
      <EmptyState
        icon="
🔍
"
        title="Product not found"
        message={`We could not find a product with id "${productId}".`}
        action={<Link className="btn btn-primary btn-md" to="/">Back to the shop</Link>}
      />
    );
  }
  const variant = product.variants.find((v) => v.id === chosenId)
    ?? product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const qtyInCart = cartQtyById[variant.id] || 0;
  const off = discountPercent(variant.price, variant.mrp);
  return (
    <section>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <button className="link" onClick={() => navigate(-1)}>← Back</button>
        <Link to="/">Shop</Link> /
        <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link> /
        <span>{product.name}</span>
      </nav>
      <div className="product-page">
        <div className="product-hero" aria-hidden="true">{product.image}</div>
        <div>
          <p className="product-brand">{product.brand} · ★ {product.rating.toFixed(1)}</p>
          <h1>{product.name}</h1>
          <div className="product-tags">
            {off > 0 && <Badge tone="green">{off}% OFF</Badge>}
            {variant.stock > 0 && variant.stock <= LOW_STOCK_LIMIT && <Badge tone="red">Only {variant.stock} left</Badge>}
          </div>
          <div className="variant-pills" role="group" aria-label="Pack size">
            {product.variants.map((v) => (
              <button
                key={v.id}
                className={[v.id === variant.id ? "pill active" : "pill", v.stock === 0 ? "pill-out" : ""].join(" ")}
                onClick={() => setChosenId(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="product-foot">
            <PriceTag price={variant.price} mrp={variant.mrp} />
            {variant.stock === 0 ? (
              <Button variant="secondary" disabled>Out of stock</Button>
            ) : qtyInCart === 0 ? (
              <Button onClick={() => changeQty(variant.id, 1)}>Add to cart</Button>
            ) : (
              <QuantityStepper value={qtyInCart} max={getMaxQty(variant.stock)} label={product.name}
                               onChange={(q) => changeQty(variant.id, q)} />
            )}
          </div>
          {qtyInCart > 0 && <Button variant="ghost" onClick={openCart}>View cart →</Button>}
          <p className="muted">{variant.stock} in stock · Free delivery above ₹199</p>
        </div>
      </div>
    </section>
  );
}
export default ProductPage;
