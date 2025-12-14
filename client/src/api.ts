import type { Order, Product, Summary } from "./types";

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error ?? `Request failed (${res.status})`);
  return data as T;
}

export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
  customer: { name: string; email: string };
  paymentToken: string;
}

export const api = {
  products: (q = "") => request<Product[]>(`/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  checkout: (body: CheckoutPayload) => request<Order>("/api/orders", { method: "POST", body: JSON.stringify(body) }),
  admin: {
    summary: (token: string) => request<Summary>("/api/admin/summary", {}, token),
    orders: (token: string) => request<Order[]>("/api/admin/orders", {}, token),
    setStock: (token: string, id: string, stock: number) =>
      request<Product>(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify({ stock }) }, token),
  },
};
