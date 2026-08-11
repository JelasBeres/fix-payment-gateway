const midtransClient = require("midtrans-client");

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  itemName: string;
}

export async function createSnapTransaction(params: CreateSnapTransactionParams) {
  const { orderId, grossAmount, customerName, customerEmail, itemName } = params;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(grossAmount),
    },
    item_details: [
      {
        id: "TOPUP",
        price: Math.round(grossAmount),
        quantity: 1,
        name: itemName,
      },
    ],
    customer_details: {
      first_name: customerName,
      email: customerEmail,
    },
    expiry: {
      unit: "hour",
      duration: 24,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return {
    token: transaction.token as string,
    redirect_url: transaction.redirect_url as string,
  };
}

export async function verifyTransaction(orderId: string) {
  const status = await coreApi.transaction.status(orderId);
  return status;
}

export { snap, coreApi };
