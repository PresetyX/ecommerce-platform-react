import { useState } from "react";
import { useCart } from "../cart";
import { money } from "../types";
import { useProducts } from "../useProducts";

export function Catalog() {
  const [query, setQuery] = useState("");
  const { products, error } = useProducts(query);
  const { dispatch } = useCart();

  return (
    <section>
      <input className="search" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {products.map((p) => (
          <article key={p.id} className="product">
            <div className="emoji">{p.image}</div>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <div className="row">
              <strong>{money(p.priceCents)}</strong>
              <span className={p.stock === 0 ? "stock out" : p.stock <= 5 ? "stock low" : "stock"}>
                {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
              </span>
            </div>
            <button disabled={p.stock === 0} onClick={() => dispatch({ type: "add", product: p })}>
              Add to cart
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
