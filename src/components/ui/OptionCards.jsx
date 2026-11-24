/**
 * A group of selectable cards that behaves like radio buttons.
 * Used for delivery slots AND payment methods (one component, two uses).
 * options: [{ id, label, detail, meta }]   disabledIds: { [id]: "reason" }
 */
function OptionCards({ name, options, value, onChange, disabledIds = {} }) {
  return (
    <div className="option-cards" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const reason = disabledIds[option.id];
        const selected = option.id === value;
        return (
          <label key={option.id} className={["option-card", selected ? "selected" : "", reason ? "disabled" : ""].join(" ")}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={selected}
              disabled={Boolean(reason)}
              onChange={() => onChange(option.id)}
            />
            <span className="option-text">
              <b>{option.label}</b>
              <small>{reason || option.detail}</small>
            </span>
            {option.meta && <span className="option-meta">{option.meta}</span>}
          </label>
        );
      })}
    </div>
  );
}
export default OptionCards;