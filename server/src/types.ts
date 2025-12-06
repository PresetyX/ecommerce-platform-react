import { z } from "zod";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  stock: number;
  image: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalCents: number;
  customer: { name: string; email: string };
  status: "paid" | "payment_failed";
  paymentRef: string | null;
  createdAt: string;
}

export const checkoutSchema = z.object({
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(20) }))
    .min(1)
    .max(50),
  customer: z.object({ name: z.string().trim().min(1).max(100), email: z.string().email() }),
  paymentToken: z.string().min(1),
});

export const productPatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
});

export const productCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.string().min(1),
  priceCents: z.number().int().min(0),
  stock: z.number().int().min(0),
  image: z.string().default(""),
});

export type InventoryEvent = { productId: string; stock: number };
