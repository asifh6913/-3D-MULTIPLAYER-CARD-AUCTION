/* Copies the playable files into ./public so Wrangler can upload them as
 * Cloudflare Assets. Run this before `wrangler dev` or `wrangler deploy`.
 *   node scripts/sync-assets.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public");

const FILES = ["CardAuction.html", "engine.js", "game3d.js", "three.min.js", "index.html"];

fs.mkdirSync(OUT, { recursive: true });

let copied = 0;
for (const name of FILES) {
  const src = path.join(ROOT, name);
  if (!fs.existsSync(src)) {
    if (name === "index.html") continue;      // optional, we write it below
    console.warn("skip (missing): " + name);
    continue;
  }
  fs.copyFileSync(src, path.join(OUT, name));
  copied += 1;
}

// Cloudflare serves "/" from index.html - keep it a tiny redirect to the game
fs.writeFileSync(
  path.join(OUT, "index.html"),
  '<!doctype html><meta charset="utf-8">' +
  '<meta http-equiv="refresh" content="0; url=/CardAuction.html">' +
  '<title>Card Auction</title>' +
  '<a href="/CardAuction.html">Open Card Auction</a>',
  "utf8"
);

console.log("synced " + copied + " file(s) -> public/");