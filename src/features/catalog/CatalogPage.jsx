import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryBar from "./CategoryBar";
import CatalogToolbar from "./CatalogToolbar";
import ProductGrid, { ProductGridSkeleton } from "./ProductGrid";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import { useDebounce } from "../../hooks/useDebounce";
import { discountPercent } from "../../utils/format";
import { CATEGORIES } from "../../data/products";
import { useShop } from "../../context/ShopContext";
import { friendlyMessage } from "../../api/client";
// Sort helpers use the cheapest variant of each product
const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
const maxDiscount = (p) => Math.max(...p.variants.map((v) => discountPercent(v.price, v.mrp)));
const inStock = (p) => p.variants.some((v) => v.stock > 0);
const SORTERS = {
  relevance: null,
  priceLow: (a, b) => minPrice(a) - minPrice(b),
  priceHigh: (a, b) => minPrice(b) - minPrice(a),
  discount: (a, b) => maxDiscount(b) - maxDiscount(a),
  rating: (a, b) => b.rating - a.rating,
};
/**
 * Storefront. Search text and category live in the URL (/?q=rice&category=Staples) so they can be shared;
 * sort and in-stock stay local because only this page uses them. The catalogue comes from ShopContext.
 */
function CatalogPage() {
  const { products, isLoading, loadError: error, reloadProducts: onRetry } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "All";
  const [sortBy, setSortBy] = useState("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);
  const query = useDebounce(searchText.trim().toLowerCase(), 300);
  /** Change one URL parameter and keep the others: setParam("category", "Staples") */
  function setParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }
  const setCategory = (name) => setParam("category", name === "All" ? "" : name);
  const onClearSearch = () => setParam("q", "");
  if (isLoading) return <ProductGridSkeleton />;
  if (error) {
    return (
      <EmptyState
        icon="
📡
"
        tone="error"
        title="Could not load products"
        message={friendlyMessage(error)}
        action={error.isRetryable && <Button onClick={onRetry}>Try again</Button>}
      />
    );
  }
  // 1. Search + stock filter first, so category counts reflect what the user can actually see
  const searched = products
    .filter((p) => !query || `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(query))
    .filter((p) => !inStockOnly || inStock(p));
  // 2. Category chips with counts (derived)
  const categories = [
    { name: "All", count: searched.length },
    ...CATEGORIES.map((name) => ({ name, count: searched.filter((p) => p.category === name).length })),
  ];
  // 3. Category filter, then sort a COPY (filter already returns a new array)
  const visible = searched.filter((p) => category === "All" || p.category === category);
  if (SORTERS[sortBy]) visible.sort(SORTERS[sortBy]);
  return (
    <section>
      <div className="hero">
        <div>
          <h1>Groceries delivered in 15 minutes</h1>
          <p>Free delivery above ₹199 · New users get ₹50 off with <b>WELCOME50</b></p>
        </div>
        <span className="hero-emoji" aria-hidden="true">
🛵
</span>
      </div>
      <CategoryBar categories={categories} active={category} onChange={setCategory} />
      <CatalogToolbar
        resultCount={visible.length}
        query={searchText.trim()}
        onClearSearch={onClearSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        inStockOnly={inStockOnly}
        onInStockChange={setInStockOnly}
      />
      {visible.length === 0 ? (
        <EmptyState
          icon="
🔍
"
          title="No products found"
          message="Try another word, another category, or turn off 'In stock only'."
          action={<Button variant="secondary" onClick={() => { onClearSearch(); setCategory("All"); setInStockOnly(false); }}>Reset filters</Button>}
        />
      ) : (
        <ProductGrid products={visible} />
      )}
    </section>
  );
}
export default CatalogPage;
