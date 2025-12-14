import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { Product } from "./types";

export interface CartLine {
  product: Product;
  quantity: number;
}

type Action =
  | { type: "add"; product: Product }
  | { type: "set"; id: string; quantity: number }
  | { type: "clear" };

export function cartReducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "add": {
      const line = state.find((l) => l.product.id === action.product.id);
      if (!line) return [...state, { product: action.product, quantity: 1 }];
      return state.map((l) => (l === line ? { ...l, quantity: l.quantity + 1 } : l));
    }
    case "set":
      return action.quantity <= 0
        ? state.filter((l) => l.product.id !== action.id)
        : state.map((l) => (l.product.id === action.id ? { ...l, quantity: action.quantity } : l));
    case "clear":
      return [];
  }
}

const CartContext = createContext<{
  lines: CartLine[];
  count: number;
  totalCents: number;
  dispatch: React.Dispatch<Action>;
} | null>(null);

const KEY = "shopreact.cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, [], () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartLine[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable: cart stays in memory */
    }
  }, [lines]);

  const value = useMemo(
    () => ({
      lines,
      dispatch,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      totalCents: lines.reduce((s, l) => s + l.quantity * l.product.priceCents, 0),
    }),
    [lines],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
