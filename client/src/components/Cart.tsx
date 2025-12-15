import { useState, type FormEvent } from "react";
import { api } from "../api";
import { useCart } from "../cart";
import { money, type Order } from "../types";

export function Cart() {
  const { lines, totalCents, dispatch } = useCart();
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [token, setToken] = useState("tok_visa");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  async function checkout(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const placed = await api.checkout({
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        customer,
        paymentToken: token,
      });
      setOrder(placed);
      dispatch({ type: "clear" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <section className="panel">
        <h2>Thank you, {order.customer.name}!</h2>
        <p>Order <code>{order.id}</code> was paid: {money(order.totalCents)}.</p>
      </section>
    );
  }
  if (lines.length === 0) return <section className="panel"><p>Your cart is empty.</p></section>;

  return (
    <section className="panel">
      <h2>Your cart</h2>
      {lines.map(({ product, quantity }) => (
        <div key={product.id} className="line">
          <span>{product.name}</span>
          <input type="number" min={0} max={product.stock} value={quantity}
            onChange={(e) => dispatch({ type: "set", id: product.id, quantity: Number(e.target.value) })} />
          <span>{money(product.priceCents * quantity)}</span>
        </div>
      ))}
      <p className="total">Total: <strong>{money(totalCents)}</strong></p>
      <form onSubmit={checkout} className="checkout">
        <input placeholder="Name" required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
        <input placeholder="Email" type="email" required value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
        <select value={token} onChange={(e) => setToken(e.target.value)}>
          <option value="tok_visa">Test card (approved)</option>
          <option value="tok_declined">Test card (declined)</option>
        </select>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? "Processing…" : "Pay now"}</button>
      </form>
    </section>
  );
}
