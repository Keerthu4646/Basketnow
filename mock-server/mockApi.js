// BasketNow REST API (mock server).
// It runs inside the Vite dev server: `npm run dev` starts the app AND this API on the same address,
// so the browser can call http://localhost:5173/api/... with fetch or axios.
// Data lives in memory: restarting `npm run dev` (or POST /api/reset) brings back the original catalogue.
//
//   GET    /api/products                 all products (optional ?q= and ?category=)
//   GET    /api/products/:id             one product                          404 if unknown
//   POST   /api/products                 add a product                        201 / 400
//   DELETE /api/products/:id             delete a product                     204 / 404
//   PATCH  /api/variants/:id             change stock { stock }               200 / 400 / 404
//   GET    /api/pincodes/:pincode        can we deliver here?                 200 / 400
//   GET    /api/orders                   all orders, newest first
//   GET    /api/orders/:id               one order                            404 if unknown
//   POST   /api/orders                   place an order                       201 / 400 / 409
//   PATCH  /api/orders/:id/cancel        cancel before "Out for delivery"     200 / 404 / 409
//   POST   /api/reset                    restore the original demo data
//
// Developer headers: "X-Simulate-Error: 1" -> 503, "X-Simulate-Delay: 2000" -> extra wait in ms.
// "Idempotency-Key" on POST /api/orders: the same key twice returns the same order (no duplicates).

import { SEED_PRODUCTS } from "../src/data/products.js";
import { COUPONS } from "../src/data/coupons.js";
import {
  CANCELLABLE_UNTIL, COD_LIMIT, DELIVERY_FEE, DELIVERY_SLOTS, FREE_DELIVERY_THRESHOLD, HANDLING_FEE,
  PAYMENT_METHODS, SERVICEABLE_PREFIXES, TRACKING_STEPS,
} from "../src/data/config.js";

// ---------------------------------------------------------------- in-memory database
const db = { products: [], orders: [], ordersByKey: new Map(), nextOrderNo: 10001 };

function resetDb() {
  db.products = JSON.parse(JSON.stringify(SEED_PRODUCTS)); // deep copy of the seed catalogue
  db.orders = [];
  db.ordersByKey = new Map();
  db.nextOrderNo = 10001;
}
resetDb();

// ---------------------------------------------------------------- helpers
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(body === undefined ? "" : JSON.stringify(body));
}

function sendError(res, status, code, message, extra = {}) {
  send(res, status, { error: { code, message, ...extra } });
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let text = "";
    req.on("data", (chunk) => (text += chunk));
    req.on("end", () => {
      if (!text) return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch {
        resolve(null); // broken JSON
      }
    });
  });
}

function findVariant(variantId) {
  for (const product of db.products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

function trackingOf(order) {
  if (order.cancelledAt) return { stepIndex: -1, canCancel: false, label: "Cancelled" };
  const elapsed = (Date.now() - order.createdAt) / 1000;
  let stepIndex = 0;
  TRACKING_STEPS.forEach((step, i) => { if (elapsed >= step.at) stepIndex = i; });
  const limit = TRACKING_STEPS.findIndex((s) => s.id === CANCELLABLE_UNTIL);
  return { stepIndex, canCancel: stepIndex < limit, label: TRACKING_STEPS[stepIndex].label };
}

// ---------------------------------------------------------------- business rules (server copy)
function couponCheck(coupon, lines, itemTotal, hasPreviousOrders) {
  if (coupon.firstOrderOnly && hasPreviousOrders) return { ok: false, reason: "Valid on your first order only" };
  if (itemTotal < coupon.minOrder) return { ok: false, reason: `Add items worth ₹${coupon.minOrder - itemTotal} more to use this` };
  const eligible = coupon.category
    ? lines.filter((l) => l.category === coupon.category).reduce((s, l) => s + l.price * l.qty, 0)
    : itemTotal;
  if (eligible === 0) return { ok: false, reason: `Add ${coupon.category} items to use this` };
  let discount = coupon.type === "flat" ? coupon.value : Math.round((eligible * coupon.value) / 100);
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return { ok: true, discount: Math.min(discount, eligible) };
}

function billFor(lines, couponCode, slotFee) {
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const itemTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const mrpTotal = lines.reduce((s, l) => s + l.mrp * l.qty, 0);
  const hasPreviousOrders = db.orders.some((o) => !o.cancelledAt);
  const coupon = COUPONS.find((c) => c.code === couponCode);
  const couponResult = coupon ? couponCheck(coupon, lines, itemTotal, hasPreviousOrders) : null;
  const couponDiscount = couponResult?.ok ? couponResult.discount : 0;
  const deliveryFee = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return {
    itemCount, itemTotal, mrpTotal, productSavings: mrpTotal - itemTotal,
    couponResult, couponDiscount, deliveryFee, handlingFee: HANDLING_FEE, slotFee,
    grandTotal: itemTotal - couponDiscount + deliveryFee + HANDLING_FEE + slotFee,
    amountForFreeDelivery: Math.max(0, FREE_DELIVERY_THRESHOLD - itemTotal),
    totalSavings: mrpTotal - itemTotal + couponDiscount + (deliveryFee === 0 ? DELIVERY_FEE : 0),
  };
}

function validateOrder(body, grandTotal) {
  const errors = {};
  const a = body.address || {};
  const text = (v) => String(v ?? "").trim();
  if (text(a.fullName).length < 3) errors.fullName = "Enter your full name (at least 3 letters)";
  if (!/^[6-9]\d{9}$/.test(text(a.phone))) errors.phone = "Enter a valid 10-digit mobile number starting with 6-9";
  if (!text(a.house)) errors.house = "House / flat number is required";
  if (!text(a.area)) errors.area = "Area / street is required";
  if (!/^\d{6}$/.test(text(a.pincode))) errors.pincode = "Enter a valid 6-digit pincode";
  else if (!SERVICEABLE_PREFIXES[text(a.pincode).slice(0, 3)]) errors.pincode = "Sorry, we do not deliver to this pincode yet";
  if (!DELIVERY_SLOTS.some((s) => s.id === body.slotId)) errors.slotId = "Choose a delivery slot";
  if (!PAYMENT_METHODS.some((p) => p.id === body.paymentId)) errors.paymentId = "Choose a payment method";
  else if (body.paymentId === "upi" && !/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(text(body.upiId))) errors.upiId = "Enter a valid UPI ID, for example priya@okaxis";
  else if (body.paymentId === "cod" && grandTotal > COD_LIMIT) errors.paymentId = `Cash on Delivery is available only up to ₹${COD_LIMIT}`;
  if (text(body.instructions).length > 120) errors.instructions = "Keep instructions under 120 characters";
  return errors;
}

function validateProduct(v) {
  const errors = {};
  const price = Number(v.price);
  const mrp = Number(v.mrp);
  const stock = Number(v.stock);
  if (String(v.name ?? "").trim().length < 3) errors.name = "Name must have at least 3 characters";
  if (!String(v.brand ?? "").trim()) errors.brand = "Brand is required";
  if (!String(v.variantLabel ?? "").trim()) errors.variantLabel = "Pack size is required, e.g. 500 g";
  if (!(price > 0)) errors.price = "Price must be greater than 0";
  if (!(mrp > 0)) errors.mrp = "MRP must be greater than 0";
  else if (mrp < price) errors.mrp = "MRP cannot be lower than the selling price";
  if (!Number.isInteger(stock) || stock < 0 || v.stock === "") errors.stock = "Stock must be a whole number, 0 or more";
  return errors;
}

// ---------------------------------------------------------------- routes
const routes = [
  ["GET", /^\/api\/products$/, ({ url }, res) => {
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const category = url.searchParams.get("category");
    const items = db.products
      .filter((p) => !q || `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q))
      .filter((p) => !category || p.category === category);
    send(res, 200, items);
  }],

  ["GET", /^\/api\/products\/([^/]+)$/, ({ params }, res) => {
    const product = db.products.find((p) => p.id === params[0]);
    if (!product) return sendError(res, 404, "PRODUCT_NOT_FOUND", `Product ${params[0]} does not exist`);
    send(res, 200, product);
  }],

  ["POST", /^\/api\/products$/, ({ body }, res) => {
    const fields = validateProduct(body);
    if (Object.keys(fields).length) return sendError(res, 400, "VALIDATION_ERROR", "Please correct the highlighted fields", { fields });
    const id = `p${Date.now()}`;
    const product = {
      id, name: body.name.trim(), brand: body.brand.trim(), category: body.category, image: body.image || "🛒",
      rating: 4.0, tags: ["new"],
      variants: [{ id: `${id}-v1`, label: body.variantLabel.trim(), price: Number(body.price), mrp: Number(body.mrp), stock: Number(body.stock) }],
    };
    db.products.unshift(product);
    send(res, 201, product);
  }],

  ["DELETE", /^\/api\/products\/([^/]+)$/, ({ params }, res) => {
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== params[0]);
    if (db.products.length === before) return sendError(res, 404, "PRODUCT_NOT_FOUND", `Product ${params[0]} does not exist`);
    send(res, 204);
  }],

  ["PATCH", /^\/api\/variants\/([^/]+)$/, ({ params, body }, res) => {
    const found = findVariant(params[0]);
    if (!found) return sendError(res, 404, "VARIANT_NOT_FOUND", `Pack size ${params[0]} does not exist`);
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 999) {
      return sendError(res, 400, "VALIDATION_ERROR", "Stock must be a whole number from 0 to 999", { fields: { stock: "0 to 999" } });
    }
    found.variant.stock = stock;
    send(res, 200, { variantId: found.variant.id, stock });
  }],

  ["GET", /^\/api\/pincodes\/([^/]+)$/, ({ params }, res) => {
    const pincode = params[0];
    if (!/^\d{6}$/.test(pincode)) return sendError(res, 400, "INVALID_PINCODE", "Pincode must be exactly 6 digits");
    const city = SERVICEABLE_PREFIXES[pincode.slice(0, 3)] || null;
    send(res, 200, { pincode, serviceable: Boolean(city), city });
  }],

  ["GET", /^\/api\/orders$/, (_req, res) => send(res, 200, db.orders)],

  ["GET", /^\/api\/orders\/([^/]+)$/, ({ params }, res) => {
    const order = db.orders.find((o) => o.id === params[0]);
    if (!order) return sendError(res, 404, "ORDER_NOT_FOUND", `Order ${params[0]} does not exist`);
    send(res, 200, order);
  }],

  ["POST", /^\/api\/orders$/, ({ body, headers }, res) => {
    const key = headers["idempotency-key"];
    if (key && db.ordersByKey.has(key)) return send(res, 200, db.ordersByKey.get(key)); // same key -> same order

    // Build the lines with OUR prices. Prices sent by the browser are ignored.
    const lines = [];
    for (const item of Array.isArray(body.items) ? body.items : []) {
      const found = findVariant(item.variantId);
      if (!found || !Number.isInteger(item.qty) || item.qty < 1) {
        return sendError(res, 400, "INVALID_ITEMS", "Your cart has items that no longer exist");
      }
      const { product, variant } = found;
      lines.push({ variantId: variant.id, productId: product.id, name: product.name, image: product.image,
        category: product.category, variantLabel: variant.label, price: variant.price, mrp: variant.mrp, qty: item.qty });
    }
    if (lines.length === 0) return sendError(res, 400, "EMPTY_CART", "Your cart is empty");

    const slot = DELIVERY_SLOTS.find((s) => s.id === body.slotId);
    const bill = billFor(lines, body.couponCode, slot ? slot.fee : 0);
    const fields = validateOrder(body, bill.grandTotal);
    if (Object.keys(fields).length) return sendError(res, 400, "VALIDATION_ERROR", "Please correct the highlighted fields", { fields });

    const soldOut = lines
      .map((l) => ({ variantId: l.variantId, name: l.name, requested: l.qty, available: findVariant(l.variantId).variant.stock }))
      .filter((l) => l.requested > l.available);
    if (soldOut.length) return sendError(res, 409, "OUT_OF_STOCK", "Some items just went out of stock", { items: soldOut });

    lines.forEach((l) => { findVariant(l.variantId).variant.stock -= l.qty; }); // reserve stock
    const a = body.address;
    const order = {
      id: `BN${db.nextOrderNo++}`,
      createdAt: Date.now(),
      lines: lines.map(({ variantId, productId, name, image, variantLabel, price, qty }) => ({ variantId, productId, name, image, variantLabel, price, qty })),
      bill,
      couponCode: bill.couponDiscount > 0 ? body.couponCode : "",
      address: { fullName: a.fullName.trim(), phone: a.phone.trim(), house: a.house.trim(), area: a.area.trim(), landmark: (a.landmark || "").trim(), pincode: a.pincode.trim() },
      city: SERVICEABLE_PREFIXES[a.pincode.trim().slice(0, 3)],
      slotLabel: `${slot.label} · ${slot.detail}`,
      paymentLabel: PAYMENT_METHODS.find((p) => p.id === body.paymentId).label,
      instructions: String(body.instructions || "").trim(),
      cancelledAt: null,
    };
    db.orders.unshift(order);
    if (key) db.ordersByKey.set(key, order);
    send(res, 201, order);
  }],

  ["PATCH", /^\/api\/orders\/([^/]+)\/cancel$/, ({ params }, res) => {
    const order = db.orders.find((o) => o.id === params[0]);
    if (!order) return sendError(res, 404, "ORDER_NOT_FOUND", `Order ${params[0]} does not exist`);
    if (order.cancelledAt) return sendError(res, 409, "CANNOT_CANCEL", "This order is already cancelled");
    const info = trackingOf(order);
    if (!info.canCancel) return sendError(res, 409, "CANNOT_CANCEL", `This order is already "${info.label}" and cannot be cancelled`);
    order.cancelledAt = Date.now();
    order.lines.forEach((l) => { const found = findVariant(l.variantId); if (found) found.variant.stock += l.qty; }); // return stock
    send(res, 200, order);
  }],

  ["POST", /^\/api\/reset$/, (_req, res) => { resetDb(); send(res, 200, { ok: true }); }],
];

// ---------------------------------------------------------------- request handler (Node / Vite middleware)
export async function handleApi(req, res, next) {
  if (!req.url.startsWith("/api/")) return next();
  const started = Date.now();
  const url = new URL(req.url, "http://localhost");
  const headers = req.headers;

  const route = routes.find(([method, pattern]) => method === req.method && pattern.test(url.pathname));
  const finish = () => console.log(`[api] ${req.method} ${url.pathname}${url.search} -> ${res.statusCode} (${Date.now() - started} ms)`);
  res.on("finish", finish);
  res.setHeader("X-Request-Id", headers["x-request-id"] || "-");

  if (!route) return sendError(res, 404, "NOT_FOUND", `No API route for ${req.method} ${url.pathname}`);

  // Network-like behaviour: every call takes a moment; the catalogue takes a bit longer.
  const extra = Math.min(Number(headers["x-simulate-delay"]) || 0, 5000);
  await wait((url.pathname === "/api/products" ? 700 : 250) + extra);
  if (headers["x-simulate-error"] === "1" && url.pathname !== "/api/reset") {
    return sendError(res, 503, "SERVICE_UNAVAILABLE", "BasketNow is busy right now. Please try again.");
  }

  const body = ["POST", "PATCH"].includes(req.method) ? await readJsonBody(req) : {};
  if (body === null) return sendError(res, 400, "BAD_JSON", "The request body is not valid JSON");

  const params = url.pathname.match(route[1]).slice(1).map(decodeURIComponent);
  try {
    route[2]({ url, params, body, headers }, res);
  } catch (error) {
    console.error(error);
    sendError(res, 500, "INTERNAL_ERROR", "Something went wrong on our side");
  }
}

/** Vite plugin: adds the API to the dev server, so `npm run dev` runs app + API together. */
export function mockApi() {
  return {
    name: "basketnow-mock-api",
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
  };
}
