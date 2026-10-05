/*
 * Card Auction - shared game engine
 * ---------------------------------
 * Runs unchanged in the browser (offline mode) and in Node (online mode).
 * Contains NO DOM code: the view renders from game.snapshot().
 *
 *   const game = CAEngine.createGame({ difficulty: "sharp" });
 *   game.join("me", "You", savedProfile);
 *   game.sit("me", 1);
 *   game.tick(Date.now());     // drive at CAEngine.TICK_MS
 *   const view = game.snapshot("me");
 */
(function (root, factory) {
  var api = factory();
  /* CommonJS: the local node server and the test scripts */
  if (typeof module === "object" && module.exports) module.exports = api;
  /* Global: the browser AND the Cloudflare Worker (where there is no `module`).
     One engine file, three runtimes, identical rules. */
  if (root) root.CAEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
"use strict";

/* ============================================================
   CONFIG - single source of truth
   ============================================================ */
const CONFIG = {
  startingCoins: 250,
  autosaveSeconds: 20,
  stationCount: 9,

  rarities: {
    COMMON:    { weight: 50, color: "#9aa4b2", order: 0 },
    UNCOMMON:  { weight: 25, color: "#5ee08a", order: 1 },
    RARE:      { weight: 13, color: "#3fb6ff", order: 2 },
    EPIC:      { weight: 7,  color: "#a98bff", order: 3 },
    LEGENDARY: { weight: 4,  color: "#ffc93c", order: 4, shimmer: true },
    MYTHIC:    { weight: 1,  color: "#ff4d6d", order: 5, animated: true }
  },

  cards: [
    { id: "street_player",   name: "Street Player",   rarity: "COMMON",    income: 1,   price: 150 },
    { id: "bench_warmer",    name: "Bench Warmer",    rarity: "COMMON",    income: 2,   price: 220 },
    { id: "iron_defender",   name: "Iron Defender",   rarity: "COMMON",    income: 3,   price: 320 },
    { id: "rising_star",     name: "Rising Star",     rarity: "COMMON",    income: 4,   price: 480 },
    { id: "skillful_winger", name: "Skillful Winger", rarity: "UNCOMMON",  income: 5,   price: 700 },
    { id: "golden_striker",  name: "Golden Striker",  rarity: "UNCOMMON",  income: 7,   price: 980 },
    { id: "thunder_keeper",  name: "Thunder Keeper",  rarity: "RARE",      income: 10,  price: 1400 },
    { id: "aerial_dancer",   name: "Aerial Dancer",   rarity: "RARE",      income: 13,  price: 1850 },
    { id: "elite_champion",  name: "Elite Champion",  rarity: "EPIC",      income: 18,  price: 2800 },
    { id: "world_legend",    name: "World Legend",    rarity: "EPIC",      income: 25,  price: 3600 },
    { id: "ultimate_icon",   name: "Ultimate Icon",   rarity: "LEGENDARY", income: 40,  price: 4500 },
    { id: "eternal_captain", name: "Eternal Captain", rarity: "LEGENDARY", income: 55,  price: 6000 },
    { id: "prime_icon",      name: "Prime Icon",      rarity: "MYTHIC",    income: 100, price: 12000 },
    { id: "cosmic_legend",   name: "Cosmic Legend",   rarity: "MYTHIC",    income: 150, price: 16000 }
  ],

  /* bot personalities - picked in the Offline mode screen */
  difficulties: {
    chill:    { label: "Chill",    blurb: "Bids small, folds fast",        ceilingPerIncome: 8,  minDelayMs: 1500, maxDelayMs: 3200, bluffs: 0 },
    sharp:    { label: "Sharp",    blurb: "Fair price, punishes greed",    ceilingPerIncome: 14, minDelayMs: 650,  maxDelayMs: 1600, bluffs: 0.15 },
    ruthless: { label: "Ruthless", blurb: "Will take you to the limit",    ceilingPerIncome: 24, minDelayMs: 320,  maxDelayMs: 950,  bluffs: 0.35 }
  },
  defaultDifficulty: "sharp",

  auction: {
    timerDuration: 15,
    seatCountdown: 3,
    finishDelay: 3,
    maxAuctionSeconds: 60,
    openingBid: 10,
    timeExtensionOnBid: 8,
    historyLimit: 50,
    bidCooldownMs: 250,
    botJoinDelay: 4
  },

  economy: { incomeTickSeconds: 1 }
};

/* ============================================================
   SHOP - characters, clothes, chair skins, luck, sell values
   One catalogue, used by the browser UI, the 3D world and the
   server. Prices are validated here so a hacked client cannot
   buy a 50 000 coin character for free.
   ============================================================ */
const SHOP = {
  /* 14 playable characters */
  characters: [
    { id: "char_rookie",  name: "Rookie",   price: 0,     skin: "#f3c69a", hair: "#4a3427", hairStyle: "short", build: 1.00, defaultShirt: "top_tee",     defaultPants: "pant_jeans" },
    { id: "char_blaze",   name: "Blaze",    price: 750,   skin: "#d9a06b", hair: "#16120f", hairStyle: "spiky",  build: 1.05, defaultShirt: "top_hoodie",   defaultPants: "pant_cargo" },
    { id: "char_milo",    name: "Milo",     price: 1300,  skin: "#e0b088", hair: "#1b1b22", hairStyle: "buzz",   build: 1.03, defaultShirt: "top_stripe2",  defaultPants: "pant_shorts2" },
    { id: "char_nova",    name: "Nova",     price: 1800,  skin: "#7a4b2e", hair: "#f2d67b", hairStyle: "long",   build: 0.95, defaultShirt: "top_tank",     defaultPants: "pant_shorts" },
    { id: "char_kai",     name: "Kai",      price: 3500,  skin: "#e8b98a", hair: "#0f1116", hairStyle: "short",  build: 1.10, defaultShirt: "top_stripe",   defaultPants: "pant_jeans" },
    { id: "char_iris",    name: "Iris",     price: 4800,  skin: "#ffdcb8", hair: "#7b4b2a", hairStyle: "long",   build: 0.96, defaultShirt: "top_hoodie2",  defaultPants: "pant_jeans2" },
    { id: "char_luna",    name: "Luna",     price: 6000,  skin: "#f7d7c0", hair: "#c8452f", hairStyle: "long",   build: 0.92, defaultShirt: "top_tee2",     defaultPants: "pant_track" },
    { id: "char_rex",     name: "Rex",      price: 9000,  skin: "#c98a52", hair: "#8f8f8f", hairStyle: "buzz",   build: 1.15, defaultShirt: "top_jacket",   defaultPants: "pant_cargo" },
    { id: "char_zara",    name: "Zara",     price: 14000, skin: "#5b3620", hair: "#efefef", hairStyle: "long",   build: 0.98, defaultShirt: "top_gold",     defaultPants: "pant_suit" },
    { id: "char_sable",   name: "Sable",    price: 16000, skin: "#8a5a3c", hair: "#2a1a2e", hairStyle: "long",   build: 1.04, defaultShirt: "top_tank2",    defaultPants: "pant_track2" },
    { id: "char_ace",     name: "Ace",      price: 22000, skin: "#f0c8a0", hair: "#3fa9ff", hairStyle: "spiky",  build: 1.08, defaultShirt: "top_gold",     defaultPants: "pant_suit" },
    { id: "char_phantom", name: "Phantom",  price: 34000, skin: "#dcd6e6", hair: "#101018", hairStyle: "hood",   build: 1.06, defaultShirt: "top_jacket",   defaultPants: "pant_suit" },
    { id: "char_glacier", name: "Glacier",  price: 45000, skin: "#eaf4ff", hair: "#cfe6ff", hairStyle: "spiky",  build: 1.00, defaultShirt: "top_suit2",    defaultPants: "pant_suit2" },
    { id: "char_titan",   name: "Titan",    price: 52000, skin: "#b9773f", hair: "#2a1a10", hairStyle: "buzz",   build: 1.22, defaultShirt: "top_jacket",   defaultPants: "pant_cargo" }
  ],

  /* shirts / tops */
  shirts: [
    { id: "top_tee",     name: "Plain Tee",      price: 0,     color: "#3fb6ff", trim: "#ffffff", kind: "tee" },
    { id: "top_tee2",    name: "Sky Tee",        price: 450,   color: "#7fd6ff", trim: "#ffffff", kind: "tee" },
    { id: "top_stripe",  name: "Striped Tee",    price: 600,   color: "#f2f3f7", trim: "#e04a4a", kind: "stripe" },
    { id: "top_stripe2", name: "Candy Stripe",   price: 1100,  color: "#ffe9f0", trim: "#ff5a8a", kind: "stripe" },
    { id: "top_hoodie",  name: "Hoodie",         price: 2200,  color: "#e0575f", trim: "#c9ceda", kind: "hoodie" },
    { id: "top_hoodie2", name: "Mint Hoodie",    price: 3400,  color: "#4ec9c0", trim: "#ffffff", kind: "hoodie" },
    { id: "top_tank",    name: "Tank Top",       price: 4200,  color: "#2fd39a", trim: "#ffffff", kind: "tank" },
    { id: "top_tank2",   name: "Sunset Tank",    price: 5600,  color: "#ff8a3d", trim: "#ffffff", kind: "tank" },
    { id: "top_jacket",  name: "Leather Jacket", price: 8500,  color: "#6b4326", trim: "#d9b64a", kind: "jacket" },
    { id: "top_jacket2", name: "Denim Jacket",   price: 11000, color: "#4a6fa5", trim: "#e9eef7", kind: "jacket" },
    { id: "top_gold",    name: "Gold Suit",      price: 18000, color: "#e8b84b", trim: "#2a2a33", kind: "suit" },
    { id: "top_suit2",   name: "Royal Suit",     price: 26000, color: "#2f3b7a", trim: "#d4b45a", kind: "suit" }
  ],

  /* trousers */
  pants: [
    { id: "pant_jeans",  name: "Jeans",       price: 0,     color: "#3d5a8a", kind: "jeans" },
    { id: "pant_shorts", name: "Shorts",      price: 500,   color: "#c7c9d4", kind: "shorts" },
    { id: "pant_jeans2", name: "Light Jeans", price: 650,   color: "#7d9ac4", kind: "jeans" },
    { id: "pant_shorts2",name: "Cargo Shorts",price: 1400,  color: "#6f7a5a", kind: "shorts" },
    { id: "pant_cargo",  name: "Cargo Pants", price: 1900,  color: "#5c6447", kind: "cargo" },
    { id: "pant_cargo2", name: "Army Cargo",  price: 2900,  color: "#4b5340", kind: "cargo" },
    { id: "pant_track",  name: "Tracksuit",   price: 4600,  color: "#22262f", kind: "track" },
    { id: "pant_track2", name: "Red Tracksuit",price: 6400, color: "#b8342f", kind: "track" },
    { id: "pant_suit",   name: "Suit Pants",  price: 9000,  color: "#2b2f3a", kind: "suit" },
    { id: "pant_suit2",  name: "Gold Pants",  price: 15000, color: "#6b5a2a", kind: "suit" }
  ],

  /* footwear */
  shoes: [
    { id: "shoe_sneakers", name: "Sneakers",        price: 0,     color: "#f2f2f2", sole: "#d9d9d9" },
    { id: "shoe_sneakers2",name: "Canvas Sneakers", price: 550,   color: "#e8e2d0", sole: "#b9ae95" },
    { id: "shoe_runners",  name: "Runners",         price: 700,   color: "#ff5a5f", sole: "#ffffff" },
    { id: "shoe_runners2", name: "Neon Runners",    price: 1500,  color: "#25e0c0", sole: "#0f8f7c" },
    { id: "shoe_boots",    name: "Boots",           price: 2400,  color: "#4a3524", sole: "#2a2018" },
    { id: "shoe_boots2",   name: "Steel Boots",     price: 3800,  color: "#5b6673", sole: "#2f3742" },
    { id: "shoe_hightops", name: "High-Tops",       price: 5200,  color: "#1b1e28", sole: "#ffd166" },
    { id: "shoe_hightops2",name: "Gold High-Tops",  price: 7800,  color: "#d9b64a", sole: "#6b5215" },
    { id: "shoe_gold",     name: "Gold Kicks",      price: 12000, color: "#f2c14e", sole: "#8a6b1f" },
    { id: "shoe_crystal",  name: "Crystal Kicks",   price: 20000, color: "#dfe9ff", sole: "#93a9d4" }
  ],

  /* hats */
  caps: [
    { id: "hat_none",    name: "No Hat",         price: 0,     color: "#e04a4a", kind: "none" },
    { id: "hat_cap",     name: "Cap",            price: 900,   color: "#e04a4a", kind: "cap" },
    { id: "hat_cap2",    name: "Navy Cap",       price: 1300,  color: "#2b4a8f", kind: "cap" },
    { id: "hat_beanie",  name: "Beanie",         price: 1600,  color: "#4ec9c0", kind: "beanie" },
    { id: "hat_cap3",    name: "Teal Cap",       price: 1900,  color: "#2fb8a8", kind: "cap" },
    { id: "hat_beanie2", name: "Red Beanie",     price: 2200,  color: "#d9433f", kind: "beanie" },
    { id: "hat_beanie3", name: "Grey Beanie",    price: 2900,  color: "#8e93a3", kind: "beanie" },
    { id: "hat_beanie4", name: "Purple Beanie",  price: 3600,  color: "#8b5cf6", kind: "beanie" },
    { id: "hat_fedora",  name: "Fedora",         price: 5600,  color: "#2f2b33", kind: "fedora" },
    { id: "hat_fedora2", name: "Tan Fedora",     price: 7200,  color: "#a97446", kind: "fedora" },
    { id: "hat_crown",   name: "Crown",          price: 26000, color: "#ffd45e", kind: "crown" },
    { id: "hat_crown2",  name: "Ice Crown",      price: 38000, color: "#bfe4ff", kind: "crown" }
  ],

  /* chair skins - visible the moment you sit down */
  chairs: [
    { id: "chair_wood",    name: "Wood",         price: 0,     color: "#8a5a2b", accent: "#5e3d1e" },
    { id: "chair_wood2",   name: "Rustic Chair", price: 900,   color: "#a9713d", accent: "#6b4522" },
    { id: "chair_velvet",  name: "Red Velvet",   price: 1500,  color: "#c22f45", accent: "#8d1f30" },
    { id: "chair_blue",    name: "Royal Blue",   price: 2800,  color: "#2f56b0", accent: "#1c3576" },
    { id: "chair_green",   name: "Emerald",      price: 4200,  color: "#2fae7a", accent: "#1c7350" },
    { id: "chair_gold",    name: "Gold Throne",  price: 7000,  color: "#f0c34a", accent: "#a67c14" },
    { id: "chair_neon",    name: "Neon Glow",    price: 14000, color: "#25e0c0", accent: "#0f8f7c", glow: true },
    { id: "chair_diamond", name: "Diamond",      price: 32000, color: "#dfe9ff", accent: "#93a9d4", shine: true }
  ],

  /* luck - each level makes rare cards more likely */
  luck: [
    { id: "luck_0", name: "Base Luck", price: 0,     level: 0 },
    { id: "luck_1", name: "Lucky I",   price: 1500,  level: 1 },
    { id: "luck_2", name: "Lucky II",  price: 4500,  level: 2 },
    { id: "luck_3", name: "Lucky III", price: 12000, level: 3 },
    { id: "luck_4", name: "Lucky IV",  price: 30000, level: 4 },
    { id: "luck_5", name: "Lucky V",   price: 75000, level: 5 }
  ],

  /* what a card is worth when you sell it from the collection */
  sellPrices: { COMMON: 60, UNCOMMON: 160, RARE: 450, EPIC: 1300, LEGENDARY: 4200, MYTHIC: 15000 }
};

const SHOP_CATS = ["characters", "shirts", "pants", "shoes", "caps", "chairs", "luck"];
const EQUIP_FIELD = {
  characters: "character", shirts: "shirt", pants: "pants",
  shoes: "shoes", caps: "cap", chairs: "chair"
};
const SHOP_INDEX = new Map();
SHOP_CATS.forEach((cat) => SHOP[cat].forEach((it) => {
  SHOP_INDEX.set(it.id, { cat: cat, item: it });
}));
const shopItem = (id) => (SHOP_INDEX.get(id) || null);
const shopPrice = (id) => { const e = SHOP_INDEX.get(id); return e ? (e.item.price || 0) : 0; };

function defaultCosmetics() {
  return {
    character: "char_rookie",
    shirt: "top_tee",
    pants: "pant_jeans",
    shoes: "shoe_sneakers",
    cap: "hat_none",
    chair: "chair_wood",
    luck: 0,
    owned: {
      characters: ["char_rookie"], shirts: ["top_tee"], pants: ["pant_jeans"],
      shoes: ["shoe_sneakers"], caps: ["hat_none"], chairs: ["chair_wood"], luck: [0]
    }
  };
}
function ownedList(cos, cat) {
  const map = {
    characters: "characters", shirts: "shirts", pants: "pants",
    shoes: "shoes", caps: "caps", chairs: "chairs", luck: "luck"
  };
  const key = map[cat];
  if (!key) return null;
  if (!Array.isArray(cos.owned[key])) cos.owned[key] = [];
  return cos.owned[key];
}
function sanitizeCosmetics(raw) {
  const out = defaultCosmetics();
  if (!raw || typeof raw !== "object") return out;
  const has = (id) => !!shopItem(id);
  const take = (field, cat) => {
    const v = raw[field];
    if (typeof v === "string" && has(v) && (SHOP_INDEX.get(v) || {}).cat === cat) out[field] = v;
  };
  take("character", "characters"); take("shirt", "shirts"); take("pants", "pants");
  take("shoes", "shoes"); take("cap", "caps"); take("chair", "chairs");
  out.luck = Math.max(0, Math.min(5, clampInt(raw.luck)));
  const rawOwned = raw.owned && typeof raw.owned === "object" ? raw.owned : {};
  SHOP_CATS.forEach((cat) => {
    const key = cat;
    const src = Array.isArray(rawOwned[key]) ? rawOwned[key] : [];
    const good = src.filter((id) => {
      const e = SHOP_INDEX.get(id);
      return e && e.cat === cat;
    });
    const base = ownedList(out, cat);
    const def = defaultCosmetics().owned[cat];
    def.forEach((id) => { if (good.indexOf(id) < 0) good.push(id); });
    out.owned[key] = good.filter((id, i) => good.indexOf(id) === i);
    void base;
  });
  out.luck = Math.max(out.luck, 0);
  // luck level must match the highest owned luck entry
  let top = 0;
  out.owned.luck.forEach((l) => { const n = Number(l); if (Number.isFinite(n) && n > top) top = n; });
  out.luck = top;
  // everything that is equipped must actually be owned
  const checkEq = (field, cat) => {
    if (ownedList(out, cat).indexOf(out[field]) < 0) {
      out[field] = defaultCosmetics()[field];
      if (ownedList(out, cat).indexOf(out[field]) < 0) ownedList(out, cat).push(out[field]);
    }
  };
  checkEq("character", "characters"); checkEq("shirt", "shirts"); checkEq("pants", "pants");
  checkEq("shoes", "shoes"); checkEq("cap", "caps"); checkEq("chair", "chairs");
  return out;
}

function randomCosmetics(rng) {
  const out = defaultCosmetics();
  const r = rng || Math.random;
  const pick = (list) => list[Math.floor(r() * list.length) % list.length];
  const ch = pick(SHOP.characters);
  out.character = ch.id;
  out.shirt = ch.defaultShirt;
  out.pants = ch.defaultPants;
  out.shoes = pick(SHOP.shoes).id;
  out.chair = pick(SHOP.chairs).id;
  out.cap = r() < 0.3 ? pick(SHOP.caps.slice(1)).id : "hat_none";
  return out;
}

const TICK_MS = 100;
const ST = { EMPTY: "EMPTY", WAITING: "WAITING", STARTING: "STARTING", ACTIVE: "ACTIVE", FINISHED: "FINISHED" };

const cardById = new Map(CONFIG.cards.map((c) => [c.id, c]));
const getCard = (id) => cardById.get(id) || null;
const getRarity = (name) => CONFIG.rarities[name] || CONFIG.rarities.COMMON;

function makeIid(prefix) {
  return (prefix || "c") + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36);
}
function clampInt(n) { return Number.isFinite(n) ? Math.floor(n) : 0; }
function rand(a, b, rng) { return a + rng() * (b - a); }
function bidIncrement(bid) {
  if (bid < 50) return 5;
  if (bid < 200) return 10;
  if (bid < 500) return 25;
  return 50;
}
function minNextBid(st) {
  if (st.currentBid <= 0) return CONFIG.auction.openingBid;
  return st.currentBid + bidIncrement(st.currentBid);
}

/* Luck shifts the same weights: higher levels push RARE and above up
   and COMMON down. Level 0 is the original balance, unchanged. */
function luckWeight(c, luck) {
  const r = CONFIG.rarities[c.rarity];
  const L = Math.max(0, Math.min(5, luck | 0));
  if (L === 0) return r.weight;
  if (r.order >= 2) return r.weight * (1 + L * 0.45);
  if (r.order === 1) return r.weight * (1 + L * 0.12);
  return r.weight * Math.max(0.2, 1 - L * 0.1);
}
function rollCard(rng, luck) {
  const L = luck | 0;
  let total = 0;
  for (const c of CONFIG.cards) total += luckWeight(c, L);
  let roll = rng() * total;
  for (const c of CONFIG.cards) {
    roll -= luckWeight(c, L);
    if (roll <= 0) return c;
  }
  return CONFIG.cards[0];
}

function defaultProfile() {
  return {
    name: "You",
    color: "#3fb6ff",
    coins: CONFIG.startingCoins,
    gems: 0,
    held: 0,
    inventory: [],
    history: [],
    stats: { won: 0, played: 0, spent: 0 },
    totalEarned: 0,
    createdAt: Math.floor(Date.now() / 1000),
    cosmetics: defaultCosmetics(),
    prog: defaultProg()
  };
}

/* Accepts anything and always returns a playable profile. */
function sanitizeProfile(raw) {
  const out = defaultProfile();
  if (!raw || typeof raw !== "object") return out;
  if (typeof raw.name === "string" && raw.name.trim()) out.name = raw.name.trim().slice(0, 20);
  if (typeof raw.color === "string" && /^#[0-9a-f]{6}$/i.test(raw.color)) out.color = raw.color;
  // only overwrite the defaults when a real value came in - a partial save
  // must not wipe the starting balance back to zero
  if (raw.coins != null && Number.isFinite(Number(raw.coins))) out.coins = Math.max(0, Math.floor(Number(raw.coins)));
  if (raw.gems != null && Number.isFinite(Number(raw.gems))) out.gems = Math.max(0, Math.floor(Number(raw.gems)));
  if (raw.totalEarned != null && Number.isFinite(Number(raw.totalEarned))) out.totalEarned = Math.max(0, Math.floor(Number(raw.totalEarned)));
  out.createdAt = clampInt(raw.createdAt) || out.createdAt;
  if (raw.stats && typeof raw.stats === "object") {
    out.stats.won = Math.max(0, clampInt(raw.stats.won));
    out.stats.played = Math.max(0, clampInt(raw.stats.played));
    out.stats.spent = Math.max(0, clampInt(raw.stats.spent));
  }
  if (Array.isArray(raw.inventory)) {
    const seen = new Set();
    for (const item of raw.inventory) {
      if (!item || typeof item !== "object") continue;
      const card = getCard(item.cardId);
      if (!card) continue;
      let iid = typeof item.iid === "string" && item.iid ? item.iid : makeIid();
      if (seen.has(iid)) continue;
      seen.add(iid);
      out.inventory.push({ iid, cardId: card.id, at: clampInt(item.at) || Date.now(), price: Math.max(0, clampInt(item.price)) });
    }
  }
  if (Array.isArray(raw.history)) {
    out.history = raw.history
      .filter((h) => h && typeof h === "object" && getCard(h.cardId))
      .slice(-CONFIG.auction.historyLimit);
  }
  const held = Math.max(0, clampInt(raw.held));
  if (held > 0) out.coins += held;   // session died mid-bid: money back
  out.cosmetics = sanitizeCosmetics(raw.cosmetics);
  out.prog = sanitizeProg(raw.prog);
  return out;
}

function sanitizePlayer(raw) {
  return sanitizeProfile(raw);
}

/* ============================================================
   PROGRESSION  -  XP / levels, win streak, titles, daily rewards,
   daily missions and achievements.

   Two rules keep this honest:
   1. Progress only moves because of ENGINE EVENTS (a bid, a round, an
      income tick). The client can ask to CLAIM a reward, never to claim
      it already happened.
   2. The browser copy (offline practice) and the server copy (online)
      run this exact same code, so both wallets progress identically
      while never touching each other's balances.
   ============================================================ */
const MISSION_POOL = [
  { id: "win2",   text: "Win 2 auctions",     goal: 2,   reward: 2500, stat: "wins" },
  { id: "bid10",  text: "Place 10 bids",      goal: 10,  reward: 1200, stat: "bids" },
  { id: "earn5k", text: "Earn 5,000 coins",   goal: 5000, reward: 1800, stat: "earned" },
  { id: "play3",  text: "Play 3 matches",     goal: 3,   reward: 1500, stat: "matches" },
  { id: "pass3",  text: "Pass on 3 auctions", goal: 3,   reward: 900,  stat: "passes" },
  { id: "sit4",   text: "Sit at 4 tables",    goal: 4,   reward: 700,  stat: "sits" }
];
const ACHIEVEMENTS = [
  { id: "firstWin",   name: "First Win",     text: "Win your first auction.",          stat: "wins",   goal: 1,      reward: 500 },
  { id: "bigSpender", name: "Big Spender",   text: "Spend 100,000 coins.",             stat: "spent",  goal: 100000, reward: 2500 },
  { id: "collector",  name: "Collector",     text: "Own 25 cards.",                    stat: "cards",  goal: 25,     reward: 3000 },
  { id: "legend",     name: "Legend",        text: "Own a Legendary card or better.",  stat: "legend", goal: 1,       reward: 5000 },
  { id: "auctionKing",name: "Auction King",  text: "Win 100 auctions.",                stat: "wins",   goal: 100,    reward: 10000 }
];
/* Titles are cosmetic only - never a gameplay bonus. */
const TITLES = [
  { id: "t_new",    name: "New Bidder",     stat: null,    goal: 0 },
  { id: "t_rookie", name: "Auction Rookie", stat: "wins",  goal: 1 },
  { id: "t_dealer", name: "Dealer",         stat: "wins",  goal: 10 },
  { id: "t_col",    name: "Collector",      stat: "cards", goal: 15 },
  { id: "t_roll",   name: "High Roller",    stat: "spent", goal: 50000 },
  { id: "t_king",   name: "Auction King",   stat: "wins",  goal: 100 },
  { id: "t_legend", name: "Legend",         stat: "legend", goal: 1 }
];
const REWARD_DAYS = [
  { coins: 500 },
  { coins: 750, gems: 5 },
  { coins: 1000 },
  { card: "any" },
  { coins: 2000, gems: 10 },
  { card: "rare" },
  { coins: 5000, card: "epic", gems: 25 }
];

/* Weekly missions - three per ISO week, rolled from a week-seeded generator
   exactly like the dailies so everyone sees the same three. */
const WEEKLY_POOL = [
  { id: "w_win10",    text: "Win 10 auctions",        goal: 10,     reward: 12000, stat: "wins" },
  { id: "w_bid50",    text: "Place 50 bids",         goal: 50,     reward: 8000,  stat: "bids" },
  { id: "w_earn100k", text: "Earn 100,000 coins",    goal: 100000, reward: 15000, stat: "earned" },
  { id: "w_cards25",  text: "Own 25 cards",          goal: 25,     reward: 10000, stat: "cards" },
  { id: "w_streak5",  text: "Reach a 5 win streak",  goal: 5,      reward: 9000,  stat: "best" }
];
function weeklyDef(id) {
  for (let i = 0; i < WEEKLY_POOL.length; i++) if (WEEKLY_POOL[i].id === id) return WEEKLY_POOL[i];
  return null;
}
function isoWeekKey(ts) {
  const d = ts == null ? new Date() : new Date(ts);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + "-W" + String(Math.ceil(((t - yearStart) / 86400000 + 1) / 7)).padStart(2, "0");
}
function rollWeekly(seedStr) {
  // deterministic from the week key, so a reload never reshuffles
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = (h * 16777619) >>> 0; }
  const pool = WEEKLY_POOL.slice();
  const out = [];
  for (let k = 0; k < 3 && pool.length; k++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const i = h % pool.length;
    out.push({ id: pool[i].id, prog: 0, claimed: false });
    pool.splice(i, 1);
  }
  return out;
}
function ensureWeekly(p) {
  const pr = progOf(p);
  const key = isoWeekKey();
  if (pr.weekKey !== key) { pr.weekKey = key; pr.weekly = rollWeekly(key); }
  else if (!Array.isArray(pr.weekly)) pr.weekly = rollWeekly(key);
  return pr;
}
function claimWeekly(p, id) {
  const pr = ensureWeekly(p);
  const def = weeklyDef(id);
  if (!def) return { ok: false, why: "That weekly mission does not exist." };
  const row = pr.weekly.find((m) => m.id === id);
  if (!row) return { ok: false, why: "That weekly mission is not running this week." };
  if (row.claimed) return { ok: false, why: "You already claimed that one." };
  const value = weeklyValue(p, def);
  if (value < def.goal) return { ok: false, why: "Not finished yet." };
  row.claimed = true;
  p.coins += def.reward;
  return { ok: true, coins: def.reward };
}
function weeklyValue(p, def) {
  const pr = progOf(p);
  if (def.stat === "cards") return (p.inventory || []).length;
  if (def.stat === "best") return pr.best;
  return pr[def.stat] || 0;
}

function missionDef(id) {
  for (let i = 0; i < MISSION_POOL.length; i++) if (MISSION_POOL[i].id === id) return MISSION_POOL[i];
  return null;
}
function defaultProg() {
  return {
    xp: 0, streak: 0, best: 0, title: "t_new",
    bids: 0, earned: 0, passes: 0, sits: 0, winsAll: 0,
    day: 0, dayAt: -1,
    dailyDay: "", daily: [],
    weekKey: "", weekly: [],
    ach: {}, achGot: {}
  };
}
function coerceProg(pr) {
  const d = defaultProg();
  pr.xp = Math.max(0, clampInt(pr.xp));
  pr.streak = Math.max(0, clampInt(pr.streak));
  pr.best = Math.max(0, clampInt(pr.best));
  pr.bids = Math.max(0, clampInt(pr.bids));
  pr.earned = Math.max(0, clampInt(pr.earned));
  pr.passes = Math.max(0, clampInt(pr.passes));
  pr.sits = Math.max(0, clampInt(pr.sits));
  pr.winsAll = Math.max(0, clampInt(pr.winsAll));
  pr.day = Math.max(0, Math.min(7, clampInt(pr.day)));
  pr.dayAt = Number.isFinite(Number(pr.dayAt)) ? Math.floor(Number(pr.dayAt)) : -1;
  pr.dailyDay = typeof pr.dailyDay === "string" ? pr.dailyDay : d.dailyDay;
  pr.weekKey = typeof pr.weekKey === "string" ? pr.weekKey : d.weekKey;
  pr.title = typeof pr.title === "string" ? pr.title : d.title;
  if (!Array.isArray(pr.daily)) pr.daily = [];
  if (!Array.isArray(pr.weekly)) pr.weekly = [];
  if (!pr.ach || typeof pr.ach !== "object") pr.ach = {};
  if (!pr.achGot || typeof pr.achGot !== "object") pr.achGot = {};
  let known = false;
  for (const t of TITLES) if (t.id === pr.title) known = true;
  if (!known) pr.title = "t_new";
  return pr;
}
function sanitizeProg(raw) {
  const out = defaultProg();
  if (raw && typeof raw === "object") {
    out.xp = raw.xp; out.streak = raw.streak; out.best = raw.best; out.title = raw.title;
    out.bids = raw.bids; out.earned = raw.earned; out.passes = raw.passes; out.sits = raw.sits; out.winsAll = raw.winsAll;
    out.day = raw.day; out.dayAt = raw.dayAt; out.dailyDay = raw.dailyDay;
    out.weekKey = raw.weekKey; out.weekly = raw.weekly;
    out.daily = raw.daily; out.ach = raw.ach; out.achGot = raw.achGot;
  }
  return coerceProg(out);
}
function progOf(p) {
  if (!p || typeof p !== "object") return defaultProg();
  if (!p.prog || typeof p.prog !== "object") p.prog = defaultProg();
  return coerceProg(p.prog);
}

function xpForLevel(l) { return 100 + Math.max(0, l - 1) * 60; }
function levelOf(xp) {
  let lvl = 1, rest = Math.max(0, clampInt(xp));
  while (lvl < 99 && rest >= xpForLevel(lvl)) { rest -= xpForLevel(lvl); lvl += 1; }
  return { level: lvl, into: rest, need: xpForLevel(lvl) };
}
function addXp(p, n) {
  const pr = progOf(p);
  const before = levelOf(pr.xp).level;
  pr.xp = Math.max(0, pr.xp + Math.max(0, clampInt(n)));
  return levelOf(pr.xp).level > before;
}
function utcDay(ts) { return Math.floor((ts == null ? Date.now() : ts) / 86400000); }

/* Daily missions are rolled ONCE per UTC day from a day-seeded generator,
   so everyone sees the same four missions today and the roll is stable
   across reloads (no RNG state to save). */
function rollDaily(seed) {
  let s = (clampInt(seed) % 2147483646) + 1;
  const rnd = function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const pool = MISSION_POOL.slice();
  const out = [];
  while (out.length < 4 && pool.length) {
    const i = Math.max(0, Math.min(pool.length - 1, Math.floor(rnd() * pool.length)));
    out.push({ id: pool[i].id, prog: 0, claimed: false });
    pool.splice(i, 1);
  }
  return out;
}
function ensureDaily(p) {
  const pr = progOf(p);
  const day = utcDay();
  const key = String(day);
  if (pr.dailyDay !== key) { pr.dailyDay = key; pr.daily = rollDaily(day); }
  return pr;
}
function bumpDaily(p, stat, amount) {
  const pr = ensureDaily(p);
  const inc = Math.max(0, clampInt(amount));
  for (const m of pr.daily) {
    const def = missionDef(m.id);
    if (!def || def.stat !== stat || m.claimed) continue;
    if (m.prog < def.goal) m.prog = Math.min(def.goal, m.prog + inc);
  }
}
function rollCardOf(rngFn, maxOrder) {
  const r = typeof rngFn === "function" ? rngFn : Math.random;
  for (let i = 0; i < 60; i++) {
    const c = rollCard(r, 0);
    if (getRarity(c.rarity).order <= maxOrder) return c;
  }
  const safe = CONFIG.cards.filter((c) => getRarity(c.rarity).order <= maxOrder);
  return safe.length ? safe[Math.floor(r() * safe.length)] : CONFIG.cards[0];
}
function achValue(p, a) {
  const pr = progOf(p);
  switch (a.stat) {
    case "wins": return p.stats ? p.stats.won : 0;
    case "spent": return p.stats ? p.stats.spent : 0;
    case "cards": return (p.inventory || []).length;
    case "legend":
      return (p.inventory || []).some((it) => {
        const c = getCard(it.cardId);
        return !!c && getRarity(c.rarity).order >= 4;
      }) ? 1 : 0;
    case "streak": return pr.best;
    default: return 0;
  }
}
function titleUnlocked(p, t) {
  if (!t || !t.stat) return true;
  return achValue(p, { stat: t.stat }) >= t.goal;
}
/* returns the achievements that just unlocked (so the game can announce them) */
function refreshAchievements(p) {
  const pr = progOf(p);
  const un = [];
  for (const a of ACHIEVEMENTS) {
    if (pr.ach[a.id]) continue;
    if (achValue(p, a) >= a.goal) {
      pr.ach[a.id] = Math.floor(Date.now() / 1000);
      un.push(a);
    }
  }
  return un;
}
function nextRewardDay(pr) {
  const today = utcDay();
  if (pr.dayAt === today) return 0;
  if (pr.dayAt === today - 1) return (pr.day % 7) + 1;
  return 1;
}
function claimDaily(p, rngFn) {
  const pr = ensureDaily(p);
  const next = nextRewardDay(pr);
  if (!next) return shopError("You already claimed today's reward.");
  const def = REWARD_DAYS[next - 1];
  pr.day = next;
  pr.dayAt = utcDay();
  const got = { day: next, coins: 0, gems: 0, card: null };
  if (def.coins) { p.coins += def.coins; got.coins = def.coins; }
  if (def.gems) { p.gems = Math.max(0, (p.gems | 0) + def.gems); got.gems = def.gems; }
  if (def.card) {
    const card = rollCardOf(rngFn, def.card === "rare" ? 2 : def.card === "epic" ? 3 : 5);
    if (card) {
      p.inventory.push({ iid: makeIid(), cardId: card.id, at: Math.floor(Date.now() / 1000), price: 0 });
      got.card = { name: card.name, rarity: card.rarity };
    }
  }
  addXp(p, 30);
  refreshAchievements(p);
  return { ok: true, reward: got };
}
function claimMission(p, id) {
  const pr = ensureDaily(p);
  const def = missionDef(id);
  let m = null;
  for (const x of pr.daily) if (x.id === id) m = x;
  if (!m || !def) return shopError("That mission is not running today.");
  if (m.claimed) return shopError("That reward was already claimed.");
  if (m.prog < def.goal) return shopError("Mission not finished yet.");
  m.claimed = true;
  p.coins += def.reward;
  addXp(p, 60);
  refreshAchievements(p);
  return { ok: true, coins: def.reward };
}
function claimAch(p, id) {
  const pr = progOf(p);
  let def = null;
  for (const a of ACHIEVEMENTS) if (a.id === id) def = a;
  if (!def) return shopError("Unknown achievement.");
  if (!pr.ach[id]) return shopError("Achievement not unlocked yet.");
  if (pr.achGot[id]) return shopError("That reward was already claimed.");
  pr.achGot[id] = 1;
  p.coins += def.reward;
  addXp(p, 80);
  return { ok: true, coins: def.reward };
}
function setTitle(p, id) {
  const pr = progOf(p);
  let t = null;
  for (const x of TITLES) if (x.id === id) t = x;
  if (!t) return shopError("Unknown title.");
  if (!titleUnlocked(p, t)) return shopError("That title is still locked.");
  pr.title = t.id;
  return { ok: true };
}
function progView(p) {
  if (!p) return null;
  // a view can travel inside a profile (the online mirror) and a view has no
  // `.prog` of its own - hand it straight back instead of coercing it
  if (p.prog && typeof p.prog.level === "number" && Array.isArray(p.prog.missions)) return p.prog;
  const pr = ensureDaily(p);
  const wk = ensureWeekly(p);
  const lv = levelOf(pr.xp);
  const today = utcDay();
  return {
    xp: pr.xp, level: lv.level, into: lv.into, need: lv.need,
    streak: pr.streak, best: pr.best, title: pr.title,
    titles: TITLES.map((t) => ({ id: t.id, name: t.name, on: titleUnlocked(p, t) })),
    day: pr.day, dayAt: pr.dayAt, canClaim: pr.dayAt !== today, nextDay: nextRewardDay(pr),
    rewards: REWARD_DAYS,
    gems: p.gems || 0,
    missions: pr.daily.map((m) => {
      const d = missionDef(m.id) || { text: m.id, goal: 1, reward: 0 };
      return { id: m.id, text: d.text, goal: d.goal, prog: m.prog, reward: d.reward, claimed: !!m.claimed };
    }),
    weekly: wk.weekly.map((m) => {
      const d = weeklyDef(m.id) || { text: m.id, goal: 1, reward: 0 };
      return {
        id: m.id, text: d.text, goal: d.goal, reward: d.reward,
        prog: Math.min(d.goal, weeklyValue(p, d)), claimed: !!m.claimed
      };
    }),
    achievements: ACHIEVEMENTS.map((a) => ({
      id: a.id, name: a.name, text: a.text, goal: a.goal,
      prog: Math.min(a.goal, achValue(p, a)), reward: a.reward,
      on: !!pr.ach[a.id], got: !!pr.achGot[a.id]
    })),
    counters: { bids: pr.bids, earned: pr.earned, passes: pr.passes, sits: pr.sits, wins: pr.winsAll }
  };
}

/* ---- shop rules, shared by the room and by the local profile ---- */
function shopError(text) { return { ok: false, why: text }; }

/* put an item on the profile (shared by buy and equip) */
function wearIt(cos, cat, id) {
  const field = EQUIP_FIELD[cat];
  if (!field) return false;
  cos[field] = id;
  if (cat === "characters") {
    const e = SHOP_INDEX.get(id);
    if (e) {
      if (ownedList(cos, "shirts").indexOf(e.item.defaultShirt) >= 0) cos.shirt = e.item.defaultShirt;
      if (ownedList(cos, "pants").indexOf(e.item.defaultPants) >= 0) cos.pants = e.item.defaultPants;
    }
  }
  return true;
}

function buyInto(p, cat, id) {
  if (!p) return shopError("Join a game first.");
  if (!cat || SHOP_CATS.indexOf(cat) < 0 || !Array.isArray(SHOP[cat])) return shopError("Unknown shop section.");
  const item = SHOP[cat].find((i) => i.id === id);
  if (!item) return shopError("That item is not in the shop.");
  if (!p.cosmetics) p.cosmetics = defaultCosmetics();
  const cos = p.cosmetics;
  const owned = ownedList(cos, cat);
  if (owned.indexOf(id) >= 0) return shopError("You already own that.");
  if (cat === "luck") {
    const lvl = Number(item.level) || 0;
    if (lvl !== (cos.luck | 0) + 1) return shopError("Buy the previous luck level first.");
  }
  const price = Math.max(0, Math.floor(item.price || 0));
  if ((p.coins | 0) < price) return shopError("Not enough coins.");
  p.coins -= price;
  if (owned.indexOf(id) < 0) owned.push(id);
  if (cat === "luck") cos.luck = Math.max(0, Math.min(5, Number(item.level) || 0));
  else wearIt(cos, cat, id);                     // buying wears it straight away
  return { ok: true, coins: p.coins, price: price, itemId: id, cosmetics: cos };
}

function equipInto(p, cat, id) {
  if (!p) return shopError("Join a game first.");
  if (!p.cosmetics) p.cosmetics = defaultCosmetics();
  const cos = p.cosmetics;
  const e = SHOP_INDEX.get(id);
  if (!e || e.cat !== cat) return shopError("That item does not belong here.");
  if (ownedList(cos, cat).indexOf(id) < 0) return shopError("Buy it first.");
  if (!EQUIP_FIELD[cat]) return shopError("That cannot be equipped.");
  wearIt(cos, cat, id);
  return { ok: true, cosmetics: cos };
}

function sellFrom(p, iid) {
  if (!p) return shopError("Join a game first.");
  if (!Array.isArray(p.inventory)) return shopError("No collection.");
  let idx = -1;
  for (let i = 0; i < p.inventory.length; i++) {
    if (p.inventory[i] && p.inventory[i].iid === iid) { idx = i; break; }
  }
  if (idx < 0) return shopError("That card is not in your collection.");
  const it = p.inventory[idx];
  const card = getCard(it.cardId);
  if (!card) return shopError("Unknown card.");
  const price = Math.max(0, SHOP.sellPrices[card.rarity] || 0);
  p.inventory.splice(idx, 1);
  p.coins = (p.coins || 0) + price;
  return { ok: true, coins: p.coins, price: price, card: card.name, rarity: card.rarity };
}

/* ============================================================
   createGame
   ============================================================ */
function createGame(opts) {
  opts = opts || {};
  const rng = opts.random || Math.random;
  const difficultyKey = CONFIG.difficulties[opts.difficulty] ? opts.difficulty : CONFIG.defaultDifficulty;
  const difficulty = CONFIG.difficulties[difficultyKey];

  const players = new Map();     // id -> player record
  const stations = [];
  const listeners = new Map();   // event -> [fn]
  const outbox = new Map();      // pid -> [notify]

  let playerStation = new Map(); // pid -> stationId
  let lastHumanBidAt = new Map();// pid -> ms
  let allowBots = opts.allowBots !== false;
  let lastTickAt = Date.now();
  let seq = 0;

  for (let i = 1; i <= CONFIG.stationCount; i++) {
    stations.push({
      id: i, slots: [null, null], state: ST.EMPTY, card: null,
      currentBid: 0, highest: null, held: null, log: [],
      timeLeft: 0, phaseTotal: CONFIG.auction.timerDuration,
      round: 0, result: null, token: 0,
      joinedAt: 0, finishAt: 0, botThinkAt: 0, startedAt: 0
    });
  }

  /* ---------- events ---------- */
  function on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event).push(fn);
  }
  function off(event, fn) {
    const list = listeners.get(event);
    if (!list) return;
    const i = list.indexOf(fn);
    if (i >= 0) list.splice(i, 1);
  }
  function emit(event, payload) {
    const list = listeners.get(event);
    if (!list) return;
    for (const fn of list.slice()) {
      try { fn(payload); } catch (e) { /* a bad listener must not break the room */ }
    }
  }
  function notify(pid, text, kind) {
    if (!outbox.has(pid)) outbox.set(pid, []);
    outbox.get(pid).push({ text: text, kind: kind || "", at: Date.now() });
    emit("notify", { pid: pid, text: text, kind: kind || "" });
  }
  function drain(pid) {
    const list = outbox.get(pid);
    if (!list || !list.length) return [];
    outbox.set(pid, []);
    return list;
  }

  /* ---------- players ---------- */
  function join(pid, name, savedProfile) {
    const base = sanitizePlayer(savedProfile);
    const p = Object.assign(base, {
      id: pid,
      name: (name || base.name || "Player").toString().slice(0, 20),
      isBot: false,
      connected: true,
      joinedAt: Date.now()
    });
    players.set(pid, p);
    emit("change");
    return p;
  }

  function addBot(pid, name) {
    // Practice bots show a believable record instead of 0 wins: the harder
    // the room, the stronger the opponent, so offline practice varies
    const band = difficultyKey === "ruthless" ? [26, 170]
      : difficultyKey === "sharp" ? [5, 48]
      : [0, 15];
    const won = band[0] + Math.floor(rng() * (band[1] - band[0] + 1));
    const played = won + 2 + Math.floor(rng() * (won + 6));
    const p = {
      id: pid, name: name || "Practice Bot", isBot: true, connected: true,
      color: "#e05a5a", coins: 999999, held: 0,
      inventory: [], history: [],
      stats: { won: won, played: played, spent: 0 },
      totalEarned: 0, joinedAt: Date.now(),
      cosmetics: randomCosmetics(rng)
    };
    players.set(pid, p);
    return p;
  }

  function get(pid) { return players.get(pid) || null; }

  function removePlayer(pid) {
    const p = players.get(pid);
    if (!p) return;
    const st = stationOf(pid);
    playerStation.delete(pid);
    lastHumanBidAt.delete(pid);
    if (st) {
      const c = findContestant(st, pid);
      if (c) {
        if (st.state === ST.ACTIVE) {
          c.passed = true;
          c.left = true;
          evaluatePass(st);
        } else if (st.state === ST.STARTING) {
          st.slots[st.slots.indexOf(c)] = null;
          resetToEmpty(st);
        } else {
          st.slots[st.slots.indexOf(c)] = null;
          evaluateRoster(st);
        }
      }
    }
    players.delete(pid);
    emit("change");
  }

  /* connection bookkeeping - the player stays in the room until removePlayer */
  function markOffline(pid) {
    const p = players.get(pid);
    if (!p || p.connected === false) return;
    p.connected = false;
    emit("change");
  }
  function markOnline(pid) {
    const p = players.get(pid);
    if (!p || p.connected === true) return;
    p.connected = true;
    emit("change");
  }

  /* ---------- helpers ---------- */
  const getStation = (id) => stations[id - 1] || null;
  function stationOf(pid) {
    const id = playerStation.get(pid);
    return id ? getStation(id) : null;
  }
  function countParticipants(st) {
    let n = 0;
    for (const c of st.slots) if (c) n += 1;
    return n;
  }
  function findContestant(st, pid) {
    for (const c of st.slots) if (c && c.id === pid) return c;
    return null;
  }
  function seatIndex(st, pid) {
    for (let i = 0; i < st.slots.length; i++) if (st.slots[i] && st.slots[i].id === pid) return i;
    return -1;
  }
  function aliveContestants(st) {
    const out = [];
    for (const c of st.slots) if (c && !c.passed && !c.left) out.push(c);
    return out;
  }
  function walletOf(pid) {
    const p = players.get(pid);
    return p ? p.coins : 0;
  }
  function canAfford(pid, amount) { return walletOf(pid) >= amount; }

  /* escrow = true -> money parked on a live bid, tracked in p.held */
  function charge(pid, amount, escrow) {
    const p = players.get(pid);
    if (!p) return false;
    amount = clampInt(amount);
    if (amount <= 0) return false;
    if (p.coins < amount) return false;
    p.coins -= amount;
    p.stats.spent += amount;
    if (escrow) p.held += amount;
    return true;
  }
  function refund(pid, amount) {
    const p = players.get(pid);
    if (!p) return;
    amount = Math.max(0, clampInt(amount));
    p.coins += amount;
    p.stats.spent = Math.max(0, p.stats.spent - amount);
    p.held = Math.max(0, p.held - amount);
  }

  function setState(st, state) {
    st.state = state;
    st.joinedAt = 0;
    if (state !== ST.ACTIVE) st.botThinkAt = 0;
  }
  function clearRoundData(st) {
    st.card = null;
    st.currentBid = 0;
    st.highest = null;
    st.held = null;
    st.result = null;
  }

  /* ---------- roster ---------- */
  function evaluateRoster(st) {
    if (st.state === ST.ACTIVE || st.state === ST.STARTING) return;

    // a bot on its own serves nobody - drop it unless it has company
    let humans = 0, total = 0, botIndex = -1;
    st.slots.forEach((c, i) => {
      if (!c) return;
      total += 1;
      if (c.isBot) botIndex = i; else humans += 1;
    });
    if (total === 1 && humans === 0 && botIndex >= 0) st.slots[botIndex] = null;

    const n = countParticipants(st);
    if (n === 0) { setState(st, ST.EMPTY); st.timeLeft = 0; emit("change"); return; }
    if (n === 1) {
      setState(st, ST.WAITING);
      st.timeLeft = CONFIG.auction.seatCountdown;
      const lone = st.slots.find(Boolean);
      st.joinedAt = (allowBots && lone && !lone.isBot && !botAt(st)) ? Date.now() + CONFIG.auction.botJoinDelay * 1000 : 0;
      emit("change");
      return;
    }
    startRound(st);
  }

  function botAt(st) {
    for (const c of st.slots) if (c && c.isBot) return c;
    return null;
  }

  /* a real player in the room always outranks a practice bot */
  function humansWaiting(exceptPid) {
    for (const [pid, p] of players) {
      if (p.isBot || pid === exceptPid || p.connected === false) continue;
      if (!playerStation.has(pid)) return true;
    }
    return false;
  }

  /* ---------- round ---------- */
  /* the luckiest human seated decides how lucky this draw is */
  function seatLuck(st) {
    let best = 0;
    for (const c of st.slots) {
      if (!c || c.isBot) continue;
      const p = players.get(c.id);
      const L = p && p.cosmetics ? (p.cosmetics.luck | 0) : 0;
      if (L > best) best = L;
    }
    return Math.min(5, best);
  }

  function startRound(st) {
    if (st.state === ST.STARTING || st.state === ST.ACTIVE) return;
    st.token += 1;
    clearRoundData(st);
    st.round += 1;
    st.phaseTotal = CONFIG.auction.seatCountdown;
    st.timeLeft = CONFIG.auction.seatCountdown;
    st.startedAt = Date.now();
    setState(st, ST.STARTING);
    emit("change");
  }

  function beginAuction(st, token) {
    if (st.token !== token) return;
    if (countParticipants(st) < 2) { resetToEmpty(st); return; }
    st.card = rollCard(rng, seatLuck(st));
    st.currentBid = 0;
    st.highest = null;
    st.held = null;
    st.log = [];              // fresh bid feed for this round only
    st.phaseTotal = CONFIG.auction.timerDuration;
    st.timeLeft = CONFIG.auction.timerDuration;
    for (const c of st.slots) if (c) { c.passed = false; c.left = false; }
    setState(st, ST.ACTIVE);
    st.botThinkAt = Date.now() + rand(difficulty.minDelayMs, difficulty.maxDelayMs, rng);
    emit("change");
  }

  function resetToEmpty(st) {
    st.token += 1;
    clearRoundData(st);
    for (const c of st.slots) if (c && c.isBot) players.delete(c.id);
    st.slots = [null, null];
    st.timeLeft = 0;
    st.round = 0;
    setState(st, ST.EMPTY);
    for (const [pid, sid] of playerStation) if (sid === st.id) playerStation.delete(pid);
    emit("change");
  }

  /* ---------- seating ---------- */
  function sit(pid, stationId, seatIndex) {
    const st = getStation(stationId);
    const p = players.get(pid);
    if (!st || !p) return { ok: false, why: "That station does not exist." };
    if (p.isBot) return { ok: false, why: "Bots pick their own seat." };
    const current = playerStation.get(pid);
    if (current && current !== stationId) return { ok: false, why: "Stand up from Station " + current + " first." };
    if (findContestant(st, pid)) return { ok: false, why: "You are already seated." };
    if (st.state === ST.FINISHED) return { ok: false, why: "That round is still resolving." };
    let free = st.slots.indexOf(null);
    // optional: sit on the chair the player is actually standing at
    if ((seatIndex === 0 || seatIndex === 1) && st.slots[seatIndex] === null) free = seatIndex;
    if (free === -1 && st.state !== ST.ACTIVE) {
      // before the auction starts a practice bot must always give up its seat
      const bi = st.slots.findIndex((c) => c && c.isBot);
      if (bi !== -1) { players.delete(st.slots[bi].id); st.slots[bi] = null; free = bi; }
    }
    if (free === -1) return { ok: false, why: "Full house - only two seats per auction." };

    st.slots[free] = { id: pid, name: p.name, isBot: false, passed: false, left: false };
    playerStation.set(pid, stationId);
    evaluateRoster(st);
    emit("change");
    return { ok: true };
  }

  function stand(pid) {
    const st = stationOf(pid);
    playerStation.delete(pid);
    if (!st) return { ok: false, why: "You are not seated." };
    const c = findContestant(st, pid);
    if (!c) return { ok: false, why: "You are not seated." };

    if (st.state === ST.ACTIVE) {
      c.passed = true;
      c.left = true;
      evaluatePass(st);
    } else if (st.state === ST.STARTING) {
      st.slots[st.slots.indexOf(c)] = null;
      resetToEmpty(st);
    } else {
      st.slots[st.slots.indexOf(c)] = null;
      evaluateRoster(st);
    }
    emit("change");
    return { ok: true };
  }

  function botJoins(st, token) {
    if (st.token !== token || st.state !== ST.WAITING) return;
    if (countParticipants(st) !== 1 || botAt(st)) return;
    const lone = st.slots.find(Boolean);
    // hold the seat open while another human in the room may still sit down
    if (lone && humansWaiting(lone.id) &&
        Date.now() < st.joinedAt + CONFIG.auction.botJoinDelay * 2000) return;
    const free = st.slots.indexOf(null);
    if (free === -1) return;
    const pid = "bot-" + st.id + "-" + (++seq);
    addBot(pid, "Practice Bot");
    st.slots[free] = { id: pid, name: "Practice Bot", isBot: true, passed: false, left: false };
    st.joinedAt = 0;
    evaluateRoster(st);
    emit("change");
  }

  /* ---------- bidding ---------- */
  function bid(pid, stationId, requested) {
    const st = getStation(stationId);
    if (!st) return { ok: false, why: "That station does not exist." };
    if (st.state !== ST.ACTIVE) return { ok: false, why: "There is no live auction here." };
    const c = findContestant(st, pid);
    if (!c || c.passed) return { ok: false, why: "You are not taking part in this round." };
    if (st.highest && st.highest.id === pid) return { ok: false, why: "You already hold the highest bid." };

    if (!players.get(pid) || !players.get(pid).isBot) {
      const now = Date.now();
      const last = lastHumanBidAt.get(pid) || 0;
      if (now - last < CONFIG.auction.bidCooldownMs) return { ok: false, why: "Slow down." };
      lastHumanBidAt.set(pid, now);
    }

    const min = minNextBid(st);
    const amount = Math.floor(Number(requested));
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, why: "Invalid bid." };
    /* A bid is an exact amount, never a request to "go one step higher".
       Quietly raising it would charge the player more than the number their
       own button showed, so an under-minimum bid is refused outright. */
    if (amount < min) return { ok: false, why: "The next bid has to be at least " + min + "." };
    if (!canAfford(pid, amount)) return { ok: false, why: "Not enough coins." };

    if (st.held) refund(st.held.id, st.held.amount);
    if (!charge(pid, amount, true)) return { ok: false, why: "Not enough coins." };

    st.held = { id: pid, amount: amount };
    st.currentBid = amount;
    st.highest = c;
    st.timeLeft = Math.max(st.timeLeft, CONFIG.auction.timeExtensionOnBid);
    st.botThinkAt = Date.now() + rand(difficulty.minDelayMs, difficulty.maxDelayMs, rng);
    pushLog(st, { kind: "bid", who: c.name, amt: amount });
    // progression: a bid is a real event, never a client claim
    const bp = players.get(pid);
    if (bp && !bp.isBot) {
      progOf(bp).bids += 1;
      bumpDaily(bp, "bids", 1);
      addXp(bp, 2);
      refreshAchievements(bp);
    }
    emit("change");
    return { ok: true, amount: amount };
  }

  function pass(pid, stationId) {
    const st = getStation(stationId);
    if (!st) return { ok: false, why: "That station does not exist." };
    if (st.state !== ST.ACTIVE) return { ok: false, why: "There is no live auction here." };
    const c = findContestant(st, pid);
    if (!c || c.passed) return { ok: false, why: "Already passed." };
    c.passed = true;
    pushLog(st, { kind: "pass", who: c.name });
    const bp = players.get(pid);
    if (bp && !bp.isBot) { progOf(bp).passes += 1; bumpDaily(bp, "passes", 1); }
    evaluatePass(st);
    emit("change");
    return { ok: true };
  }

  /* a short per-round feed of what just happened, shown in the auction HUD */
  function pushLog(st, entry) {
    if (!st.log) st.log = [];
    st.log.push(entry);
    if (st.log.length > 14) st.log.shift();
  }

  function winLine(who, cardName, price) {
    return who.name + " wins " + cardName + " for " + price + " coins!";
  }
  function noSaleLine(who, price) {
    return who.name + " cannot cover " + price + " coins - no sale.";
  }

  function evaluatePass(st) {
    if (st.state !== ST.ACTIVE) return;
    const alive = aliveContestants(st);
    if (alive.length > 1) return;
    if (alive.length === 0) return finishRound(st, null, 0, "Everyone left - the card returns to the pool.");
    if (st.currentBid <= 0) return finishRound(st, null, 0, "No bids - the card returns to the pool.");
    const winner = alive[0];
    if (!canAfford(winner.id, st.currentBid)) return finishRound(st, null, 0, noSaleLine(winner, st.currentBid));
    finishRound(st, winner, st.currentBid, winLine(winner, st.card.name, st.currentBid));
  }

  function settle(st, winner, price) {
    if (st.held) { refund(st.held.id, st.held.amount); st.held = null; }
    if (winner && price > 0) {
      if (!charge(winner.id, price)) return null;
      return { winner: winner, price: price };
    }
    return null;
  }

  function finishRound(st, winner, price, forcedText) {
    if (st.state !== ST.ACTIVE) return;
    st.token += 1;
    const token = st.token;

    price = Math.max(0, clampInt(price));
    if (winner && price <= 0) winner = null;

    const settled = settle(st, winner, price);
    winner = settled ? settled.winner : null;
    price = settled ? settled.price : 0;
    if (winner) st.highest = winner;   // board should credit the winner, not the runner-up

    const text = winner ? (forcedText || winLine(winner, st.card.name, price)) : (forcedText || "The card returns to the pool.");
    pushLog(st, { kind: winner ? "end" : "none", who: winner ? winner.name : null, amt: price });

    if (winner && !winner.isBot) {
      const p = players.get(winner.id);
      if (p) {
        p.inventory.push({ iid: makeIid(), cardId: st.card.id, at: Math.floor(Date.now() / 1000), price: price });
        p.stats.won += 1;
        notify(winner.id, "You won " + st.card.name + " for " + price + " coins!", "good");
      }
    } else if (winner && winner.isBot) {
      // bots keep a win count too, so their name tag can show it
      const b = players.get(winner.id);
      if (b && b.stats) b.stats.won += 1;
    }

    for (const c of st.slots) {
      if (!c || c.isBot) continue;
      const p = players.get(c.id);
      if (!p) continue;
      p.stats.played += 1;
      p.history.push({
        cardId: st.card.id, name: st.card.name, rarity: st.card.rarity,
        price: c === winner ? price : 0, won: c === winner,
        at: Math.floor(Date.now() / 1000), station: st.id,
        opponent: opponentName(st, c)
      });
      while (p.history.length > CONFIG.auction.historyLimit) p.history.shift();
      if (c !== winner) notify(c.id, text, "warn");

      // progression: a finished round moves XP, the win streak and
      // today's missions. Only the engine does this - never a client call.
      const pr = progOf(p);
      if (c === winner) {
        pr.streak += 1;
        pr.winsAll += 1;
        if (pr.streak > pr.best) pr.best = pr.streak;
        bumpDaily(p, "wins", 1);
        if (addXp(p, 50 + getRarity(st.card.rarity).order * 15)) {
          notify(p.id, "Level up! You are now level " + levelOf(pr.xp).level + ".", "good");
        }
      } else {
        pr.streak = 0;
        if (addXp(p, 10)) {
          notify(p.id, "Level up! You are now level " + levelOf(pr.xp).level + ".", "good");
        }
      }
      bumpDaily(p, "matches", 1);
      const un = refreshAchievements(p);
      for (const a of un) notify(p.id, "Achievement unlocked: " + a.name + "!", "good");
    }

    st.result = { winnerId: winner ? winner.id : null, winner: winner ? winner.name : "", price: price, text: text };
    setState(st, ST.FINISHED);
    st.phaseTotal = CONFIG.auction.finishDelay;
    st.timeLeft = CONFIG.auction.finishDelay;
    st.finishAt = Date.now() + CONFIG.auction.finishDelay * 1000;
    emit("change");
  }

  function opponentName(st, me) {
    for (const c of st.slots) if (c && c !== me) return c.name;
    return "Solo";
  }

  function postRound(st, token) {
    if (st.token !== token || st.state !== ST.FINISHED) return;
    for (const c of st.slots) {
      if (c && c.isBot) players.delete(c.id);
      else if (c && c.left) playerStation.delete(c.id);
    }
    // bots are one-round guests: drop their seat too, otherwise round 2 runs
    // with a contestant whose wallet no longer exists and it passes instantly
    st.slots = st.slots.map((c) => (c && (c.isBot || c.left)) ? null : c);
    clearRoundData(st);
    st.timeLeft = 0;
    setState(st, ST.EMPTY);
    evaluateRoster(st);
    emit("change");
  }

  /* ---------- bot brain ---------- */
  function botThink(st, now) {
    st.botThinkAt = 0;
    if (st.state !== ST.ACTIVE) return;
    const bot = botAt(st);
    if (!bot || bot.passed || bot.left) return;
    if (st.highest && st.highest.id === bot.id) return;

    let ceiling = st.card ? st.card.income * difficulty.ceilingPerIncome : 0;
    if (difficulty.bluffs > 0 && rng() < difficulty.bluffs) ceiling *= 1.4;

    const min = minNextBid(st);
    if (min <= ceiling && canAfford(bot.id, min)) {
      const res = bid(bot.id, st.id, min);
      if (res.ok) {
        st.botThinkAt = Date.now() + rand(difficulty.minDelayMs, difficulty.maxDelayMs, rng);
        return;
      }
    }
    bot.passed = true;
    evaluatePass(st);
    emit("change");
  }

  /* ---------- master tick (one loop for the whole game) ---------- */
  function tick(now) {
    now = now || Date.now();
    const dt = Math.min(0.5, Math.max(0, (now - lastTickAt) / 1000));
    lastTickAt = now;

    for (const st of stations) {
      if (st.state === ST.WAITING && st.joinedAt && now >= st.joinedAt) botJoins(st, st.token);

      if (st.state === ST.FINISHED) {
        if (st.finishAt && now >= st.finishAt) postRound(st, st.token);
        continue;
      }
      if (st.state !== ST.STARTING && st.state !== ST.ACTIVE) continue;

      if (countParticipants(st) < 2) { resetToEmpty(st); continue; }

      st.timeLeft -= dt;
      const elapsed = (now - st.startedAt) / 1000;
      const cap = st.state === ST.ACTIVE ? CONFIG.auction.maxAuctionSeconds : CONFIG.auction.seatCountdown + 8;

      if (st.timeLeft <= 0 || elapsed >= cap) {
        if (st.state === ST.STARTING) {
          beginAuction(st, st.token);
        } else {
          const winner = st.highest;
          const price = st.currentBid;
          if (!winner || price <= 0) finishRound(st, null, 0, "Time is up - no bids, the card returns to the pool.");
          else if (!canAfford(winner.id, price)) finishRound(st, null, 0, noSaleLine(winner, price));
          else finishRound(st, winner, price, winLine(winner, st.card.name, price));
        }
        continue;
      }

      if (st.state === ST.ACTIVE && st.botThinkAt && now >= st.botThinkAt) botThink(st, now);
    }
  }

  /* one shared passive-income loop for the whole game */
  function incomeTick() {
    const rate = {};
    for (const p of players.values()) {
      if (p.isBot) continue;
      let sum = 0;
      for (const item of p.inventory) {
        const c = getCard(item.cardId);
        if (c) sum += c.income;
      }
      if (sum > 0) {
        p.coins += sum;
        p.totalEarned += sum;
        // passive income counts as "earned" for daily missions
        progOf(p).earned += sum;
        bumpDaily(p, "earned", sum);
        rate[p.id] = sum;
      }
    }
    return rate;
  }

  /* ---------- view ---------- */
  function totalIncome(pid) {
    const p = players.get(pid);
    if (!p) return 0;
    let sum = 0;
    for (const item of p.inventory) {
      const c = getCard(item.cardId);
      if (c) sum += c.income;
    }
    return sum;
  }

  function snapshot(pid) {
    const you = players.get(pid);
    return {
      you: you ? {
        id: you.id, name: you.name, color: you.color, coins: you.coins, held: you.held,
        income: totalIncome(pid), inventory: you.inventory, history: you.history,
        stats: you.stats, totalEarned: you.totalEarned, createdAt: you.createdAt,
        cosmetics: you.cosmetics || defaultCosmetics(),
        prog: progView(you),
        station: playerStation.get(pid) || null
      } : null,
      players: Array.from(players.values()).map((p) => ({
        id: p.id, name: p.name, isBot: p.isBot, coins: p.coins,
        color: p.color, connected: p.connected !== false,
        cosmetics: p.cosmetics || defaultCosmetics(),
        wins: (p.stats && p.stats.won) || 0
      })),
      stations: stations.map((st) => ({
        id: st.id, state: st.state, round: st.round,
        card: st.card, currentBid: st.currentBid,
        highestId: st.highest ? st.highest.id : null,
        highestName: st.highest ? st.highest.name : null,
        timeLeft: Math.max(0, st.timeLeft), phaseTotal: st.phaseTotal,
        log: st.log,
        result: st.result,
        seats: st.slots.map((c) => c ? ({
          id: c.id, name: c.name, isBot: c.isBot,
          passed: !!c.passed, left: !!c.left,
          leader: st.highest === c
        }) : null)
      })),
      allowBots: allowBots,
      difficulty: difficultyKey,
      minNextBid: stations.map((st) => minNextBid(st)),
      serverTime: Date.now()
    };
  }

  /* ---------- shop ---------- */
  /* The rules live in module level buyInto/equipInto/sellFrom so the
     browser can run them on a local profile when no room is open. */
  function buy(pid, cat, id) {
    const p = players.get(pid);
    if (!p) return { ok: false, why: "Join a game first." };
    const r = buyInto(p, cat, id);
    if (r.ok) emit("change");
    return r;
  }
  function equip(pid, cat, id) {
    const p = players.get(pid);
    if (!p) return { ok: false, why: "Join a game first." };
    const r = equipInto(p, cat, id);
    if (r.ok) emit("change");
    return r;
  }
  function sellCard(pid, iid) {
    const p = players.get(pid);
    if (!p) return { ok: false, why: "Join a game first." };
    const r = sellFrom(p, iid);
    if (r.ok) {
      // selling a card is earnings too - daily missions count it
      progOf(p).earned += r.price;
      bumpDaily(p, "earned", r.price);
      refreshAchievements(p);
      emit("change");
    }
    return r;
  }

  /* ---------- progression claims (the reward side is validated here) ---------- */
  function prog(pid) {
    const p = players.get(pid);
    return p ? progView(p) : null;
  }
  function doClaimDaily(pid) {
    const p = players.get(pid);
    if (!p) return { ok: false, why: "Join a game first." };
    const r = claimDaily(p, rng);
    if (r.ok) {
      notify(pid, "Day " + r.reward.day + " reward claimed!", "good");
      if (r.reward.card) notify(pid, "You received a " + r.reward.card.rarity + " card: " + r.reward.card.name + "!", "good");
      emit("change");
    }
    return r;
  }
  function doClaimMission(pid, id) {
    const p = players.get(pid);
    if (!p) return { ok: false, why: "Join a game first." };
    const r = claimMission(p, id);
    if (r.ok) emit("change");
    return r;
  }
  function doClaimAch(pid, id) {
    const p = players.get(pid);
    if (!p) return { ok: false, why: "Join a game first." };
    const r = claimAch(p, id);
    if (r.ok) emit("change");
    return r;
  }
  function doClaimWeekly(pid, id) {
    const p = players.get(pid);
    if (!p) return { ok: false, why: "Join a game first." };
    const r = claimWeekly(p, id);
    if (r.ok) { notify(pid, "Weekly mission claimed: +" + r.coins + " coins!", "good"); emit("change"); }
    return r;
  }
  function doSetTitle(pid, id) {
    const p = players.get(pid);
    if (!p) return { ok: false, why: "Join a game first." };
    const r = setTitle(p, id);
    if (r.ok) emit("change");
    return r;
  }

  function exportProfile(pid) {
    const p = players.get(pid);
    if (!p) return null;
    return sanitizeProfile(p);
  }

  return {
    CONFIG: CONFIG,
    players: players,
    stations: stations,
    on: on, off: off, emit: emit, notify: notify, drain: drain,
    join: join, removePlayer: removePlayer, markOffline: markOffline, markOnline: markOnline, get: get,
    getStation: getStation, stationOf: stationOf,
    sit: sit, stand: stand, bid: bid, pass: pass,
    buy: buy, equip: equip, sellCard: sellCard,
    tick: tick, incomeTick: incomeTick,
    snapshot: snapshot, totalIncome: totalIncome,
    exportProfile: exportProfile,
    prog: prog,
    claimDaily: doClaimDaily,
    claimMission: doClaimMission,
    claimAch: doClaimAch,
    claimWeekly: doClaimWeekly,
    setTitle: doSetTitle,
    setAllowBots: function (v) { allowBots = !!v; emit("change"); },
    getAllowBots: function () { return allowBots; },
    getDifficulty: function () { return difficultyKey; }
  };
}

return {
  CONFIG: CONFIG,
  SHOP: SHOP,
  ST: ST,
  TICK_MS: TICK_MS,
  createGame: createGame,
  sanitizeProfile: sanitizeProfile,
  sanitizeCosmetics: sanitizeCosmetics,
  defaultProfile: defaultProfile,
  defaultCosmetics: defaultCosmetics,
  randomCosmetics: randomCosmetics,
  shopItem: shopItem,
  buyInto: buyInto,
  equipInto: equipInto,
  sellFrom: sellFrom,
  getCard: getCard,
  getRarity: getRarity,
  minNextBid: minNextBid,
  bidIncrement: bidIncrement,
  rollCard: rollCard,
  /* progression (XP/levels, streak, titles, daily rewards, missions, achievements) */
  MISSION_POOL: MISSION_POOL,
  ACHIEVEMENTS: ACHIEVEMENTS,
  TITLES: TITLES,
  REWARD_DAYS: REWARD_DAYS,
  WEEKLY_POOL: WEEKLY_POOL,
  weeklyDef: weeklyDef,
  isoWeekKey: isoWeekKey,
  rollWeekly: rollWeekly,
  claimWeekly: claimWeekly,
  /* what one copy of a card sells for - the single source of truth */
  sellPrice: function (cardId) {
    const c = getCard(cardId);
    if (!c) return 0;
    return Math.max(0, SHOP.sellPrices[c.rarity] || 0);
  },
  progView: progView,
  levelOf: levelOf,
  rollDaily: rollDaily,
  claimDaily: claimDaily,
  claimMission: claimMission,
  claimAch: claimAch,
  setTitle: setTitle,
  refreshAchievements: refreshAchievements
};
});
