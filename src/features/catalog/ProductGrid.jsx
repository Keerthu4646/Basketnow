import ProductCard from "./ProductCard";
function ProductGrid({ products }) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
/** Grey placeholder cards shown while products load. */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="product-card skeleton">
          <div className="sk sk-media" />
          <div className="sk sk-line" />
          <div className="sk sk-line short" />
          <div className="sk sk-btn" />
        </div>
      ))}
    </div>
  );
}
export default ProductGrid;