import { useState } from "react";
import { useCart } from "./cart";
import { Admin } from "./components/Admin";
import { Cart } from "./components/Cart";
import { Catalog } from "./components/Catalog";

type View = "shop" | "cart" | "admin";

export function App() {
  const [view, setView] = useState<View>("shop");
  const { count } = useCart();
  return (
    <main>
      <nav>
        <h1>ShopReact</h1>
        <button onClick={() => setView("shop")}>Shop</button>
        <button onClick={() => setView("cart")}>Cart ({count})</button>
        <button onClick={() => setView("admin")}>Admin</button>
      </nav>
      {view === "shop" && <Catalog />}
      {view === "cart" && <Cart />}
      {view === "admin" && <Admin />}
    </main>
  );
}
