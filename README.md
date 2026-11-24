# BasketNow: Quick-Commerce Web App

BasketNow delivers groceries in 15 minutes in Hyderabad, Kadapa, Nellore and Visakhapatnam.
This repository is its customer web app and the store manager's inventory screen, built with **React 19 + Vite**.

The full requirements, tickets, acceptance criteria and test cases are in the **BasketNow Project Brief (PDF)**.
Read it before writing code.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (the mock REST API runs inside the same dev server)
npm run build      # must pass before every pull request
```

Node.js 20.19+ or 22.12+ is required.

## What is provided vs. what you build

| Provided (do not change without a reason) | You build |
|---|---|
| `src/data/` catalogue, coupons and business rules (`config.js`) | Every component in `src/components/` and `src/features/` |
| `src/api/api.js` in-browser mock backend (replaced by real HTTP calls in BN-805) | The hooks in `src/hooks/` |
| `src/utils/` pricing, validation, tracking and format helpers | `src/App.jsx`, `src/context/`, `src/api/client.js` |
| `src/styles.css` complete design system: you never write CSS | |
| `mock-server/mockApi.js` REST API served by Vite at `/api/...` | |

Every unfinished file starts with a comment: the ticket ID, the props or return value, the behaviour required and
the CSS classes to use. Yellow dashed boxes on screen show what is still to do; delete the `.todo` styles at the end.

## Tickets → files

| Ticket | Title | Files |
|---|---|---|
| BN-101 | Project setup and repository | whole repo |
| BN-102 | App shell: header, tabs, footer, navigation | `components/layout/*`, `App.jsx` |
| BN-701 | Design-system components | `components/ui/*` |
| BN-201 | Load catalogue: skeleton, error, retry | `App.jsx`, `CatalogPage.jsx`, `ProductGrid.jsx` |
| BN-202 | Product card with pack sizes and stepper | `ProductCard.jsx`, `ProductGrid.jsx` |
| BN-203 | Category chips with live counts | `CategoryBar.jsx`, `CatalogPage.jsx` |
| BN-204 | Debounced search and empty state | `useDebounce.js`, `CatalogPage.jsx`, `Header.jsx` |
| BN-205 | Sort and in-stock filter | `CatalogToolbar.jsx`, `CatalogPage.jsx` |
| BN-301 | Cart state and persistence | `useLocalStorage.js`, `App.jsx` |
| BN-302 | Cart drawer | `CartDrawer.jsx`, `CartLine.jsx` |
| BN-303 | Bill details and free-delivery progress | `BillDetails.jsx`, `FreeDeliveryProgress.jsx` |
| BN-304 | Coupons | `CouponPicker.jsx`, `App.jsx` |
| BN-401 | Address form, validation, serviceability | `AddressForm.jsx`, `CheckoutPage.jsx` |
| BN-402 | Delivery slot and payment selection | `OptionCards.jsx`, `CheckoutPage.jsx` |
| BN-403 | Place order: loading, failure, retry, success | `CheckoutPage.jsx`, `App.jsx` |
| BN-501 | Live order tracking and cancellation | `useNow.js`, `OrderTrackerPage.jsx`, `App.jsx` |
| BN-502 | Order history and reorder | `OrdersPage.jsx`, `App.jsx` |
| BN-601 | Inventory table, KPIs, stock editing | `InventoryPage.jsx`, `App.jsx` |
| BN-602 | Add product | `AddProductForm.jsx` |
| BN-603 | Delete product with confirmation | `InventoryPage.jsx` |
| BN-801 | Shared state with Context and useReducer | `context/*`, `main.jsx`, `App.jsx`, components |
| BN-802 | Controlled forms with one reusable hook | `useForm.js`, `TextField.jsx`, `AddressForm.jsx`, `CheckoutPage.jsx`, `AddProductForm.jsx` |
| BN-803 | Validation and user-input handling | `utils/validation.js`, `AddressForm.jsx`, `CheckoutPage.jsx` |
| BN-804 | Pages and URLs with React Router | `Layout.jsx`, `NotFoundPage.jsx`, `ProductPage.jsx`, `App.jsx`, `main.jsx`, components |
| BN-805 | Real REST calls with fetch and axios | `api/client.js`, `api/api.js`, `ShopContext.jsx`, `CheckoutPage.jsx` |
| BN-806 | Responses, loading states and errors | `client.js`, `useFetch.js`, `ProductPage.jsx`, `CatalogPage.jsx`, `CheckoutPage.jsx` |
| BN-807 | Working with JSON | `OrderTrackerPage.jsx`, `InventoryPage.jsx` |
| BN-808 | Reusable API service functions | `api/api.js`, `ShopContext.jsx`, `AddProductForm.jsx`, `InventoryPage.jsx`, `Footer.jsx` |
| BN-809 | Clean-up and release build | `styles.css` |

## The REST API (mock-server/mockApi.js)

| Method | Path | Answer |
|---|---|---|
| GET | `/api/products` · `/api/products/:id` | catalogue · one product (404 if unknown) |
| POST | `/api/products` | 201 created product · 400 with `fields` |
| DELETE | `/api/products/:id` | 204 |
| PATCH | `/api/variants/:id` | `{ variantId, stock }` (0 to 999) |
| GET | `/api/pincodes/:pincode` | `{ pincode, serviceable, city }` |
| GET · POST | `/api/orders` | list · 201 new order (400 fields, 409 out of stock) |
| GET | `/api/orders/:id` | one order |
| PATCH | `/api/orders/:id/cancel` | cancelled order (409 if it cannot be cancelled) |
| POST | `/api/reset` | restore the demo data |

Errors always look like `{ "error": { "code": "...", "message": "...", "fields": { } } }`.
Headers for testing: `X-Simulate-Error: 1` (503 on every call), `X-Simulate-Delay: 3000` (slow answer).
The dev-server terminal prints one line per call: `[api] POST /api/orders -> 201 (251 ms)`.

## Git workflow

```bash
git checkout -b feature/BN-202-product-card
# ...work...
git add .
git commit -m "BN-202: product card with pack sizes and quantity stepper"
git push -u origin feature/BN-202-product-card
# open a pull request into main; another team member reviews it
```

## Developer tools in the footer

- **Simulate API errors**: every API call fails. Use it to test loading, error and retry states.
- **Reset demo data**: clears the saved cart, coupon, orders and address, and reloads the catalogue.
