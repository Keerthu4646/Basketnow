import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ShopProvider } from "./context/ShopContext";
import { CartProvider } from "./context/CartContext";
import "./styles.css";
// BrowserRouter gives every component the current URL (useParams, useNavigate, <Link>...).
// The providers inside it give every component the shared shop and cart data.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ShopProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ShopProvider>
    </BrowserRouter>
  </StrictMode>
);