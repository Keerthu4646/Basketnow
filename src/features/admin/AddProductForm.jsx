import { useState } from "react";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import { validateNewProduct } from "../../utils/validation";
import { CATEGORIES } from "../../data/products";
import { useForm } from "../../hooks/useForm";
import { friendlyMessage } from "../../api/client";
const EMPTY = { name: "", brand: "", category: CATEGORIES[0], image: "🛒", variantLabel: "", price: "", mrp: "", stock: "" };
const IMAGES = ["🛒", "🥕", "🍇", "🥭", "🧈", "🍪", "🧃", "🧼", "🥜", "🍯"];
/** Add a new product with one pack size. The same useForm hook as the checkout, a different form. */
function AddProductForm({ onAdd }) {
  const [success, setSuccess] = useState("");
  const [failure, setFailure] = useState("");
  const form = useForm({
    initialValues: EMPTY,
    validate: validateNewProduct,
    onSubmit: async (values, { reset, setServerErrors }) => {
      setFailure("");
      try {
        const product = await onAdd(values);              // POST /api/products - the server builds the product
        setSuccess(`"${product.name}" added. It is now visible in the shop.`);
        reset();
      } catch (err) {
        if (err.fields) setServerErrors(err.fields);      // the server's rule, shown under the field
        setFailure(friendlyMessage(err));
      }
    },
  });
  const field = (name) => ({
    name,
    value: form.values[name],
    onChange: (e) => { form.handleChange(e); setSuccess(""); },
    onBlur: form.handleBlur,
    error: form.errorFor(name),
  });
  return (
    <form className="panel" ref={form.formRef} onSubmit={form.handleSubmit} noValidate>
      <h2>Add a product</h2>
      <div className="form-grid">
        <TextField label="Product name" {...field("name")} />
        <TextField label="Brand" {...field("brand")} />
        <div className="field">
          <label htmlFor="field-category">Category</label>
          <select id="field-category" name="category" value={form.values.category} onChange={form.handleChange}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="field-image">Image</label>
          <select id="field-image" name="image" value={form.values.image} onChange={form.handleChange}>
            {IMAGES.map((img) => <option key={img} value={img}>{img}</option>)}
          </select>
        </div>
        <TextField label="Pack size" placeholder="e.g. 500 g" {...field("variantLabel")} />
        <TextField label="Selling price (₹)" type="number" min="1" {...field("price")} />
        <TextField label="MRP (₹)" type="number" min="1" {...field("mrp")} />
        <TextField label="Stock (units)" type="number" min="0" {...field("stock")} />
      </div>
      {success && <p className="info-box" role="status">{success}</p>}
      {failure && <p className="error-banner" role="alert">{failure}</p>}
      <Button type="submit" isLoading={form.submitting}>Add product</Button>
    </form>
  );
}
export default AddProductForm;
