import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function peek(table: string, cols?: string, limit = 1) {
  const r = await pool.query(`select ${cols ?? "*"} from "${table}" limit ${limit}`);
  return r.rows;
}

console.log("=== User ===");
console.log(JSON.stringify(await peek("User", '"id","name","email","passwordHash","phone","role","locale","createdAt"'), null, 1));

console.log("=== Category (first 2) ===");
console.log(JSON.stringify(await peek("Category", '"id","slug","nameFr","nameAr","description","descriptionAr","seoTitleFr","seoTitleAr","seoDescriptionFr","seoDescriptionAr","parentId","image","sortOrder","active","createdAt"', 2), null, 1));

console.log("=== Brand (first 2) ===");
console.log(JSON.stringify(await peek("Brand", '"id","slug","name","logo","description","descriptionAr","seoTitle","seoTitleAr","seoDescription","seoDescriptionAr","sortOrder","showInMarquee","active","createdAt"', 2), null, 1));

console.log("=== Product (first 2) ===");
console.log(JSON.stringify(await peek("Product", '"id","slug","sku","nameFr","nameAr","summaryFr","summaryAr","descriptionFr","descriptionAr","seoTitleFr","seoTitleAr","seoDescriptionFr","seoDescriptionAr","faqFr","faqAr","aiGeneratedAt","price","compareAtPrice","cost","currency","stock","lowStockThreshold","images","specs","specsFr","specsAr","active","featured","categoryId","brandId","createdAt","updatedAt"', 2), null, 1));

console.log("=== Order ===");
console.log(JSON.stringify(await peek("Order"), null, 1));

console.log("=== OrderItem ===");
console.log(JSON.stringify(await peek("OrderItem"), null, 1));

console.log("=== Review ===");
console.log(JSON.stringify(await peek("Review", '"id","productId","userId","rating","comment","status","createdAt"'), null, 1));

console.log("=== Setting (sample) ===");
console.log(JSON.stringify(await peek("Setting", '"key","value"', 8), null, 1));

console.log("=== ShippingZone ===");
console.log(JSON.stringify(await peek("ShippingZone"), null, 1));

console.log("=== PromoCode ===");
console.log(JSON.stringify(await peek("PromoCode"), null, 1));

console.log("=== ProductVariant ===");
console.log(JSON.stringify(await peek("ProductVariant"), null, 1));

await pool.end();