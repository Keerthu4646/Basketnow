/** Category chips with live counts, e.g. "Staples (4)". Built from data, never hard-coded. */
function CategoryBar({ categories, active, onChange }) {
  return (
    <div className="chips" role="tablist" aria-label="Categories">
      {categories.map((c) => (
        <button
          key={c.name}
          role="tab"
          aria-selected={c.name === active}
          className={c.name === active ? "chip active" : "chip"}
          onClick={() => onChange(c.name)}
        >
          {c.name} <span className="chip-count">{c.count}</span>
        </button>
      ))}
    </div>
  );
}
export default CategoryBar;