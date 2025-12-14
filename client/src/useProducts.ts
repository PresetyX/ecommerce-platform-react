import { useEffect, useState } from "react";
import { api } from "./api";
import type { Product } from "./types";

/** Product list that follows stock changes pushed by the server over SSE. */
export function useProducts(query: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.products(query).then((p) => !cancelled && setProducts(p)).catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    const source = new EventSource("/api/inventory/stream");
    source.onmessage = (msg) => {
      const { productId, stock } = JSON.parse(msg.data) as { productId: string; stock: number };
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock } : p)));
    };
    return () => source.close();
  }, []);

  return { products, error };
}
