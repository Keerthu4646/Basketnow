import TextField from "../../components/ui/TextField";
/**
 * Controlled address fields. Everything comes from the `form` object made by useForm():
 * values, handleChange, handleBlur and errorFor (shows a message only after blur or submit).
 * "Not serviceable" is now a validation rule (validateCheckout), so it appears like any other error.
 */
function AddressForm({ form, pincodeStatus }) {
  let pincodeHint;
  if (pincodeStatus.state === "checking") pincodeHint = "Checking delivery availability...";
  if (pincodeStatus.state === "ok") pincodeHint = `✓ We deliver to ${pincodeStatus.city}`;
  const field = (name) => ({
    name,
    value: form.values[name],
    onChange: form.handleChange,
    onBlur: form.handleBlur,
    error: form.errorFor(name),
  });
  return (
    <div className="form-grid">
      <TextField label="Full name" autoComplete="name" {...field("fullName")} />
      <TextField label="Mobile number" inputMode="numeric" autoComplete="tel"
                 hint="We will call this number for delivery" {...field("phone")} />
      <TextField label="House / flat no." {...field("house")} />
      <TextField label="Area / street" {...field("area")} />
      <TextField label="Landmark (optional)" {...field("landmark")} />
      <TextField label="Pincode" inputMode="numeric" hint={pincodeHint} {...field("pincode")}
                 error={form.errorFor("pincode") || (pincodeStatus.state === "error" ? pincodeStatus.message : undefined)} />
    </div>
  );
}
export default AddressForm;
