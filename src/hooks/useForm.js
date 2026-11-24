import { useRef, useState } from "react";
/**
 * Reusable form logic for EVERY form in the app (checkout, add product, ...).
 *
 *   const form = useForm({ initialValues, validate, onSubmit, transform });
 *   <input name="phone" value={form.values.phone} onChange={form.handleChange} onBlur={form.handleBlur} />
 *   {form.errorFor("phone")}
 *
 * validate(values)  -> { field: "message" } (empty object = valid)
 * transform         -> { field: (raw) => cleaned } runs while the user types (e.g. digits only)
 * onSubmit(values, { setServerErrors, reset }) runs only when there are no errors
 */
export function useForm({ initialValues, validate, onSubmit, transform = {} }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});          // fields the user has visited
  const [submitted, setSubmitted] = useState(false);   // pressed submit at least once?
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({}); // messages sent back by the API
  const formRef = useRef(null);
  // Errors are DERIVED from the values on every render - never stored separately.
  const clientErrors = validate(values);
  const errors = { ...clientErrors, ...serverErrors };
  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    const raw = type === "checkbox" ? checked : value;
    const next = transform[name] ? transform[name](raw) : raw;
    setValues((prev) => ({ ...prev, [name]: next }));               // [name] = computed key
    setServerErrors(({ [name]: _old, ...rest }) => rest);            // typing clears the server's message
  }
  function handleBlur(event) {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }
  /** For inputs that do not send an event (OptionCards gives us just the id). */
  function setValue(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }
  /** Show a message only after the field was visited or the form was submitted. */
  function errorFor(name) {
    return touched[name] || submitted ? errors[name] : undefined;
  }
  function reset(nextValues = initialValues) {
    setValues(nextValues);
    setTouched({});
    setSubmitted(false);
    setServerErrors({});
  }
  async function handleSubmit(event) {
    event.preventDefault();                       // no page reload
    setSubmitted(true);
    const firstInvalid = Object.keys(clientErrors)[0];
    if (firstInvalid) {
      formRef.current?.elements[firstInvalid]?.focus?.();   // take the user to the first problem
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values, { setServerErrors, reset });
    } finally {
      setSubmitting(false);                       // runs on success AND on failure
    }
  }
  return { values, errors, touched, submitted, submitting, formRef,
           handleChange, handleBlur, handleSubmit, setValue, errorFor, reset, setServerErrors };
}
