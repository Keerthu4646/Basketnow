import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AddressForm from "./AddressForm";
import OptionCards from "../../components/ui/OptionCards";
import TextField from "../../components/ui/TextField";
import BillDetails from "../cart/BillDetails";
import Button from "../../components/ui/Button";
import { checkPincode } from "../../api/api";
import { friendlyMessage } from "../../api/client";
import { onlyDigits, validateCheckout } from "../../utils/validation";
import { getBill } from "../../utils/pricing";
import { formatPrice, pluralize } from "../../utils/format";
import { DELIVERY_SLOTS, PAYMENT_METHODS, COD_LIMIT } from "../../data/config";
import { useCart } from "../../context/CartContext";
import { useShop } from "../../context/ShopContext";
import { useForm } from "../../hooks/useForm";
const EMPTY_ADDRESS = { fullName: "", phone: "", house: "", area: "", landmark: "", pincode: "" };
/**
 * Checkout: ONE form object (useForm) holds the address, the slot and the payment choice.
 * Cart data comes from CartContext, the saved address and placeOrder() from ShopContext.
 */
function CheckoutPage() {
  const { lines, coupon, couponCode, clearCart } = useCart();
  const { hasPreviousOrders, savedAddress, placeOrder, isLoading } = useShop();
  const navigate = useNavigate();
  const orderPlaced = useRef(false);
  // ONE key for this checkout: every retry sends the same key, so the server never creates two orders
  const idempotencyKey = useRef(`checkout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [pincodeStatus, setPincodeStatus] = useState({ state: "idle" });
  const [placeError, setPlaceError] = useState("");
  const errorRef = useRef(null);
  const billFor = (formValues) => {
    const chosenSlot = DELIVERY_SLOTS.find((s) => s.id === formValues.slotId);
    return getBill({ lines, coupon, hasPreviousOrders, slotFee: chosenSlot.fee });
  };
  const form = useForm({
    initialValues: {
      ...EMPTY_ADDRESS, ...savedAddress, saveAddress: true, slotId: "express", paymentId: "upi", upiId: "", instructions: "",
    },
    validate: (formValues) => validateCheckout(formValues, { pincodeStatus: pincodeStatus.state, grandTotal: billFor(formValues).grandTotal }),
    transform: { phone: (v) => onlyDigits(v, 10), pincode: (v) => onlyDigits(v, 6) },   // clean while typing
    onSubmit: submitOrder,
  });
  const { values } = form;
  const bill = billFor(values);
  const codBlocked = bill.grandTotal > COD_LIMIT;
  // Check serviceability whenever a complete 6-digit pincode is entered
  const pincode = values.pincode.trim();
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus({ state: "idle" });
      return undefined;
    }
    const controller = new AbortController();
    setPincodeStatus({ state: "checking" });
    checkPincode(pincode, { signal: controller.signal })
      .then((res) => setPincodeStatus(res.serviceable ? { state: "ok", city: res.city } : { state: "unserviceable" }))
      .catch((err) => {
        if (err.code !== "CANCELLED") setPincodeStatus({ state: "error", message: friendlyMessage(err) });
      });
    return () => controller.abort();       // the customer typed again: cancel the old check
  }, [pincode]);
  // If COD becomes unavailable (cart grew), switch away from it
  useEffect(() => {
    if (codBlocked && values.paymentId === "cod") form.setValue("paymentId", "upi");
  }, [codBlocked, values.paymentId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Bring the error banner into view when an order fails
  useEffect(() => {
    if (placeError && errorRef.current) errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [placeError]);
  // Opened directly (/checkout in a new tab): wait for the products before deciding the cart is empty
  if (isLoading) return <p className="muted">Loading your cart...</p>;
  // Route guard: an empty cart cannot be checked out -> go to the shop (but not right after ordering)
  if (lines.length === 0) {
    return orderPlaced.current ? null : <Navigate to="/" replace />;
  }
  async function submitOrder(formValues, { setServerErrors }) {
    setPlaceError("");
    if (pincodeStatus.state !== "ok") {
      setPlaceError(pincodeStatus.state === "checking" ? "Still checking your pincode, please wait a moment." : "We could not verify your pincode. Please try again.");
      return;
    }
    const { fullName, phone, house, area, landmark, pincode: pin } = formValues;
    // The request body (it becomes JSON): ids and choices only - NO prices. The server calculates the bill.
    const orderRequest = {
      items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
      couponCode,
      address: { fullName: fullName.trim(), phone, house: house.trim(), area: area.trim(), landmark: landmark.trim(), pincode: pin },
      slotId: formValues.slotId,
      paymentId: formValues.paymentId,
      upiId: formValues.paymentId === "upi" ? formValues.upiId.trim() : "",
      instructions: formValues.instructions.trim(),
    };
    try {
      const order = await placeOrder(orderRequest, { saveAddress: formValues.saveAddress, idempotencyKey: idempotencyKey.current });
      orderPlaced.current = true;
      // replace: the Back button must NOT return to a filled checkout form; state: a note for the next page
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
      clearCart();
    } catch (err) {
      // Keep everything the customer typed. Show the right message for each kind of failure.
      if (err.code === "VALIDATION_ERROR") {
        setServerErrors(err.fields);                                   // messages appear under the fields
        setPlaceError(err.message);
      } else if (err.code === "OUT_OF_STOCK") {
        const soldOut = err.details.items.map((i) => `${i.name} (only ${i.available} left)`).join(", ");
        setPlaceError(`Some items just sold out: ${soldOut}. Please update your cart.`);
      } else {
        setPlaceError(friendlyMessage(err));
      }
    }
  }
  const slotOptions = DELIVERY_SLOTS.map((s) => ({ ...s, meta: s.fee ? `+ ${formatPrice(s.fee)}` : "FREE" }));
  return (
    <form className="checkout" ref={form.formRef} onSubmit={form.handleSubmit} noValidate>
      <div className="checkout-main">
        <Link className="link" to="/">← Continue shopping</Link>
        <h1>Checkout</h1>
        <section className="panel">
          <h2><span className="step-no">1</span> Delivery address</h2>
          <AddressForm form={form} pincodeStatus={pincodeStatus} />
          <label className="toggle">
            <input type="checkbox" name="saveAddress" checked={values.saveAddress} onChange={form.handleChange} />
            Save this address for next time
          </label>
        </section>
        <section className="panel">
          <h2><span className="step-no">2</span> Delivery slot</h2>
          <OptionCards name="slot" options={slotOptions} value={values.slotId} onChange={(id) => form.setValue("slotId", id)} />
        </section>
        <section className="panel">
          <h2><span className="step-no">3</span> Payment method</h2>
          <OptionCards
            name="payment"
            options={PAYMENT_METHODS}
            value={values.paymentId}
            onChange={(id) => form.setValue("paymentId", id)}
            disabledIds={codBlocked ? { cod: `Not available for orders above ${formatPrice(COD_LIMIT)}` } : {}}
          />
          {/* CONDITIONAL FIELD: exists (and is validated) only when UPI is selected */}
          {values.paymentId === "upi" && (
            <TextField label="UPI ID" name="upiId" placeholder="priya@okaxis" autoComplete="off"
                       value={values.upiId} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errorFor("upiId")} />
          )}
          {form.errorFor("paymentId") && <p className="field-error">{form.errorFor("paymentId")}</p>}
        </section>
        <section className="panel">
          <h2><span className="step-no">4</span> Instructions for the rider (optional)</h2>
          <TextField label="Instructions" name="instructions" multiline rows={2} maxLength={120}
                     placeholder="Please don't ring the bell, baby sleeping" value={values.instructions}
                     onChange={form.handleChange} onBlur={form.handleBlur} error={form.errorFor("instructions")}
                     hint={`${values.instructions.length}/120 characters`} />
        </section>
      </div>
      <aside className="checkout-side">
        <div className="panel sticky">
          <h2>Order summary</h2>
          <p className="muted">{pluralize(bill.itemCount, "item")}</p>
          <ul className="summary-lines">
            {lines.map((l) => (
              <li key={l.variantId}>
                <span>{l.image} {l.name} <small>({l.variantLabel}) × {l.qty}</small></span>
                <span>{formatPrice(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          {couponCode && bill.couponResult && !bill.couponResult.ok && (
            <p className="warning-box">{couponCode} not applied: {bill.couponResult.reason}</p>
          )}
          <BillDetails bill={bill} couponCode={couponCode} />
          {placeError && (
            <div className="error-banner" role="alert" ref={errorRef}>
              <b>Order not placed.</b> {placeError}
            </div>
          )}
          <Button type="submit" size="lg" fullWidth isLoading={form.submitting}>
            {form.submitting ? "Placing order..." : placeError ? "Retry: Place order" : `Place order · ${formatPrice(bill.grandTotal)}`}
          </Button>
          <p className="fine-print">By placing the order you agree to our terms. Prices include GST.</p>
        </div>
      </aside>
    </form>
  );
}
export default CheckoutPage;