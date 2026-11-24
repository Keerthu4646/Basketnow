/** Result count, active search, sort dropdown and the in-stock toggle. */
function CatalogToolbar({ resultCount, query, onClearSearch, sortBy, onSortChange, inStockOnly, onInStockChange }) {
  return (
    <div className="toolbar">
      <p className="result-count">
        {resultCount} {resultCount === 1 ? "product" : "products"}
        {query && (
          <>
            {" "}for <b>"{query}"</b>{" "}
            <button className="link" onClick={onClearSearch}>Clear search</button>
          </>
        )}
      </p>
      <div className="toolbar-controls">
        <label className="toggle">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => onInStockChange(e.target.checked)} />
          In stock only
        </label>
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} aria-label="Sort products">
          <option value="relevance">Sort: Relevance</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="discount">Discount: High to Low</option>
          <option value="rating">Customer Rating</option>
        </select>
      </div>
    </div>
  );
}
export default CatalogToolbar;
