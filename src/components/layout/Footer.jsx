import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { useCart } from "../../context/CartContext";
/** Footer with developer tools used during QA: force API errors and reset all saved demo data. */
function Footer() {
  const { simulateErrors, setSimulateErrors, resetDemo } = useShop();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  async function handleReset() {
    clearCart();
    navigate("/");
    await resetDemo().catch(() => {});      // POST /api/reset; the shop reloads the original data
  }
  return (
    <footer className="footer">
      <span>© BasketNow Technologies · Built with React</span>
      <div className="dev-tools">
        <span className="dev-label">Developer tools</span>
        <label className="toggle">
          <input type="checkbox" checked={simulateErrors} onChange={(e) => setSimulateErrors(e.target.checked)} />
          Simulate API errors
        </label>
        <button className="link" onClick={handleReset}>Reset demo data</button>
      </div>
    </footer>
  );
}
export default Footer;
