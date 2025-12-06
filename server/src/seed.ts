import type { Product } from "./types.js";

export const seedProducts = (): Product[] => [
  { id: "p-keyboard", name: "Mechanical Keyboard", description: "Hot-swappable 75% board with tactile switches.", category: "Peripherals", priceCents: 12900, stock: 25, image: "⌨️" },
  { id: "p-mouse", name: "Wireless Mouse", description: "Ergonomic mouse, 70-hour battery.", category: "Peripherals", priceCents: 5900, stock: 40, image: "🖱️" },
  { id: "p-monitor", name: "27\" 4K Monitor", description: "IPS panel, USB-C power delivery.", category: "Displays", priceCents: 38900, stock: 8, image: "🖥️" },
  { id: "p-headset", name: "Noise-cancelling Headset", description: "Closed-back, detachable mic.", category: "Audio", priceCents: 17900, stock: 15, image: "🎧" },
  { id: "p-webcam", name: "1080p Webcam", description: "Autofocus with privacy shutter.", category: "Peripherals", priceCents: 7900, stock: 0, image: "📷" },
  { id: "p-dock", name: "USB-C Dock", description: "11-in-1 hub with dual HDMI.", category: "Accessories", priceCents: 9900, stock: 30, image: "🔌" },
];
