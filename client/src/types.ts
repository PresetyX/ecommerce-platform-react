export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  stock: number;
  image: string;
}

export interface Order {
  id: string;
  items: { productId: string; name: string; quantity: number; unitPriceCents: number }[];
  totalCents: number;
  customer: { name: string; email: string };
  status: "paid" | "payment_failed";
  createdAt: string;
}

export interface Summary {
  orders: number;
  revenueCents: number;
  lowStock: { id: string; name: string; stock: number }[];
}

export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
