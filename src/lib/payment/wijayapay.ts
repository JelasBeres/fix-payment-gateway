import crypto from "crypto";

const MERCHANT_CODE = process.env.WIJAYAPAY_MERCHANT_CODE ?? "";
const API_KEY = process.env.WIJAYAPAY_API_KEY ?? "";
const IS_PRODUCTION = process.env.WIJAYAPAY_IS_PRODUCTION === "true";

const BASE_URL = IS_PRODUCTION
  ? "https://gateway.wijayapay.com/api/"
  : "https://sandbox.wijayapay.com/api/";

export function isWijayaPayConfigured(): boolean {
  return Boolean(MERCHANT_CODE && API_KEY);
}

// X-Signature = md5(code_merchant + api_key + ref_id), concatenated without spaces.
export function signature(refId: string): string {
  return crypto
    .createHash("md5")
    .update(`${MERCHANT_CODE}${API_KEY}${refId}`)
    .digest("hex");
}

export function verifySignature(refId: string, expected: string): boolean {
  if (!expected) return false;
  const actual = signature(refId);
  return actual.length === expected.length && actual === expected;
}

export interface WijayaPayChannel {
  group: string;
  code: string;
  name: string;
  image: string;
  status: string;
  fee_amount: string;
  fee_percent: string;
  min_trx: string;
  max_trx: string;
  type_fee: string;
}

export interface WijayaPayPayment {
  payment_name?: string;
  payment_method?: string;
  payment_image?: string;
  total_bayar?: number | string;
  total_fee?: number | string;
  total_diterima?: number | string;
  ref_id?: string;
  trx_reference?: string;
  expired?: string;
  tutorial_pembayaran?: string;
  callback_url?: string;
  qr_image?: string;
  qr_string?: string;
  va_number?: string;
  payment_code?: string;
  barcode_image?: string;
  status_pembayaran?: string;
  [key: string]: unknown;
}

interface WijayaPayResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class WijayaPayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WijayaPayError";
  }
}

export async function getChannels(): Promise<WijayaPayChannel[]> {
  if (!isWijayaPayConfigured()) throw new WijayaPayError("Server misconfiguration");

  const url = new URL(`${BASE_URL}get-payment`);
  url.searchParams.set("code_merchant", MERCHANT_CODE);
  url.searchParams.set("api_key", API_KEY);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as WijayaPayResponse<WijayaPayChannel[]>;

  if (!res.ok || !json.success || !Array.isArray(json.data)) {
    throw new WijayaPayError(json.message || "Gagal mengambil daftar metode pembayaran");
  }

  return json.data.filter((c) => c.status === "active");
}

export async function createTransaction(params: {
  refId: string;
  codePayment: string;
  nominal: number;
}): Promise<WijayaPayPayment> {
  if (!isWijayaPayConfigured()) throw new WijayaPayError("Server misconfiguration");
  const { refId, codePayment, nominal } = params;

  const form = new URLSearchParams();
  form.set("code_merchant", MERCHANT_CODE);
  form.set("api_key", API_KEY);
  form.set("ref_id", refId);
  form.set("code_payment", codePayment);
  form.set("nominal", String(nominal));

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}transaction/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "X-Signature": signature(refId),
      },
      body: form.toString(),
      cache: "no-store",
    });
  } catch {
    throw new WijayaPayError("Gagal terhubung ke payment gateway");
  }

  const json = (await res.json().catch(() => ({}))) as WijayaPayResponse<WijayaPayPayment>;

  if (!res.ok || !json.success || !json.data) {
    console.error("WijayaPay create error:", json);
    throw new WijayaPayError(
      typeof json.message === "string" && json.message
        ? json.message
        : "Gagal membuat transaksi pembayaran"
    );
  }

  return json.data;
}

export async function checkStatus(refId: string): Promise<{
  data: WijayaPayPayment;
  statusPembayaran: string;
}> {
  if (!isWijayaPayConfigured()) throw new WijayaPayError("Server misconfiguration");

  const url = new URL(`${BASE_URL}get-status`);
  url.searchParams.set("code_merchant", MERCHANT_CODE);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("ref_id", refId);

  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: "no-store" });
  } catch {
    throw new WijayaPayError("Gagal terhubung ke payment gateway");
  }

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: WijayaPayPayment;
    status_pembayaran?: string;
    message?: string;
  };

  if (!res.ok || !json.success || !json.data) {
    throw new WijayaPayError(json.message || "Gagal memeriksa status pembayaran");
  }

  return {
    data: json.data,
    statusPembayaran: json.status_pembayaran ?? json.data.status_pembayaran ?? "pending",
  };
}
