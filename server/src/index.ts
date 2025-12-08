import { createApp } from "./app.js";
import { SandboxGateway } from "./payments.js";
import { ShopStore } from "./store.js";

const port = Number(process.env.PORT ?? 3001);
const adminToken = process.env.ADMIN_TOKEN ?? "dev-admin-token";
if (!process.env.ADMIN_TOKEN) console.warn("ADMIN_TOKEN not set, using the insecure development default");

const app = createApp(new ShopStore(), { adminToken, gateway: new SandboxGateway() });
app.listen(port, () => console.log(`Shop API listening on http://localhost:${port}`));
