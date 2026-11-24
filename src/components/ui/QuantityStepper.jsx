/**
 * Controlled - + stepper. The parent owns `value`.
 * Going below `min` is not possible; the "-" button at min=0 lets the parent remove the item.
 */
function QuantityStepper({ value, min = 0, max, onChange, label = "item" }) {
  const atMax = value >= max;
  return (
    <div className="stepper" title={atMax ? `Maximum ${max} per order` : undefined}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={atMax} aria-label={`Increase ${label}`}>
        +
      </button>
    </div>
  );
}
export default QuantityStepper;