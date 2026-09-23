import { getPool } from "../api/queries/connection.ts";
const pool = getPool();
const MAP: Record<string, string> = {
  ordinateurs: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786979682/products/hxdhhckcopgih3seiagv.png",
  imprimantes: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786985318/products/vnk2r0tcxx7lk1kjzbvp.png",
  ecrans: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786984586/products/kxyvgelzauh0f8sbcbwi.png",
  peripheriques: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786985300/products/govzrt5dy1avv8xwcygk.png",
  audio: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786967297/products/so5zf3a2c7kgtyqbayle.png",
  reseaux: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786967318/products/iprqecogbowpucttyk5y.png",
  composants: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786985374/products/yswui9r10p77vtyjw7ac.png",
  smartphones: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786979840/products/pxkem8f2dj2xa3hvnlwu.png",
  tablettes: "https://res.cloudinary.com/xswbhy0z/image/upload/v1786982349/products/jta3ohrxuajcc7og9vj6.png",
};
for (const [slug, url] of Object.entries(MAP)) {
  await pool.query("update jhz_categories set image = $1 where slug = $2", [url, slug]);
}
const r = await pool.query("select slug, image from jhz_categories where image is not null order by deck");
console.log("categories with image:", r.rowCount);
await pool.end();