/* ============================================================================
 * Card Auction - Cloudflare Worker (always-on online server)
 * ----------------------------------------------------------------------------
 * Same HTTP API as the local `server.js`, so CardAuction.html needs NO change:
 *
 *   GET  /api/stream?room=CODE&pid=PID&name=NAME   -> Server-Sent Events
 *   POST /api/create | /api/join | /api/leave
 *   POST /api/sit | /api/stand | /api/bid | /api/pass
 *   POST /api/buy | /api/equip | /api/sell
 *   POST /api/pos | /api/allowBots | /api/name | /api/claim
 *   GET  /api/rooms | /api/leaderboard | /api/ping
 *
 * How it is put together
 *   - Worker        : routing + static files (Cloudflare Assets)
 *   - Durable Object: ALL live game/room state, so every request for a room
 *                     always reaches the same isolate (correct bids, no split brain)
 *   - D1            : saved profiles + leaderboard
 *
 * engine.js is the exact same file the browser and the local Node server use -
 * it is imported as-is, so all the rules stay in one place.
 * ========================================================================== */

import "../engine.js";

const Engine = globalThis.CAEngine;
const TICK_MS = Engine.TICK_MS || 700;
const CODE_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // no 0/O/1/I
const ROOM_TTL_MS = 30 * 60 * 1000;
const SAVE_EVERY = 20;         // ticks between profile flushes to D1
const BROADCAST_EVERY = 20;    // ticks between full state syncs (~2s, same as server.js)
const PUSH_MIN_MS = 120;       // fastest a change may push state to the players
const HEARTBEAT_MS = 15000;

/* ---------------------------------------------------------------- helpers */
function j(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
const bad = (m) => j({ ok: false, error: m }, 400);
const num = (v, lo, hi) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(lo, Math.min(hi, n));
};

async function readJson(request) {
  try {
    const txt = await request.text();
    if (!txt) return {};
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

/* ============================================================================
 * Durable Object - the live game server
 * ========================================================================== */
export class GameHub {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.rooms = new Map();      // code -> room
    this.claimAt = new Map();    // pid -> last claim timestamp
    this.pump = null;            // shared ticker handle
  }

  /* ---------------------------------------------------------------- routing */
  async fetch(request) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === "/api/stream") return this.handleStream(request, url);
    if (p === "/api/ping") return j({ ok: true, edge: true, rooms: this.rooms.size, ts: Date.now() });
    if (p === "/api/rooms") return j({ ok: true, rooms: this.roomList() });
    if (p === "/api/leaderboard") return this.handleLeaderboard();
    if (p.startsWith("/api/") && request.method === "POST") return this.handlePost(request, p);
    return j({ ok: false, error: "Unknown action" }, 404);
  }

  /* ------------------------------------------------------------ SSE stream */
  handleStream(request, url) {
    const code = (url.searchParams.get("room") || "").toUpperCase();
    const pid = url.searchParams.get("pid") || "";
    const room = this.rooms.get(code);
    if (!room || !pid) return j({ ok: false, error: "Room not found" }, 404);

    const name = (url.searchParams.get("name") || "Player").slice(0, 20);
    const enc = new TextEncoder();
    const hub = this;
    let client = null;

    const stream = new ReadableStream({
      start(controller) {
        client = { controller, at: Date.now() };
        room.clients.set(pid, client);
        room.lastSeen = Date.now();
        hub.ensurePump();

        // a returning stream means the same player is alive again
        if (room.pendingLeave.has(pid)) {
          clearTimeout(room.pendingLeave.get(pid));
          room.pendingLeave.delete(pid);
        }
        if (!room.game.get(pid)) room.game.join(pid, name, null);
        room.game.markOnline(pid);

        controller.enqueue(enc.encode(": connected\n\n"));
        hub.pushState(room, pid, client, true);
        hub.pushRoomInfo(room, pid);
      },
      cancel() {
        hub.dropClient(room, pid, client);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  dropClient(room, pid, client) {
    if (!room) return;
    if (client && room.clients.get(pid) === client) room.clients.delete(pid);
    room.lastSeen = Date.now();

    // grace period: a phone that loses signal must not instantly lose its seat
    if (room.clients.has(pid) || room.pendingLeave.has(pid)) return;
    room.game.markOffline(pid);
    this.broadcast(room, false);
    const timer = setTimeout(() => {
      room.pendingLeave.delete(pid);
      if (room.clients.has(pid)) return;
      const profile = room.game.exportProfile(pid);
      room.game.removePlayer(pid);
      room.pos.delete(pid);
      room.posLast.delete(pid);
      if (profile) this.savePlayer(pid, profile);
      this.broadcast(room, true);
    }, 15000);
    room.pendingLeave.set(pid, timer);
  }

  /* ----------------------------------------------------------------- posts */
  async handlePost(request, p) {
    const body = await readJson(request);
    if (!body) return bad("Bad request");

    /* local-only dev helper (canvas capture to disk) - not available on the edge */
    if (p === "/api/shot") return j({ ok: false, why: "Screenshots are local-only." });

    const pid = String(body.pid || "").slice(0, 40);
    if (!pid) return bad("Missing player id");

    /* progression claims - the ENGINE decides legality, never the client */
    if (p === "/api/claim") return this.handleClaim(pid, body);

    if (p === "/api/create") {
      const code = this.makeCode();
      const room = this.createRoom(code, {
        name: (body.roomName || (body.name || "Host") + "'s table").slice(0, 24),
        hostPid: pid,
        difficulty: body.difficulty,
        allowBots: body.allowBots !== false
      });
      const saved = await this.loadPlayer(pid);
      room.game.join(pid, body.name || "Host", saved);
      room.game.notify(pid, "Room created - share code " + code, "good");
      return j({ ok: true, code, pid });
    }

    if (p === "/api/join") {
      const code = String(body.room || "").toUpperCase();
      const room = this.rooms.get(code);
      if (!room) return bad("No room with code " + code);
      const saved = await this.loadPlayer(pid);
      const joined = room.game.join(pid, body.name, saved);
      room.lastSeen = Date.now();
      this.ensurePump();
      return j({ ok: true, code: room.code, pid, name: joined.name, seatedAt: room.game.stationOf(pid) });
    }

    const room = this.rooms.get(String(body.room || "").toUpperCase());
    if (!room) return bad("Room not found");
    room.lastSeen = Date.now();
    this.ensurePump();

    switch (p) {
      case "/api/sit":
        return j(room.game.sit(pid, Number(body.station), body.seat == null ? undefined : Number(body.seat)));
      case "/api/stand":
        return j(room.game.stand(pid));
      case "/api/bid":
        return j(room.game.bid(pid, Number(body.station), body.amount));
      case "/api/pass":
        return j(room.game.pass(pid, Number(body.station)));
      /* shop: prices are re-checked inside the engine, never trusted from the client */
      case "/api/buy":
        return j(room.game.buy(pid, String(body.cat || ""), String(body.id || "")));
      case "/api/equip":
        return j(room.game.equip(pid, String(body.cat || ""), String(body.id || "")));
      case "/api/sell":
        return j(room.game.sellCard(pid, String(body.iid || "")));
      case "/api/pos": {
        const now = Date.now();
        const last = room.posLast.get(pid) || 0;
        if (now - last < 110) return j({ ok: true, throttled: true });
        room.posLast.set(pid, now);
        if (room.game.get(pid)) {
          room.pos.set(pid, { x: num(body.x, -60, 60), z: num(body.z, -60, 60), ry: num(body.ry, -10, 10), t: now });
        }
        return j({ ok: true });
      }
      case "/api/allowBots": {
        if (room.hostPid !== pid) return bad("Only the host can change that.");
        room.game.setAllowBots(body.value !== false);
        this.broadcast(room, true);
        return j({ ok: true, allowBots: room.game.getAllowBots() });
      }
      case "/api/name": {
        const player = room.game.get(pid);
        if (player) player.name = String(body.name || player.name).slice(0, 20);
        this.broadcast(room, true);
        return j({ ok: true });
      }
      case "/api/leave": {
        const profile = room.game.exportProfile(pid);
        room.game.removePlayer(pid);
        room.pos.delete(pid);
        room.posLast.delete(pid);
        if (profile) this.state.waitUntil(this.savePlayer(pid, profile));
        this.broadcast(room, true);
        return j({ ok: true });
      }
      default:
        return j({ ok: false, error: "Unknown action" }, 404);
    }
  }

  async handleClaim(pid, body) {
    const kind = String(body.kind || "");
    const id = String(body.id || "");
    const now = Date.now();
    const last = this.claimAt.get(pid) || 0;
    if (now - last < 250) return j({ ok: false, why: "Slow down." });
    this.claimAt.set(pid, now);

    const apply = (fn) =>
      kind === "daily" ? fn.claimDaily(pid)
        : kind === "mission" ? fn.claimMission(pid, id)
          : kind === "ach" ? fn.claimAch(pid, id)
            : kind === "title" ? fn.setTitle(pid, id)
              : { ok: false, why: "Unknown claim." };

    // inside a room the live wallet is the authority
    for (const room of this.rooms.values()) {
      if (!room.game.get(pid)) continue;
      this.ensurePump();
      const r = apply(room.game);
      if (r.ok) {
        const profile = room.game.exportProfile(pid);
        if (profile) this.state.waitUntil(this.savePlayer(pid, profile));
        this.broadcast(room, true);
      }
      return j(r);
    }

    // outside a room the stored wallet is the authority
    let pr = await this.loadPlayer(pid);
    if (!pr) pr = Engine.sanitizeProfile(null);
    const r = apply({
      claimDaily: () => Engine.claimDaily(pr, Math.random),
      claimMission: (x, i) => Engine.claimMission(pr, i),
      claimAch: (x, i) => Engine.claimAch(pr, i),
      setTitle: (x, i) => Engine.setTitle(pr, i)
    });
    if (r.ok) this.state.waitUntil(this.savePlayer(pid, pr));
    return j(Object.assign({}, r, { prog: Engine.progView(pr) }));
  }

  async handleLeaderboard() {
    let rows = [];
    try {
      const res = await this.env.DB.prepare("SELECT pid, data FROM profiles").all();
      rows = (res.results || []).map((r) => {
        let p;
        try { p = JSON.parse(r.data); } catch (e) { p = null; }
        if (!p) return null;
        const won = (p.stats && p.stats.won) || 0;
        return {
          id: r.pid,
          name: (p.name || "Player").slice(0, 20),
          color: p.color || "#3fb6ff",
          coins: p.coins || 0,
          income: incomeOf(p),
          cards: (p.inventory || []).length,
          won,
          played: (p.stats && p.stats.played) || 0,
          score: (p.totalEarned || 0) + won * 250
        };
      }).filter(Boolean);
    } catch (e) {
      rows = [];
    }
    rows.sort((a, b) => b.score - a.score || b.coins - a.coins);
    return j({ ok: true, rows: rows.slice(0, 50), rooms: this.rooms.size });
  }

  /* ------------------------------------------------------------------ D1 */
  async loadPlayer(pid) {
    try {
      const r = await this.env.DB.prepare("SELECT data FROM profiles WHERE pid = ?").bind(pid).first();
      if (!r || !r.data) return null;
      return Engine.sanitizeProfile(JSON.parse(r.data));
    } catch (e) {
      return null;
    }
  }

  async savePlayer(pid, profile) {
    if (!pid || !profile) return;
    try {
      await this.env.DB.prepare(
        "INSERT INTO profiles (pid, data, updated_at) VALUES (?, ?, ?) " +
        "ON CONFLICT(pid) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
      ).bind(pid, JSON.stringify(profile), Date.now()).run();
    } catch (e) {
      /* a failed save must never break the game - the player keeps playing */
    }
  }

  /* --------------------------------------------------------------- rooms */
  makeCode() {
    for (let attempt = 0; attempt < 60; attempt++) {
      let code = "";
      for (let i = 0; i < 5; i++) code += CODE_ALPHA[Math.floor(Math.random() * CODE_ALPHA.length)];
      if (!this.rooms.has(code)) return code;
    }
    return "X" + Date.now().toString(36).toUpperCase().slice(-5);
  }

  createRoom(code, opts) {
    const game = Engine.createGame({ difficulty: opts.difficulty, allowBots: opts.allowBots !== false });
    const room = {
      code,
      name: opts.name,
      hostPid: opts.hostPid,
      difficulty: opts.difficulty,
      game,
      clients: new Map(),
      pendingLeave: new Map(),
      pos: new Map(),
      posLast: new Map(),
      createdAt: Date.now(),
      lastSeen: Date.now(),
      lastPush: 0,
      pushQueued: false,
      tickCount: 0
    };
    /* any engine change (bid, pass, card dealt, round closed) reaches both
       players straight away; the periodic full sync only fixes drift */
    game.on("change", () => this.pushSoon(room));
    game.on("notify", (n) => {
      const c = room.clients.get(n.pid);
      if (c) this.write(c, { t: "toast", text: n.text, kind: n.kind });
    });
    this.rooms.set(code, room);
    this.ensurePump();
    return room;
  }

  destroyRoom(code) {
    const room = this.rooms.get(code);
    if (!room) return;
    for (const t of room.pendingLeave.values()) clearTimeout(t);
    for (const c of room.clients.values()) {
      try { c.controller.close(); } catch (e) {}
    }
    this.rooms.delete(code);
    if (!this.rooms.size && this.sweeper) { clearTimeout(this.sweeper); this.sweeper = null; }
  }

  roomList() {
    const list = [];
    for (const room of this.rooms.values()) {
      list.push({ code: room.code, name: room.name, players: room.clients.size, difficulty: room.difficulty });
    }
    return list;
  }

  /* ------------------------------------------------------------ broadcast */
  write(client, obj) {
    try {
      client.controller.enqueue(new TextEncoder().encode("data: " + JSON.stringify(obj) + "\n\n"));
      client.at = Date.now();
    } catch (e) {
      /* dead pipe - the cancel() handler will clean up */
    }
  }

  attachPos(room, view) {
    if (!view.players) return view;
    const now = Date.now();
    for (const p of view.players) {
      const q = room.pos.get(p.id);
      if (q && now - q.t < 5000) p.pos = { x: q.x, z: q.z, ry: q.ry };
    }
    return view;
  }

  pushState(room, pid, client, full) {
    const view = this.attachPos(room, room.game.snapshot(pid));
    if (!full) {
      if (view.you) delete view.you.inventory;
      if (view.you) delete view.you.history;
    }
    view.full = !!full;
    this.write(client, { t: "state", view });
  }

  pushRoomInfo(room, pid) {
    const c = room.clients.get(pid);
    if (!c) return;
    this.write(c, {
      t: "room", code: room.code, name: room.name,
      host: room.hostPid === pid,
      allowBots: room.game.getAllowBots(),
      difficulty: room.game.getDifficulty()
    });
  }

  pushSoon(room) {
    if (!room.clients.size) return;
    const now = Date.now();
    const wait = PUSH_MIN_MS - (now - (room.lastPush || 0));
    if (wait <= 0) { room.lastPush = now; this.broadcast(room, false); return; }
    if (room.pushQueued) return;
    room.pushQueued = true;
    setTimeout(() => {
      room.pushQueued = false;
      room.lastPush = Date.now();
      this.broadcast(room, false);
    }, wait);
  }

  broadcast(room, full) {
    for (const [pid, client] of room.clients) this.pushState(room, pid, client, full);
  }

  /* ---------------------------------------------------------------- ticker */
  ensurePump() {
    if (!this.pump) this.pump = setInterval(() => this.tick(), TICK_MS);
    if (this.sweeper) { clearTimeout(this.sweeper); this.sweeper = null; }
  }

  /* nobody is connected anywhere: stop the 100ms ticker and fall back to a cheap
     5s sweep whose only job is retiring stale rooms */
  slowDown() {
    this.stopPump();
    if (this.rooms.size && !this.sweeper) {
      this.sweeper = setTimeout(() => { this.sweeper = null; this.tick(); }, 5000);
    }
  }

  tick() {
    const now = Date.now();
    let live = 0;
    for (const [code, room] of Array.from(this.rooms)) {
      room.tickCount += 1;
      room.game.tick(now);
      if (room.tickCount % 10 === 0) room.game.incomeTick();
      this.broadcast(room, room.tickCount % BROADCAST_EVERY === 0);

      if (now - room.lastSeen > HEARTBEAT_MS) {
        for (const c of room.clients.values()) {
          try { c.controller.enqueue(new TextEncoder().encode(": ping\n\n")); } catch (e) {}
        }
      }

      if (room.tickCount % SAVE_EVERY === 0 && room.clients.size) {
        for (const pid of room.clients.keys()) {
          const profile = room.game.exportProfile(pid);
          if (profile) this.state.waitUntil(this.savePlayer(pid, profile));
        }
      }

      if (room.clients.size) live += 1;
      else if (now - room.lastSeen > ROOM_TTL_MS) this.destroyRoom(code);
    }
    if (!live) this.slowDown();
  }

  stopPump() {
    if (!this.pump) return;
    clearInterval(this.pump);
    this.pump = null;
  }
}

/* ============================================================================
 * Worker entry - everything /api/* goes to the Durable Object,
 * everything else is a static file from Cloudflare Assets.
 * ========================================================================== */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    if (url.pathname === "/api/ping") {
      // cheap liveness probe that does not wake the Durable Object
      return j({ ok: true, edge: true, ts: Date.now() });
    }

    if (url.pathname.startsWith("/api/")) {
      const id = env.GAMEHUB.idFromName("gamehub");
      return env.GAMEHUB.get(id).fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

/* per-card passive income, used for the leaderboard */
function incomeOf(profile) {
  let sum = 0;
  for (const item of (profile.inventory || [])) {
    const card = Engine.getCard(item.cardId);
    if (card) sum += card.income;
  }
  return sum;
}