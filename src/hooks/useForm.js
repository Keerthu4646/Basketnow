/**
 * TODO BN-802 - useForm: one reusable hook for every form (checkout, add product).
 * useForm({ initialValues, validate, onSubmit, transform })
 * State: values, touched, submitted, submitting, serverErrors
 * Return: values, errors, isValid, submitting, formRef, handleChange, handleBlur, handleSubmit,
 *         setValue, setServerErrors, errorFor(name), reset
 * - handleChange works for text, number, select, textarea and checkbox (uses e.target.name)
 * - transform[name] cleans the value while the user types (BN-803), e.g. digits only
 * - errorFor(name) shows an error only after the field is touched or the form was submitted
 * - handleSubmit: preventDefault, mark submitted, focus the first invalid field, else await onSubmit
 */
export function useForm({ initialValues }) {
  return { values: initialValues };
}
