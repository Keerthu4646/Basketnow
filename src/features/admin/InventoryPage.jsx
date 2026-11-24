import { useState } from "react";
import AddProductForm from "./AddProductForm";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { formatPrice, discountPercent } from "../../utils/format";
import { LOW_STOCK_LIMIT } from "../../data/config";
import { useShop } from "../../context/ShopContext";
function stockBadge(stock) {
  if (stock === 0) return <Badge tone="red">Out of stock</Badge>;
  if (stock <= LOW_STOCK_LIMIT) return <Badge tone="yellow">Low stock</Badge>;
  return <Badge tone="green">In stock</Badge>;
}
/**
 * Store-manager view. Every change goes to ShopContext (products state), so the shop
 * updates instantly - the same single source of truth feeds both screens.
 */
function InventoryPage() {
  const { products, isLoading, updateStock: onUpdateStock, addProduct: onAddProduct, deleteProduct: onDeleteProduct, inventoryError } = useShop();
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [toDelete, setToDelete] = useState(null); // product waiting for confirmation
  if (isLoading) return <p className="muted">Loading inventory...</p>;
  // One table row per variant (pack size)
  const rows = products.flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })));
  const q = query.trim().toLowerCase();
  const visible = rows
    .filter(({ product }) => !q || `${product.name} ${product.brand}`.toLowerCase().includes(q))
    .filter(({ variant }) => !lowOnly || variant.stock <= LOW_STOCK_LIMIT);
  const outCount = rows.filter((r) => r.variant.stock === 0).length;
  const lowCount = rows.filter((r) => r.variant.stock > 0 && r.variant.stock <= LOW_STOCK_LIMIT).length;
  const stockValue = rows.reduce((sum, r) => sum + r.variant.price * r.variant.stock, 0);
  /** Download the catalogue as a .json file (object -> JSON text -> file). */
  function exportJson() {
    const text = JSON.stringify(products, null, 2);
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `basketnow-products-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function handleStockInput(variantId, raw) {
    const n = Math.max(0, Math.min(999, Math.floor(Number(raw) || 0)));
    onUpdateStock(variantId, n);
  }
  return (
    <section>
      <div className="section-head">
        <h1>Inventory</h1>
        <Button variant="secondary" size="sm" onClick={exportJson}>⬇ Export JSON</Button>
      </div>
      {inventoryError && <p className="error-banner" role="alert">{inventoryError}</p>}
      <div className="kpis">
        <div className="kpi"><small>Products</small><b>{products.length}</b></div>
        <div className="kpi"><small>Pack sizes (SKUs)</small><b>{rows.length}</b></div>
        <div className="kpi warn"><small>Low stock</small><b>{lowCount}</b></div>
        <div className="kpi bad"><small>Out of stock</small><b>{outCount}</b></div>
        <div className="kpi"><small>Stock value</small><b>{formatPrice(stockValue)}</b></div>
      </div>
      <div className="toolbar">
        <input className="input" type="search" placeholder="Filter by product or brand" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter inventory" />
        <label className="toggle">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low / out of stock only
        </label>
      </div>
      {visible.length === 0 ? (
        <EmptyState icon="
📦
" title="No matching SKUs" message="Change the filter to see more rows." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Pack</th><th>Price</th><th>Discount</th><th>Stock</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {visible.map(({ product, variant }) => (
                <tr key={variant.id} className={variant.stock === 0 ? "row-out" : ""}>
                  <td><span aria-hidden="true">{product.image}</span> <b>{product.name}</b><br /><small className="muted">{product.brand} · {product.category}</small></td>
                  <td>{variant.label}</td>
                  <td>{formatPrice(variant.price)}</td>
                  <td>{discountPercent(variant.price, variant.mrp)}%</td>
                  <td>
                    <input
                      className="stock-input"
                      type="number"
                      min="0"
                      max="999"
                      value={variant.stock}
                      onChange={(e) => handleStockInput(variant.id, e.target.value)}
                      aria-label={`Stock for ${product.name} ${variant.label}`}
                    />
                  </td>
                  <td>{stockBadge(variant.stock)}</td>
                  <td><Button size="sm" variant="ghost" onClick={() => setToDelete(product)}>Delete</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddProductForm onAdd={onAddProduct} />
      <Modal
        isOpen={toDelete !== null}
        title="Delete product?"
        onClose={() => setToDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onDeleteProduct(toDelete.id); setToDelete(null); }}>Delete</Button>
          </>
        }
      >
        {toDelete && (
          <p>
            <b>{toDelete.image} {toDelete.name}</b> and all its pack sizes will be removed from the shop.
            Customers who have it in their cart will no longer see it.
          </p>
        )}
      </Modal>
    </section>
  );
}
export default InventoryPage;