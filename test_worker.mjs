/* Local harness for the Cloudflare Worker: no wrangler needed.
 * Mocks D1 + the Durable Object binding and drives the real worker code through
 * the same HTTP API the browser uses.  Run:  node test_worker.mjs
 */
import Worker, { GameHub } from "./worker/index.mjs";

const Engine = globalThis.CAEngine;
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("  ok   " + msg); } else { fail++; console.log("  FAIL " + msg); } };

/* ------------------------------------------------------------------ fake D1 */
function makeD1() {
  const rows = new Map();   // pid -> { data, updated_at }
  return {
    _rows: rows,
    prepare(sql) {
      const s = sql.replace(/\s+/g, " ").trim();
      const isInsert = /^INSERT/i.test(s);
      const isSelect = /^SELECT/i.test(s);
      const hasPid = isInsert && /ON CONFLICT\(pid\)/.test(s);
      return {
        bind(...vals) {
          return {
            async run() {
              if (isInsert && hasPid) {
                rows.set(String(vals[0]), { data: String(vals[1]), updated_at: Number(vals[2]) });
                return { success: true };
              }
              return { success: true };
            },
            async first() {
              const key = String(vals[0]);
              const r = rows.get(key);
              return r ? { pid: key, data: r.data, updated_at: r.updated_at } : null;
            },
            async all() {
              const out = [];
              for (const [pid, r] of rows) out.push({ pid, data: r.data, updated_at: r.updated_at });
              return { results: out };
            }
          };
        },
        async run() { return { success: true }; },
        async first() { return null; },
        async all() {
          const out = [];
          for (const [pid, r] of rows) out.push({ pid, data: r.data, updated_at: r.updated_at });
          return { results: out };
        }
      };
    },
    async batch() { return []; }
  };
}

/* ------------------------------------------------------- fake DO + bindings */
const db = makeD1();
const waited = [];
const state = { waitUntil: (p) => { waited.push(p); } };

let hub = null;
const env = {
  DB: db,
  ASSETS: { fetch: async (req) => new Response("asset:" + new URL(req.url).pathname, { headers: { "Content-Type": "text/plain" } }) },
  GAMEHUB: {
    idFromName: () => "single-hub",
    get: () => { if (!hub) hub = new GameHub(state, env); return hub; }
  }
};
const worker = Worker;

const BASE = "https://card-auction.example";
const call = (path, init) => worker.fetch(new Request(BASE + path, init), env);
const getJson = async (path) => (await call(path)).json();
const post = async (path, body) =>
  (await call(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();

/* ------------------------------------------------------------------- tests */
console.log("\n1. routing");
{
  const ping = await getJson("/api/ping");
  ok(ping.ok === true, "GET /api/ping works without the Durable Object");
  const asset = await call("/CardAuction.html");
  ok((await asset.text()).indexOf("asset:") === 0, "static files come from ASSETS");
  const cors = await call("/api/bid", { method: "OPTIONS" });
  ok(cors.status === 204 && cors.headers.get("Access-Control-Allow-Origin") === "*", "OPTIONS preflight allowed");
  const missing = await post("/api/bid", {});
  ok(missing.ok === false, "POST without pid is rejected");
}

console.log("\n2. create / join / stream");
let code = "";
{
  const created = await post("/api/create", { pid: "host1", name: "Host", roomName: "Host's table", difficulty: "sharp" });
  code = created.code;
  ok(created.ok === true && /^[A-Z2-9]{5}$/.test(code), "room created, 5 char code: " + code);
  const joined = await post("/api/join", { pid: "guest1", name: "Guest", room: code });
  ok(joined.ok === true && joined.name === "Guest", "second player joined");
  const nope = await post("/api/join", { pid: "guest2", name: "X", room: "ZZZZZ" });
  ok(nope.ok === false, "joining a missing room fails cleanly");

  const res = await call("/api/stream?room=" + code + "&pid=host1&name=Host");
  ok(res.headers.get("Content-Type").indexOf("text/event-stream") === 0, "SSE stream opens");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const readSome = async (ms) => {
    const t = Date.now() + ms;
    while (Date.now() < t) {
      const race = await Promise.race([reader.read(), new Promise((r) => setTimeout(() => r(null), 120))]);
      if (!race) break;
      buf += dec.decode(race.value, { stream: true });
    }
    return buf;
  };
  await readSome(400);
  ok(buf.indexOf("\"t\":\"state\"") > -1, "stream sends the first state frame");
  ok(buf.indexOf("\"t\":\"room\"") > -1, "stream sends the room info frame");
  await reader.cancel();
}

console.log("\n3. auction rules still enforced on the edge");
let frames = [];
{
  // a real player is always holding their SSE stream open while they play
  const streamRes = await call("/api/stream?room=" + code + "&pid=guest1&name=Guest");
  const reader = streamRes.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  (async () => {
    for (;;) {
      try {
        const r = await reader.read();
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
      } catch (e) { break; }
    }
  })();

  const sit = await post("/api/sit", { pid: "host1", room: code, station: 1 });
  ok(sit.ok === true, "sit down at table 1");
  await post("/api/sit", { pid: "guest1", room: code, station: 1 });
  await new Promise((r) => setTimeout(r, (Engine.CONFIG.auction.seatCountdown + 2) * 1000));
  frames = (buf.match(/"t":"state"/g) || []).length;
  ok(frames > 3, "live state streamed to the seated player (" + frames + " frames)");

  const view = (await post("/api/stand", { pid: "nobody", room: code })).ok === false;
  ok(view === true, "an unknown player cannot act");

  const bid = await post("/api/bid", { pid: "host1", room: code, station: 1, amount: 10 });
  ok(bid.ok === true, "valid bid accepted: " + JSON.stringify(bid).slice(0, 60));
  const cheap = await post("/api/bid", { pid: "guest1", room: code, station: 1, amount: 1 });
  ok(cheap.ok === false, "under-minimum bid rejected");
  const huge = await post("/api/bid", { pid: "host1", room: code, station: 1, amount: 999999999 });
  ok(huge.ok === false, "bid above the wallet rejected (no fake coins)");
  const noRoom = await post("/api/bid", { pid: "host1", room: "ZZZZZ", station: 1, amount: 20 });
  ok(noRoom.ok === false, "bid into a missing room rejected");
  await reader.cancel();
}

console.log("\n4. shop prices are re-checked server side");
{
  const poor = await post("/api/create", { pid: "poor1", name: "Poor" });
  const poorCode = poor.code;
  await post("/api/sit", { pid: "poor1", room: poorCode, station: 2 });
  const buy = await post("/api/buy", { pid: "poor1", room: poorCode, cat: "characters", id: "char_titan" });
  ok(buy.ok === false, "cannot buy a 52,000 coin character with 250 coins");
  const unknown = await post("/api/buy", { pid: "poor1", room: poorCode, cat: "characters", id: "char_hacker" });
  ok(unknown.ok === false, "unknown shop item rejected");
}

console.log("\n5. progression claims");
{
  const d1 = await post("/api/claim", { pid: "host1", kind: "daily" });
  ok(d1.ok === true, "daily reward claimed: +" + (d1.reward ? d1.reward.coins : "?") + " coins");
  const again = await post("/api/claim", { pid: "host1", kind: "daily" });
  ok(again.ok === false, "same-day second claim blocked");
  await new Promise((r) => setTimeout(r, 300));
  const bogus = await post("/api/claim", { pid: "host1", kind: "mission", id: "nope" });
  ok(bogus.ok === false, "unknown mission rejected by the engine");
  const title = await post("/api/claim", { pid: "host1", kind: "title", id: "t_locked" });
  ok(title.ok === false, "locked title cannot be equipped");
}

console.log("\n6. persistence + leaderboard (D1 mock)");
{
  await post("/api/leave", { pid: "host1", room: code });
  await new Promise((r) => setTimeout(r, 60));
  ok(db._rows.has("host1"), "profile written to the database");
  const saved = JSON.parse(db._rows.get("host1").data);
  ok(saved.coins > 250, "coins persisted (now " + saved.coins + ")");

  const lb = await getJson("/api/leaderboard");
  ok(lb.ok === true && lb.rows.length >= 1, "leaderboard returns rows: " + lb.rows.length);
  ok(lb.rows[0].id === "host1" || lb.rows.some((r) => r.id === "host1"), "the player is on the leaderboard");

  const rooms = await getJson("/api/rooms");
  ok(rooms.ok === true && Array.isArray(rooms.rooms), "room list returns an array");
}

console.log("\n7. catalogue size");
{
  const total = ["characters", "shirts", "pants", "shoes", "caps", "chairs", "luck"]
    .reduce((n, c) => n + Engine.SHOP[c].length, 0);
  ok(total === 72, "shop catalogue has " + total + " items");
  ok(Engine.SHOP.characters.length === 14, "14 characters");
}

console.log("\n" + pass + " passed, " + fail + " failed");
if (hub) hub.stopPump();
process.exit(fail ? 1 : 0);