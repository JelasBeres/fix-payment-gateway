import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generate = customAlphabet(alphabet, 4);

export function generateLicenseKey(): string {
  return `DRIP-${generate()}-${generate()}-${generate()}-${generate()}`;
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = customAlphabet(alphabet, 6)();
  return `DP-${timestamp}-${random}`;
}
