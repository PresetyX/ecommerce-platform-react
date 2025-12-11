import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.js";
import { SandboxGateway } from "../src/payments.js";
import { ShopStore } from "../src/store.js";

let server: Server;
let base: string;
const store = new ShopStore();
const ADMIN = { authorization: "Bearer secret" };

before(async () => {
  server = createApp(store, { adminToken: "secret", gateway: new SandboxGateway() }).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const customer = { name: "Ada", email: "ada@example.com" };

describe("catalog", () => {
  it("lists and searches products", async () => {
    const all = await (await call("GET", "/api/products")).json();
    assert.ok(all.length >= 5);
    const found = await (await call("GET", "/api/products?q=keyboard")).json();
    assert.deepEqual(found.map((p: { id: string }) => p.id), ["p-keyboard"]);
    assert.equal((await call("GET", "/api/products/nope")).status, 404);
  });
});

describe("checkout", () => {
  it("creates a paid order and decrements stock", async () => {
    const before = store.getProduct("p-mouse")!.stock;
    const res = await call("POST", "/api/orders", { items: [{ productId: "p-mouse", quantity: 2 }], customer, paymentToken: "tok_visa" });
    assert.equal(res.status, 201);
    const order = await res.json();
    assert.equal(order.totalCents, 2 * 5900);
    assert.equal(order.status, "paid");
    assert.equal(store.getProduct("p-mouse")!.stock, before - 2);
  });

  it("restores stock when the card is declined", async () => {
    const before = store.getProduct("p-dock")!.stock;
    const res = await call("POST", "/api/orders", { items: [{ productId: "p-dock", quantity: 1 }], customer, paymentToken: "tok_declined" });
    assert.equal(res.status, 402);
    assert.equal(store.getProduct("p-dock")!.stock, before);
  });

  it("refuses to oversell", async () => {
    const res = await call("POST", "/api/orders", { items: [{ productId: "p-webcam", quantity: 1 }], customer, paymentToken: "tok_visa" });
    assert.equal(res.status, 409);
    const bad = await call("POST", "/api/orders", { items: [], customer, paymentToken: "x" });
    assert.equal(bad.status, 400);
  });
});

describe("admin", () => {
  it("requires the token", async () => {
    assert.equal((await call("GET", "/api/admin/summary")).status, 401);
  });

  it("reports revenue and edits stock, which is broadcast", async () => {
    const events: string[] = [];
    store.inventory.on("stock", (e) => events.push(e.productId));
    const patched = await call("PATCH", "/api/admin/products/p-webcam", { stock: 12 }, ADMIN);
    assert.equal((await patched.json()).stock, 12);
    assert.ok(events.includes("p-webcam"));
    const summary = await (await call("GET", "/api/admin/summary", undefined, ADMIN)).json();
    assert.ok(summary.revenueCents >= 11800);
    const orders = await (await call("GET", "/api/admin/orders", undefined, ADMIN)).json();
    assert.ok(orders.length >= 2);
  });
});
