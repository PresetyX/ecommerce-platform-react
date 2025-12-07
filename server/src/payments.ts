import { randomUUID } from "node:crypto";

export interface PaymentResult {
  ok: boolean;
  reference: string | null;
  error?: string;
}

export interface PaymentGateway {
  charge(amountCents: number, token: string): Promise<PaymentResult>;
}

/**
 * Sandbox gateway that mimics a payment provider's test mode:
 * tokens "tok_visa" succeed, "tok_declined" is declined, anything else is invalid.
 */
export class SandboxGateway implements PaymentGateway {
  async charge(amountCents: number, token: string): Promise<PaymentResult> {
    if (amountCents <= 0) return { ok: false, reference: null, error: "Invalid amount" };
    if (token === "tok_visa") return { ok: true, reference: `ch_${randomUUID().slice(0, 12)}` };
    if (token === "tok_declined") return { ok: false, reference: null, error: "Card declined" };
    return { ok: false, reference: null, error: "Invalid payment token" };
  }
}
