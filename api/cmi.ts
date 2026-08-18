import crypto from "node:crypto";
import { env } from "./lib/env";

type CmiParams = {
  orderRef: string;
  amount: number;
  currency: string;
  shopName: string;
};

/**
 * Builds the HMAC-SHA1-signed form parameters for CMI (Moroccan card gateway).
 * Merchant id + store key come from env; the client renders a form POSTing
 * to CMI_API_URL with these params.
 */
export async function createCmiFormParams(opts: CmiParams) {
  const merchantId = env.cmiMerchantId;
  const storeKey = env.cmiStoreKey;
  if (!merchantId || !storeKey) {
    throw new Error("CMI merchant credentials not configured");
  }

  const oid = opts.orderRef;
  const amount = opts.amount.toFixed(2);
  const currency = opts.currency;
  const shopUrl = env.appBaseUrl;
  const lang = "fr";

  const hashString = `${merchantId}${opts.orderRef}${amount}${currency}${shopUrl}`;
  const hash = crypto
    .createHmac("sha1", storeKey)
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  return {
    clientid: merchantId,
    oid,
    amount,
    currency,
    shopurl: shopUrl,
    lang,
    shopname: opts.shopName,
    hash,
  };
}