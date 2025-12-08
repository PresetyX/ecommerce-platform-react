import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import type { PaymentGateway } from "./payments.js";
import { ShopStore, StoreError } from "./store.js";
import { checkoutSchema, productCreateSchema, productPatchSchema, type InventoryEvent } from "./types.js";

export interface AppOptions {
  adminToken: string;
  gateway: PaymentGateway;
}

export function createApp(store: ShopStore, { adminToken, gateway }: AppOptions) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.header("authorization") !== `Bearer ${adminToken}`) {
      return res.status(401).json({ error: "Admin token required" });
    }
    next();
  };
  const wrap = (fn: (req: Request, res: Response) => Promise<unknown> | unknown) =>
    (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // ---- storefront
  app.get("/api/products", (req, res) => {
    const { q, category } = req.query;
    res.json(store.listProducts({ q: typeof q === "string" ? q : undefined, category: typeof category === "string" ? category : undefined }));
  });

  app.get("/api/products/:id", (req, res) => {
    const p = store.getProduct(req.params.id);
    return p ? res.json(p) : res.status(404).json({ error: "Product not found" });
  });

  // Server-Sent Events: pushes every stock change so product pages stay accurate in real time.
  app.get("/api/inventory/stream", (req, res) => {
    res.set({ "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
    res.flushHeaders();
    res.write(": connected\n\n");
    const onStock = (e: InventoryEvent) => res.write(`data: ${JSON.stringify(e)}\n\n`);
    store.inventory.on("stock", onStock);
    const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
    req.on("close", () => {
      clearInterval(ping);
      store.inventory.off("stock", onStock);
    });
  });

  app.post("/api/orders", wrap(async (req, res) => {
    const body = checkoutSchema.parse(req.body);
    const { items, totalCents } = store.priceCart(body.items);
    store.reserve(items);
    const payment = await gateway.charge(totalCents, body.paymentToken);
    if (!payment.ok) {
      store.release(items);
      store.saveOrder({ items, totalCents, customer: body.customer, status: "payment_failed", paymentRef: null });
      return res.status(402).json({ error: payment.error ?? "Payment failed" });
    }
    const order = store.saveOrder({ items, totalCents, customer: body.customer, status: "paid", paymentRef: payment.reference });
    res.status(201).json(order);
  }));

  app.get("/api/orders/:id", (req, res) => {
    const o = store.getOrder(req.params.id);
    return o ? res.json(o) : res.status(404).json({ error: "Order not found" });
  });

  // ---- admin
  app.get("/api/admin/summary", requireAdmin, (_req, res) => res.json(store.summary()));
  app.get("/api/admin/orders", requireAdmin, (_req, res) => res.json(store.listOrders()));
  app.post("/api/admin/products", requireAdmin, (req, res) =>
    res.status(201).json(store.createProduct(productCreateSchema.parse(req.body))));
  app.patch("/api/admin/products/:id", requireAdmin, (req, res) =>
    res.json(store.patchProduct(req.params.id, productPatchSchema.parse(req.body))));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) return res.status(400).json({ error: "Validation failed", issues: err.issues });
    if (err instanceof StoreError) return res.status(err.status).json({ error: err.message });
    if (err instanceof SyntaxError) return res.status(400).json({ error: "Invalid JSON" });
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
