import { useCallback, useState } from "react";
import { api } from "../api";
import { money, type Order, type Summary } from "../types";
import { useProducts } from "../useProducts";

export function Admin() {
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { products } = useProducts("");

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, o] = await Promise.all([api.admin.summary(token), api.admin.orders(token)]);
      setSummary(s);
      setOrders(o);
    } catch (e) {
      setSummary(null);
      setError((e as Error).message);
    }
  }, [token]);

  if (!summary) {
    return (
      <section className="panel">
        <h2>Admin dashboard</h2>
        <input type="password" placeholder="Admin token" value={token} onChange={(e) => setToken(e.target.value)} />
        <button onClick={() => void load()}>Sign in</button>
        {error && <p className="error">{error}</p>}
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Admin dashboard</h2>
      <div className="stats">
        <div><span>Paid orders</span><strong>{summary.orders}</strong></div>
        <div><span>Revenue</span><strong>{money(summary.revenueCents)}</strong></div>
        <div><span>Low stock</span><strong>{summary.lowStock.length}</strong></div>
      </div>
      <h3>Inventory</h3>
      {products.map((p) => (
        <div key={p.id} className="line">
          <span>{p.name}</span>
          <input type="number" min={0} defaultValue={p.stock} key={`${p.id}-${p.stock}`}
            onBlur={(e) => void api.admin.setStock(token, p.id, Number(e.target.value)).then(load)} />
        </div>
      ))}
      <h3>Recent orders</h3>
      {orders.slice(0, 10).map((o) => (
        <div key={o.id} className="line">
          <span>{o.id} · {o.customer.name}</span>
          <span>{o.status}</span>
          <span>{money(o.totalCents)}</span>
        </div>
      ))}
    </section>
  );
}
