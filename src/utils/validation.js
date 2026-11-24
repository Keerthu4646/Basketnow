// Form validation rules for the checkout address form and the admin "Add product" form.
// Each function returns an errors object: { fieldName: "message" }. Empty object = valid.
import { COD_LIMIT } from "../data/config";
export function validateAddress(values) {
  const errors = {};
  const name = values.fullName.trim();
  if (name.length < 3) errors.fullName = "Enter your full name (at least 3 letters)";
  const phone = values.phone.trim();
  if (!phone) errors.phone = "Mobile number is required";
  else if (phone.length !== 10) errors.phone = `Mobile number must be 10 digits (you typed ${phone.length})`;
  else if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Indian mobile numbers start with 6, 7, 8 or 9";
  if (!values.house.trim()) errors.house = "House / flat number is required";
  if (!values.area.trim()) errors.area = "Area / street is required";
  if (!/^\d{6}$/.test(values.pincode.trim())) errors.pincode = "Enter a valid 6-digit pincode";
  return errors;
}
export function validateNewProduct(values) {
  const errors = {};
  const price = Number(values.price);
  const mrp = Number(values.mrp);
  const stock = Number(values.stock);
  if (values.name.trim().length < 3) errors.name = "Name must have at least 3 characters";
  if (!values.brand.trim()) errors.brand = "Brand is required";
  if (!values.variantLabel.trim()) errors.variantLabel = "Pack size is required, e.g. 500 g";
  if (!(price > 0)) errors.price = "Price must be greater than 0";
  if (!(mrp > 0)) errors.mrp = "MRP must be greater than 0";
  else if (mrp < price) errors.mrp = "MRP cannot be lower than the selling price";
  if (!Number.isInteger(stock) || stock < 0 || values.stock === "") errors.stock = "Stock must be a whole number, 0 or more";
  return errors;
}
// ---------- checkout: field rules + conditional + cross-field + async result ----------
/** INPUT HANDLING: keep only digits while the user types ("98765 43210" -> "9876543210"). */
export function onlyDigits(text, maxLength) {
  return text.replace(/\D/g, "").slice(0, maxLength);
}
/**
 * Everything the checkout form must satisfy.
 * context.pincodeStatus comes from the server check, context.grandTotal from the bill.
 */
export function validateCheckout(values, { pincodeStatus, grandTotal }) {
  const errors = validateAddress(values);
  if (!errors.pincode && pincodeStatus === "unserviceable") {
    errors.pincode = "Sorry, we do not deliver to this pincode yet";           // async rule (API answer)
  }
  if (values.paymentId === "upi" && !/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(values.upiId.trim())) {
    errors.upiId = "Enter a valid UPI ID, for example priya@okaxis";            // conditional rule
  }
  if (values.paymentId === "cod" && grandTotal > COD_LIMIT) {
    errors.paymentId = `Cash on Delivery is available only up to ₹${COD_LIMIT}`; // cross-field rule
  }
  if (values.instructions.length > 120) {
    errors.instructions = "Keep instructions under 120 characters";
  }
  return errors;
}
