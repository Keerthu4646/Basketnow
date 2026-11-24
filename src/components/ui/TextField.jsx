/**
 * Labelled input with an error message. Fully controlled: pass value + onChange.
 * `hint` shows under the field when there is no error. `multiline` renders a <textarea>.
 */
function TextField({ label, name, error, hint, multiline = false, ...inputProps }) {
  const id = `field-${name}`;
  const Input = multiline ? "textarea" : "input";
  return (
    <div className={error ? "field has-error" : "field"}>
      <label htmlFor={id}>{label}</label>
      <Input id={id} name={name} aria-invalid={Boolean(error)} {...inputProps} />
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
export default TextField;