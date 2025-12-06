import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { seedProducts } from "./seed.js";
import type { InventoryEvent, Order, OrderItem, Product } from "./types.js";

export class StoreError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/** In-memory catalog and orders. Stock changes are emitted so clients can follow them live. */
export class ShopStore {
  readonly inventory = new EventEmitter();
  private products = new Map<string, Product>();
  private orders = new Map<string, Order>();

  constructor(products: Product[] = seedProducts()) {
    for (const p of products) this.products.set(p.id, p);
  }

  listProducts(filter: { q?: string; category?: string } = {}): Product[] {
    const q = filter.q?.toLowerCase();
    return [...this.products.values()].filter(
      (p) =>
        (!filter.category || p.category === filter.category) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    );
  }

  getProduct(id: string) {
    return this.products.get(id);
  }

  createProduct(input: Omit<Product, "id">): Product {
    const product = { id: `p-${randomUUID().slice(0, 8)}`, ...input };
    this.products.set(product.id, product);
    return product;
  }

  patchProduct(id: string, patch: Partial<Omit<Product, "id">>): Product {
    const current = this.products.get(id);
    if (!current) throw new StoreError("Product not found", 404);
    const next = { ...current, ...patch };
    this.products.set(id, next);
    if (patch.stock !== undefined) this.emitStock(next);
    return next;
  }

  /** Validate cart lines against current stock and price them. Does not mutate anything. */
  priceCart(lines: { productId: string; quantity: number }[]): { items: OrderItem[]; totalCents: number } {
    const merged = new Map<string, number>();
    for (const l of lines) merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.quantity);
    const items: OrderItem[] = [];
    for (const [productId, quantity] of merged) {
      const p = this.products.get(productId);
      if (!p) throw new StoreError(`Unknown product ${productId}`, 404);
      if (p.stock < quantity) throw new StoreError(`Only ${p.stock} of "${p.name}" left in stock`, 409);
      items.push({ productId, name: p.name, quantity, unitPriceCents: p.priceCents });
    }
    return { items, totalCents: items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0) };
  }

  /** Decrement stock for a priced cart; throws (leaving stock untouched) if any line is short. */
  reserve(items: OrderItem[]) {
    for (const i of items) {
      if ((this.products.get(i.productId)?.stock ?? 0) < i.quantity) {
        throw new StoreError("Stock changed while checking out", 409);
      }
    }
    for (const i of items) {
      const p = this.products.get(i.productId)!;
      p.stock -= i.quantity;
      this.emitStock(p);
    }
  }

  release(items: OrderItem[]) {
    for (const i of items) {
      const p = this.products.get(i.productId);
      if (p) {
        p.stock += i.quantity;
        this.emitStock(p);
      }
    }
  }

  saveOrder(order: Omit<Order, "id" | "createdAt">): Order {
    const saved: Order = { id: `o-${randomUUID().slice(0, 8)}`, createdAt: new Date().toISOString(), ...order };
    this.orders.set(saved.id, saved);
    return saved;
  }

  getOrder(id: string) {
    return this.orders.get(id);
  }

  listOrders() {
    return [...this.orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  summary() {
    const paid = this.listOrders().filter((o) => o.status === "paid");
    return {
      orders: paid.length,
      revenueCents: paid.reduce((s, o) => s + o.totalCents, 0),
      lowStock: [...this.products.values()].filter((p) => p.stock <= 5).map(({ id, name, stock }) => ({ id, name, stock })),
    };
  }

  private emitStock(p: Product) {
    const event: InventoryEvent = { productId: p.id, stock: p.stock };
    this.inventory.emit("stock", event);
  }
}
