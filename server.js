/*
 * Card Auction - online server
 * ----------------------------
 * Zero dependencies: static files + Server-Sent Events for live state,
 * POST for player actions.
 *
 *   node server.js            -> http://localhost:8787
 *   PORT=9000 node server.js  -> http://localhost:9000
 *
 * Create Server gives you a 5 character room code; friends on the same
 * network (or anyone you expose the port to) join with that code.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Engine = require("./engine.js");

const CONFIG = Engine.CONFIG;
const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "cardauction-data.json");
const ROOM_TTL_MS = 30 * 60 * 1000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

/* ============================================================
   persistence (leaderboard + returning players)
   ============================================================ */
let store = { players: {} };

function loadStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.players) store = parsed;
  } catch (e) {
    store = { players: {} };   // first run or unreadable file: start clean
  }
}
let saveTimer = null;
function saveStore() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.writeFile(DATA_FILE, JSON.stringify(store), () => {});
  }, 1500);
}
loadStore();

function savePlayer(pid, profile) {
  if (!pid || !profile) return;
  store.players[pid] = Object.assign({}, profile, { updatedAt: Date.now() });
  saveStore();
}

function leaderboard(limit) {
  const rows = [];
  for (const pid in store.players) {
    const p = store.players[pid];
    if (!p || typeof p !== "object") continue;
    const won = (p.stats && p.stats.won) || 0;
    const played = (p.stats && p.stats.played) || 0;
    rows.push({
      id: pid,
      name: (p.name || "Player").slice(0, 20),
      color: p.color || "#3fb6ff",
      coins: p.coins || 0,
      income: incomeOf(p),
      cards: (p.inventory || []).length,
      won: won,
      played: played,
      score: (p.totalEarned || 0) + won * 250
    });
  }
  rows.sort((a, b) => b.score - a.score || b.coins - a.coins);
  return rows.slice(0, limit || 50);
}

function incomeOf(profile) {
  let sum = 0;
  for (const item of (profile.inventory || [])) {
    const card = Engine.getCard(item.cardId);
    if (card) sum += card.income;
  }
  return sum;
}

/* ============================================================
   rooms
   ============================================================ */
const rooms = new Map();   // code -> room
const claimAt = new Map(); // pid -> last /api/claim time (cheap rate limit)

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = "";
    for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!rooms.has(code)) return code;
  }
  return "X" + Date.now().toString(36).toUpperCase().slice(-5);
}

function createRoom(hostPid, hostName, opts) {
  const code = makeCode();
  const game = Engine.createGame({ difficulty: opts.difficulty, allowBots: opts.allowBots !== false });
  const room = {
    code: code,
    name: (opts.name || hostName + "'s table").slice(0, 24),
    game: game,
    hostPid: hostPid,
    clients: new Map(),     // pid -> res (SSE)
    pendingLeave: new Map(),// pid -> timer (grace period for reconnects)
    pos: new Map(),         // pid -> {x,z,ry,t}  (3D world positions)
    posLast: new Map(),     // pid -> last accepted pos timestamp
    createdAt: Date.now(),
    lastSeen: Date.now(),
    tickCount: 0,
    difficulty: opts.difficulty
  };

  game.on("notify", (n) => {
    const res = room.clients.get(n.pid);
    if (res) send(res, { t: "toast", text: n.text, kind: n.kind });
  });

  room.timer = setInterval(() => {
    room.tickCount += 1;
    const now = Date.now();
    game.tick(now);
    if (room.tickCount % 10 === 0) game.incomeTick();
    broadcast(room, room.tickCount % 20 === 0);

    if (room.clients.size === 0 && now - room.lastSeen > ROOM_TTL_MS) destroyRoom(code);
  }, Engine.TICK_MS);

  rooms.set(code, room);
  return room;
}

function destroyRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  clearInterval(room.timer);
  for (const timer of room.pendingLeave.values()) clearTimeout(timer);
  for (const res of room.clients.values()) {
    try { res.end(); } catch (e) {}
  }
  rooms.delete(code);
}

function send(res, obj) {
  try { res.write("data: " + JSON.stringify(obj) + "\n\n"); } catch (e) {}
}

function attachPos(room, view) {
  if (!view.players) return view;
  const now = Date.now();
  for (const p of view.players) {
    const q = room.pos.get(p.id);
    if (q && now - q.t < 5000) p.pos = { x: q.x, z: q.z, ry: q.ry };
  }
  return view;
}

function num(v, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(lo, Math.min(hi, n));
}

function broadcast(room, full) {
  for (const [pid, res] of room.clients) {
    const view = attachPos(room, room.game.snapshot(pid));
    if (!full) {
      view.you && delete view.you.inventory;
      view.you && delete view.you.history;
    }
    view.full = !!full;
    send(res, { t: "state", view: view });
  }
}

function clientsOf(code) {
  const room = rooms.get(code);
  return room ? room.clients : null;
}

/* which live room is this player in? (progression claims need to hit the
   room's in-memory wallet, not the stale saved copy) */
function roomOfPid(pid) {
  for (const room of rooms.values()) if (room.game.get(pid)) return room;
  return null;
}

/* ============================================================
   http helpers
   ============================================================ */
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    let size = 0;
    const cap = 4 * 1024 * 1024;   // 4 MB - room for a canvas capture
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > cap) { req.destroy(); resolve(null); return; }
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
    });
    req.on("error", () => resolve(null));
  });
}
function bad(res, msg) { json(res, 400, { ok: false, error: msg }); }
function requireRoom(body) {
  const room = rooms.get(body && body.room);
  return room || null;
}

/* ============================================================
   routes
   ============================================================ */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;

  // CORS - lets the packaged Android app / another origin talk to this server
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    });
    return res.end();
  }

  /* ---------- SSE live state ---------- */
  if (p === "/api/stream" && req.method === "GET") {
    const code = (url.searchParams.get("room") || "").toUpperCase();
    const pid = url.searchParams.get("pid") || "";
    const room = rooms.get(code);
    if (!room || !pid) return json(res, 404, { ok: false, error: "Room not found" });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.write(": connected\n\n");

    room.clients.set(pid, res);
    room.lastSeen = Date.now();
    if (room.pendingLeave.has(pid)) {
      clearTimeout(room.pendingLeave.get(pid));
      room.pendingLeave.delete(pid);
    }
    // a stream coming back means the same player is alive again
    if (!room.game.get(pid)) {
      const nm = (url.searchParams.get("name") || "").slice(0, 20) || "Player";
      room.game.join(pid, nm, store.players[pid] || null);
    }
    room.game.markOnline(pid);
    send(res, { t: "state", view: attachPos(room, room.game.snapshot(pid)), full: true });
    send(res, { t: "room", code: room.code, name: room.name, host: room.hostPid === pid, allowBots: room.game.getAllowBots(), difficulty: room.game.getDifficulty() });

    const heartbeat = setInterval(() => { try { res.write(": ping\n\n"); } catch (e) {} }, 15000);

    const cleanup = () => {
      clearInterval(heartbeat);
      if (room.clients.get(pid) === res) room.clients.delete(pid);
      room.lastSeen = Date.now();
      // grace period so a dropped connection does not instantly eject them
      if (!room.clients.has(pid) && !room.pendingLeave.has(pid)) {
        room.game.markOffline(pid);
        broadcast(room, false);
        const timer = setTimeout(() => {
          room.pendingLeave.delete(pid);
          if (room.clients.has(pid)) return;
          const profile = room.game.exportProfile(pid);
          room.game.removePlayer(pid);
          room.pos.delete(pid);
          room.posLast.delete(pid);
          if (profile) savePlayer(pid, profile);
          broadcast(room, true);
        }, 15000);
        room.pendingLeave.set(pid, timer);
      }
      try { res.end(); } catch (e) {}
    };
    req.on("close", cleanup);
    req.on("error", cleanup);
    return;
  }

  /* ---------- API ---------- */
  if (p.startsWith("/api/") && req.method === "POST") {
    const body = await readBody(req);
    if (!body) return bad(res, "Bad request");

    /* dev helper: the page hands us a canvas capture so it can be reviewed */
    if (p === "/api/shot") {
      const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ""));
      if (!m) return bad(res, "Bad image data");
      try {
        const dir = path.join(__dirname, "_shots");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const ext = m[1] === "jpeg" ? "jpg" : m[1];
        const file = path.join(dir, "shot_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1e4) + "." + ext);
        fs.writeFileSync(file, Buffer.from(m[2], "base64"));
        return json(res, 200, { ok: true, file: file });
      } catch (e) { return bad(res, "Save failed: " + e.message); }
    }

    const pid = (body.pid || "").toString().slice(0, 40);
    if (!pid) return bad(res, "Missing player id");

    /* progression claims (daily reward, mission, achievement, title).
       The ENGINE decides whether the claim is legal - the client only says
       WHAT it wants to claim, never that it already earned it. */
    if (p === "/api/claim") {
      const kind = String(body.kind || "");
      const id = String(body.id || "");
      const now = Date.now();
      const last = claimAt.get(pid) || 0;
      if (now - last < 250) return json(res, 200, { ok: false, why: "Slow down." });
      claimAt.set(pid, now);

      const apply = (fn) =>
        kind === "daily" ? fn.claimDaily(pid)
          : kind === "mission" ? fn.claimMission(pid, id)
          : kind === "ach" ? fn.claimAch(pid, id)
          : kind === "title" ? fn.setTitle(pid, id)
          : { ok: false, why: "Unknown claim." };

      const live = roomOfPid(pid);
      if (live) {
        const r = apply(live.game);
        if (r.ok) {
          const profile = live.game.exportProfile(pid);
          if (profile) savePlayer(pid, profile);
          broadcast(live, true);
        }
        return json(res, 200, r);
      }

      // outside a room the stored wallet is the authority
      if (!store.players[pid]) store.players[pid] = Engine.sanitizeProfile(null);
      const pr = store.players[pid];
      const r = apply({
        claimDaily: () => Engine.claimDaily(pr, Math.random),
        claimMission: (x, i) => Engine.claimMission(pr, i),
        claimAch: (x, i) => Engine.claimAch(pr, i),
        setTitle: (x, i) => Engine.setTitle(pr, i)
      });
      if (r.ok) savePlayer(pid, pr);
      return json(res, 200, Object.assign({}, r, { prog: Engine.progView(pr) }));
    }

    if (p === "/api/create") {
      const saved = store.players[pid] || null;
      const room = createRoom(pid, body.name || "Host", {
        name: body.roomName,
        difficulty: body.difficulty,
        allowBots: body.allowBots !== false
      });
      room.game.join(pid, body.name, saved);
      room.game.notify(pid, "Room created - share code " + room.code, "good");
      return json(res, 200, { ok: true, code: room.code, pid: pid });
    }

    if (p === "/api/join") {
      const code = (body.room || "").toUpperCase();
      const room = rooms.get(code);
      if (!room) return bad(res, "No room with code " + code);
      const saved = store.players[pid] || null;
      const joined = room.game.join(pid, body.name, saved);
      const at = room.game.stationOf(pid);
      room.lastSeen = Date.now();
      return json(res, 200, { ok: true, code: room.code, pid: pid, name: joined.name, seatedAt: at });
    }

    const room = requireRoom(body);
    if (!room) return bad(res, "Room not found");
    room.lastSeen = Date.now();

    if (p === "/api/sit") return json(res, 200, room.game.sit(pid, Number(body.station), body.seat == null ? undefined : Number(body.seat)));
    if (p === "/api/stand") return json(res, 200, room.game.stand(pid));
    if (p === "/api/bid") return json(res, 200, room.game.bid(pid, Number(body.station), body.amount));
    if (p === "/api/pass") return json(res, 200, room.game.pass(pid, Number(body.station)));

    // shop: prices are re-checked inside the engine, never trusted from the client
    if (p === "/api/buy") return json(res, 200, room.game.buy(pid, String(body.cat || ""), String(body.id || "")));
    if (p === "/api/equip") return json(res, 200, room.game.equip(pid, String(body.cat || ""), String(body.id || "")));
    if (p === "/api/sell") return json(res, 200, room.game.sellCard(pid, String(body.iid || "")));

    // 3D world position (throttled, folded into the regular state broadcast)
    if (p === "/api/pos") {
      const now = Date.now();
      const last = room.posLast.get(pid) || 0;
      if (now - last < 110) return json(res, 200, { ok: true, throttled: true });
      room.posLast.set(pid, now);
      if (room.game.get(pid)) {
        room.pos.set(pid, { x: num(body.x, -60, 60), z: num(body.z, -60, 60), ry: num(body.ry, -10, 10), t: now });
      }
      return json(res, 200, { ok: true });
    }

    if (p === "/api/allowBots") {
      if (room.hostPid !== pid) return bad(res, "Only the host can change that.");
      room.game.setAllowBots(body.value !== false);
      broadcast(room, true);
      return json(res, 200, { ok: true, allowBots: room.game.getAllowBots() });
    }

    if (p === "/api/name") {
      const player = room.game.get(pid);
      if (player) player.name = String(body.name || player.name).slice(0, 20);
      broadcast(room, true);
      return json(res, 200, { ok: true });
    }

    if (p === "/api/leave") {
      const profile = room.game.exportProfile(pid);
      room.game.removePlayer(pid);
      room.pos.delete(pid);
      room.posLast.delete(pid);
      if (profile) savePlayer(pid, profile);
      broadcast(room, true);
      return json(res, 200, { ok: true });
    }
    return json(res, 404, { ok: false, error: "Unknown action" });
  }

  if (p === "/api/leaderboard") {
    return json(res, 200, { ok: true, rows: leaderboard(50), rooms: rooms.size });
  }
  if (p === "/api/rooms") {
    const list = [];
    for (const room of rooms.values()) {
      list.push({ code: room.code, name: room.name, players: room.clients.size, difficulty: room.difficulty });
    }
    return json(res, 200, { ok: true, rooms: list });
  }

  /* ---------- static ---------- */
  if (req.method === "GET" || req.method === "HEAD") return serveStatic(p, res);
  return json(res, 405, { ok: false, error: "Method not allowed" });
});

function serveStatic(urlPath, res) {
  if (urlPath === "/") urlPath = "/CardAuction.html";
  const rel = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, rel);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    res.end(data);
  });
}

server.listen(PORT, "0.0.0.0", () => {
  const nets = os.networkInterfaces();
  const addrs = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) addrs.push(net.address);
    }
  }
  console.log("Card Auction server running");
  console.log("  this PC   : http://localhost:" + PORT);
  for (const a of addrs) console.log("  on your LAN: http://" + a + ":" + PORT);
  console.log("Share that LAN address (or the room code) with friends to play together.");
});

process.on("SIGINT", () => {
  for (const room of rooms.values()) {
    for (const pid of room.clients.keys()) savePlayer(pid, room.game.exportProfile(pid));
  }
  saveStore();
  setTimeout(() => process.exit(0), 300);
});
