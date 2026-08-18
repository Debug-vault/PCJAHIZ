import "dotenv/config";

const required = ["DATABASE_URL", "AUTH_SECRET"] as const;

function get(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: get("DATABASE_URL"),
  authSecret: get("AUTH_SECRET"),
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@techmaroc.ma",
  adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeMe123!",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  appName: process.env.APP_NAME ?? "PC Jahiz",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET ?? "",
  storageUrl: process.env.STORAGE_URL ?? "",
  storagePublicUrl: process.env.STORAGE_PUBLIC_URL ?? "",
  storageBucket: process.env.STORAGE_BUCKET ?? "products",
  storageAccessKey: process.env.STORAGE_ACCESS_KEY ?? "",
  storageSecretKey: process.env.STORAGE_SECRET_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  cmiMerchantId: process.env.CMI_MERCHANT_ID ?? "",
  cmiStoreKey: process.env.CMI_STORE_KEY ?? "",
  cmiApiUrl: process.env.CMI_API_URL ?? "https://testsecure.vcs.payments.com/prm.action",
  cmiShopName: process.env.CMI_SHOP_NAME ?? "PC Jahiz",
};

export type Env = typeof env;

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key} — some features will fail until configured.`);
  }
}