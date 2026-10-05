/* ============================================================
   CardAuction - 3D world (Three.js)
   Walk to a table, sit on a chair, the auction starts.
   Game rules still come from engine.js through the shared App state.
   ============================================================ */
(function () {
  "use strict";

  const THREE = window.THREE;
  const App = window.__CA;
  const B = window.CABridge;
  if (!THREE || !App || !B) {
    console.warn("[CardAuction] three.js or bridge missing - 3D world disabled");
    return;
  }

  /* ---------------- tuning ---------------- */
  const SPACING = 15;
  const PLAYER_R = 0.5;
  const WALK = 6.4;
  const SIT_RANGE = 3.2;
  const SEAT_H = 0.55;
  const BOT_COLOR = "#e0575f";
  const LAND_R = 52;        // island radius (grass + beach)
  const BOUND_R = 46.5;     // how far from the centre the player may walk
  const GRAVITY = 26;
  const JUMP_V = 8.6;
  const SHOP = { x: 0, z: 34, hx: 3.5, hz: 2.2, range: 6.5 };   // in-world shop kiosk

  /* ---------------- state ---------------- */
  let renderer = null, scene = null, camera = null, clockNow = 0, lastTime = 0;
  let rafId = 0, running = false, built = false;
  let startPending = null, startAborted = false, startTries = 0;
  let tables = [];              // { id, x, z, card, cardTex, board, boardTex, lastBoard, chairs:[{x,z,ry}] }
  let colliders = [];           // { x, z, hx, hz }
  let me = null;                // { root, legL, legR, armL, armR, head }
  let waterMesh = null;
  let vy = 0, onGround = true, jumpQueued = false;
  const others = new Map();     // pid -> character
  let seated = null;            // station id I am sitting at
  let sitTween = null;          // { to, ry, t, dur }
  let standPos = null;          // where to go back to when standing up
  let kioskCoin = null;         // bobbing sign above the shop
  let kioskSign = null;         // the SHOP board (orientation is worth checking)
  let nearShop = false;         // close enough to open it
  let nearStop = null;          // which indoor display we are standing at
  let shopStops = [];           // indoor displays { x, z, r, tab, sub, label }
  let shopKeeper = null;        // the NPC behind the counter
  let shopModel = null;         // the mannequin wearing the featured outfit
  let shopOrb = null, shopOrbY = 0;
  let shopLight = null;         // one cheap light so the inside is readable
  let hintLast = null;          // last text put in the hint bar
  let lastWinKey = "";          // used to fire the win celebration once
  let seatKey = "";             // cached signature of the seat chips
  let feedKey = "";             // cached signature of the bid feed
  let resultKey = "";           // shows the result card once per finished round
  let camYaw = Math.PI, camDist = 10, camHeight = 4.8;
  let camFocusY = 1.5;          // smoothed look-at height (follows the jump)
  let animTime = 0;             // shared clock for idle breathing / emotes
  const keys = Object.create(null);
  let walkPhase = 0, dragging = false, lastPtr = { x: 0, y: 0 };
  let stick = { x: 0, y: 0 };
  let lastHud = 0, lastPosSent = 0, frameCount = 0;
  const el = (id) => document.getElementById(id);

  /* ---------------- small helpers ---------------- */
  /* correct colour pipeline: authored colours stay authored */
  if (typeof THREE !== "undefined" && THREE.ColorManagement) {
    THREE.ColorManagement.enabled = true;
  }
  function roundRect(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.arcTo(a + w, b, a + w, b + h, r);
    x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r);
    x.arcTo(a, b, a + w, b, r);
    x.closePath();
  }

  /* colour canvas -> texture, gamma correct + sharp at any distance */
  function texCanvas(c) {
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    try {
      t.anisotropy = renderer && renderer.capabilities
        ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    } catch (e) { t.anisotropy = 1; }
    t.needsUpdate = true;
    return t;
  }

  function tagTexture(text, wins, color, sub) {
    const c = document.createElement("canvas");
    c.width = 320; c.height = 104;
    const x = c.getContext("2d");
    x.fillStyle = "rgba(6,9,18,.86)";
    roundRect(x, 6, 6, 308, 92, 22); x.fill();
    x.lineWidth = 4; x.strokeStyle = color || "#4aa8ff"; x.stroke();

    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = "#ffffff";
    x.font = "bold 33px system-ui, Segoe UI, sans-serif";
    x.fillText(String(text || "?").slice(0, 13), 160, 35);

    x.fillStyle = "#ffd76a";
    x.font = "bold 25px system-ui, Segoe UI, sans-serif";
    x.fillText(sub != null ? String(sub) : "\u2605 " + (wins | 0) + " wins", 160, 76);

    const t = texCanvas(c);
    t.needsUpdate = true;
    return t;
  }

  function makeTag(text, wins, color) {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tagTexture(text, wins, color), transparent: true, depthWrite: false
    }));
    spr.scale.set(1.18, 0.384, 1);
    spr.userData.key = "";
    return spr;
  }

  function setTag(spr, text, wins, color, sub) {
    const key = String(text) + "|" + (wins | 0) + "|" + (color || "") + "|" + (sub == null ? "" : sub);
    if (!spr || spr.userData.key === key) return;
    spr.userData.key = key;
    const old = spr.material.map;
    spr.material.map = tagTexture(text, wins, color, sub);
    spr.material.needsUpdate = true;
    if (old) old.dispose();
  }

  function cardTexture(card) {
    const W = 512, H = 700;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    const col = card ? B.getRarity(card.rarity).color : "#39415a";
    if (card && B && typeof B.cardFace === "function") {
      // shared art + name + income so the table card reads exactly like the UI
      B.cardFace(x, card, W, H);
    } else {
      const g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#1a2138"); g.addColorStop(1, "#0c1020");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = card ? col : "#39415a";
      x.lineWidth = 14; x.strokeRect(9, 9, W - 18, H - 18);
      x.textAlign = "center"; x.textBaseline = "alphabetic";
      x.fillStyle = card ? col : "#5c6478";
      x.font = "bold 36px system-ui, sans-serif";
      x.fillText(card ? card.rarity : "EMPTY", W / 2, 84);
      x.fillStyle = "#ffffff";
      x.font = "bold 230px system-ui, sans-serif";
      x.fillText(card ? card.name.charAt(0) : "?", W / 2, 360);
      x.font = "bold 44px system-ui, sans-serif";
      x.fillText(card ? card.name : "No card", W / 2, 560);
      x.fillStyle = "#7be49a";
      x.font = "bold 38px system-ui, sans-serif";
      x.fillText(card ? "+" + card.income + " / sec" : "", W / 2, 625);
    }
    const t = texCanvas(c);
    t.needsUpdate = true;
    return t;
  }

  function boardTexture(lines) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 160;
    const x = c.getContext("2d");
    x.fillStyle = "rgba(7,10,20,.9)";
    roundRect(x, 4, 4, 504, 152, 22); x.fill();
    x.lineWidth = 4; x.strokeStyle = "#c9a24a"; x.stroke();
    x.textAlign = "center";
    x.fillStyle = "#f0c04a";
    x.font = "bold 28px system-ui, sans-serif";
    x.fillText(lines[0] || "", 256, 44);
    x.fillStyle = "#ffffff";
    x.font = "bold 27px system-ui, sans-serif";
    x.fillText((lines[1] || "").slice(0, 30), 256, 88);
    x.fillStyle = "#9fb0cc";
    x.font = "bold 20px system-ui, sans-serif";
    x.fillText((lines[2] || "").slice(0, 42), 256, 130);
    const t = texCanvas(c);
    t.needsUpdate = true;
    return t;
  }

  /* ---------------- characters ---------------- */
  /* reads the shared shop catalogue so the 3D model always matches
     what the shop preview shows */
  function shopItemOf(id) {
    const eng = (typeof window !== "undefined" && window.CAEngine) || null;
    if (!eng || !eng.shopItem || typeof id !== "string") return null;
    const e = eng.shopItem(id);
    return e ? e.item : null;
  }
  function shadeHex(hex, f) {
    if (typeof hex !== "string" || hex.charAt(0) !== "#") return 0x888888;
    const n = parseInt(hex.slice(1), 16);
    if (!Number.isFinite(n)) return 0x888888;
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return ((Math.round(r) & 255) << 16) | ((Math.round(g) & 255) << 8) | (Math.round(b) & 255);
  }
  function lookOf(cos) {
    const c = cos || {};
    const ch = shopItemOf(c.character) || { skin: "#f3c69a", hair: "#4a3427", hairStyle: "short", build: 1 };
    const sh = shopItemOf(c.shirt) || { color: "#3fb6ff", trim: "#ffffff", kind: "tee" };
    const pa = shopItemOf(c.pants) || { color: "#3d5a8a", kind: "jeans" };
    const sn = shopItemOf(c.shoes) || { color: "#f2f2f2", sole: "#d9d9d9" };
    const cp = shopItemOf(c.cap) || { kind: "none" };
    return {
      skin: ch.skin || "#f3c69a", hair: ch.hair || "#4a3427",
      hairStyle: ch.hairStyle || "short", build: Number(ch.build) || 1,
      shirt: sh.color || "#3fb6ff", trim: sh.trim || "#ffffff", shirtKind: sh.kind || "tee",
      pants: pa.color || "#3d5a8a", pantsKind: pa.kind || "jeans",
      shoes: sn.color || "#f2f2f2", sole: sn.sole || "#d9d9d9",
      capKind: cp.kind || "none", capColor: cp.color || "#e04a4a"
    };
  }
  function lookKey(cos) {
    const c = cos || {};
    return [c.character, c.shirt, c.pants, c.shoes, c.cap, c.chair].join("|");
  }
  function matOf(col, rough, metal) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(typeof col === "number" ? col : (col || "#888888")),
      roughness: rough == null ? 0.74 : rough,
      metalness: metal || 0.03
    });
  }

  /* the whole head as one texture: skin + a proper face (eyes, brows,
     nose, mouth, cheeks) mapped to the front of the sphere */
  function headTexture(look) {
    const W = 1024, H = 512;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = look.skin; x.fillRect(0, 0, W, H);

    // face band: u 0.14..0.36 (front of the head), theta 1.00..2.45 rad
    const fx = 0.14 * W, fw = 0.22 * W;
    const fy = (1.00 / Math.PI) * H, fh = (1.45 / Math.PI) * H;
    const cx = fx + fw / 2;
    const eyeY = fy + fh * 0.40;

    // gentle temple shading so the face reads round
    const g = x.createLinearGradient(fx, 0, fx + fw, 0);
    g.addColorStop(0, "rgba(0,0,0,.18)"); g.addColorStop(0.3, "rgba(0,0,0,0)");
    g.addColorStop(0.7, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.18)");
    x.fillStyle = g; x.fillRect(fx, fy - 40, fw, fh + 60);

    // brows
    x.strokeStyle = look.hair; x.lineWidth = 14; x.lineCap = "round";
    const ex = fw * 0.24;
    x.beginPath(); x.moveTo(cx - ex - 34, eyeY - 30); x.lineTo(cx - ex + 30, eyeY - 40); x.stroke();
    x.beginPath(); x.moveTo(cx + ex - 30, eyeY - 40); x.lineTo(cx + ex + 34, eyeY - 30); x.stroke();

    // eyes
    [-1, 1].forEach((s) => {
      const px = cx + s * ex;
      x.fillStyle = "#ffffff";
      x.beginPath(); x.ellipse(px, eyeY, 31, 21, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#3d6fa8";
      x.beginPath(); x.arc(px + 4, eyeY + 2, 14, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#141b28";
      x.beginPath(); x.arc(px + 4, eyeY + 2, 7.5, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#ffffff";
      x.beginPath(); x.arc(px + 10, eyeY - 5, 4.5, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "rgba(40,28,20,.8)"; x.lineWidth = 7;
      x.beginPath(); x.arc(px, eyeY - 1, 31, Math.PI * 1.1, Math.PI * 1.9); x.stroke();
    });

    // nose
    x.strokeStyle = "rgba(120,70,50,.5)"; x.lineWidth = 8; x.lineJoin = "round";
    x.beginPath(); x.moveTo(cx + 3, eyeY + 30); x.lineTo(cx - 9, eyeY + 70); x.lineTo(cx + 11, eyeY + 74); x.stroke();

    // mouth
    x.strokeStyle = "#93514c"; x.lineWidth = 9;
    x.beginPath(); x.arc(cx, eyeY + 60, 50, Math.PI * 0.22, Math.PI * 0.78); x.stroke();
    x.strokeStyle = "rgba(255,255,255,.3)"; x.lineWidth = 4;
    x.beginPath(); x.arc(cx, eyeY + 68, 36, Math.PI * 0.3, Math.PI * 0.7); x.stroke();

    // cheeks + chin shading
    x.globalAlpha = 0.26; x.fillStyle = "#e07a7a";
    x.beginPath(); x.ellipse(cx - fw * 0.34, eyeY + 56, 32, 21, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(cx + fw * 0.34, eyeY + 56, 32, 21, 0, 0, Math.PI * 2); x.fill();
    x.globalAlpha = 1;

    const t = texCanvas(c);
    t.needsUpdate = true;
    return t;
  }

  function buildHair(root, look, hy) {
    const r = 0.222;
    const hairMat = matOf(look.hair, 0.9);
    const style = look.hairStyle || "short";
    const add = (geo, px, py, pz) => {
      const m = new THREE.Mesh(geo, hairMat);
      m.position.set(px || 0, py, pz || 0);
      m.castShadow = true;
      root.add(m);
      return m;
    };

    if (style === "hood") {           // hood worn up, part of the shirt
      const hoodMat = matOf(shadeHex(look.shirt, -0.1), 0.85);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.252, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), hoodMat);
      cap.position.y = hy; cap.castShadow = true; root.add(cap);
      const back = new THREE.Mesh(new THREE.SphereGeometry(0.252, 16, 16, Math.PI, Math.PI, 0, Math.PI * 0.95), hoodMat);
      back.position.y = hy; back.castShadow = true; root.add(back);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.212, 0.033, 8, 26), matOf(shadeHex(look.shirt, -0.28), 0.85));
      rim.position.set(0, hy + 0.01, 0.045); rim.rotation.x = 0.12; root.add(rim);
      return;
    }

    if (style === "spiky") {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), hairMat);
      cap.position.y = hy; cap.castShadow = true; root.add(cap);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.15, 6), hairMat);
        sp.position.set(Math.cos(a) * 0.11, hy + 0.17, Math.sin(a) * 0.11);
        sp.rotation.z = Math.cos(a) * 0.35; sp.rotation.x = -Math.sin(a) * 0.35;
        sp.castShadow = true; root.add(sp);
      }
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.17, 6), hairMat);
      tip.position.y = hy + 0.21; tip.castShadow = true; root.add(tip);
      return;
    }

    if (style === "buzz") {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 0.99, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.43), hairMat);
      cap.position.y = hy; cap.castShadow = true; root.add(cap);
      return;
    }

    // short + long share the same cap; long adds length at the sides/back
    const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.39), hairMat);
    cap.position.y = hy; cap.castShadow = true; root.add(cap);
    const back = new THREE.Mesh(
      new THREE.SphereGeometry(r, 18, 18, Math.PI, Math.PI, 0, style === "long" ? Math.PI * 0.92 : Math.PI * 0.68),
      hairMat);
    back.position.y = hy; back.castShadow = true; root.add(back);

    if (style === "long") {
      [-1, 1].forEach((s) => {
        const side = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), hairMat);
        side.position.set(s * 0.178, hy - 0.14, -0.02);
        side.scale.set(1, 2.7, 1.1);
        side.castShadow = true; root.add(side);
      });
      const fall = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 14), hairMat);
      fall.position.set(0, hy - 0.2, -0.13);
      fall.scale.set(1.7, 2.4, 0.9);
      fall.castShadow = true; root.add(fall);
    }
  }

  function buildHat(root, look, hy) {
    const kind = look.capKind;
    if (!kind || kind === "none") return;
    const col = look.capColor || "#e04a4a";
    const m = matOf(col, 0.68);
    const dark = matOf(shadeHex(col, -0.25), 0.7);

    if (kind === "cap") {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.232, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), m);
      dome.position.y = hy; dome.castShadow = true; root.add(dome);
      const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.028, 18, 1, false, -Math.PI * 0.42, Math.PI * 0.84), dark);
      peak.position.set(0, hy - 0.02, 0.055); peak.rotation.x = -0.16; peak.castShadow = true; root.add(peak);
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), dark);
      btn.position.y = hy + 0.225; root.add(btn);
    } else if (kind === "beanie") {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.228, 0.234, 0.2, 22), m);
      body.position.y = hy + 0.1; body.castShadow = true; root.add(body);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.228, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), m);
      body.position.y = hy + 0.09; top.position.y = hy + 0.19; root.add(top);
      const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.244, 0.244, 0.075, 22), dark);
      fold.position.y = hy + 0.02; root.add(fold);
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), dark);
      pom.position.y = hy + 0.27; pom.castShadow = true; root.add(pom);
    } else if (kind === "fedora") {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 26), m);
      brim.position.y = hy + 0.115; brim.castShadow = true; root.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.225, 0.19, 22), m);
      crown.position.y = hy + 0.22; crown.castShadow = true; root.add(crown);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.232, 0.232, 0.06, 22), dark);
      band.position.y = hy + 0.14; root.add(band);
    } else if (kind === "crown") {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.215, 0.08, 22), m);
      base.position.y = hy + 0.15; base.castShadow = true; root.add(base);
      const jewel = matOf("#ff4f7a", 0.3, 0.4);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.15, 8), m);
        spike.position.set(Math.cos(a) * 0.17, hy + 0.26, Math.sin(a) * 0.17);
        spike.castShadow = true; root.add(spike);
        const j = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), jewel);
        j.position.set(Math.cos(a) * 0.2, hy + 0.19, Math.sin(a) * 0.2);
        root.add(j);
      }
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.222, 0.222, 0.04, 22), dark);
      band.position.y = hy + 0.12; root.add(band);
    }
  }

  function makeCharacter(color, name, isBot, cosmetics) {
    const look = lookOf(cosmetics);
    const b = look.build || 1;
    const root = new THREE.Group();

    const skinMat = matOf(look.skin, 0.86);
    const shirtMat = matOf(look.shirt, 0.72);
    const sleeveMat = matOf(shadeHex(look.shirt, -0.16), 0.74);
    const trimMat = matOf(look.trim, 0.62);
    const pantsMat = matOf(look.pants, 0.78);
    const shoeMat = matOf(look.shoes, 0.52);
    const soleMat = matOf(look.sole, 0.66);

    const put = (parent, geo, m, px, py, pz) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(px || 0, py || 0, pz || 0);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    const HIP = 0.90 * b;

    /* ---- torso: rounded, tapered at the waist ---- */
    const torso = put(root, new THREE.CapsuleGeometry(0.215, 0.18, 6, 22), shirtMat, 0, 1.17 * b);
    torso.scale.set(1.06 * b, 1, 0.76);

    // shoulders / deltoids
    const shoulderMat = look.shirtKind === "tank" ? skinMat : sleeveMat;
    [-1, 1].forEach((s) => {
      const sh = put(root, new THREE.SphereGeometry(0.102, 16, 14), shoulderMat, s * 0.222 * b, 1.37 * b, 0);
      sh.scale.set(1, 0.95, 0.95);
    });

    // hips / pelvis in trouser colour so shirt and legs meet cleanly
    const hips = put(root, new THREE.CylinderGeometry(0.175, 0.168, 0.22, 20), pantsMat, 0, 0.95 * b);
    hips.scale.set(1.15, 1, 0.8);

    // shirt details
    if (look.shirtKind === "jacket" || look.shirtKind === "suit") {
      put(root, new THREE.BoxGeometry(0.05, 0.44, 0.03), trimMat, 0, 1.16 * b, 0.172 * b);
      [-1, 1].forEach((s) => {
        const lap = put(root, new THREE.BoxGeometry(0.1, 0.17, 0.03), trimMat, s * 0.07 * b, 1.38 * b, 0.155 * b);
        lap.rotation.z = s * 0.42; lap.rotation.x = -0.2;
      });
    } else if (look.shirtKind === "stripe") {
      [[1.04, 0.217], [1.17, 0.221], [1.30, 0.217]].forEach((row) => {
        const ring = put(root, new THREE.CylinderGeometry(row[1] * b, row[1] * b, 0.05, 24, 1, true), trimMat, 0, row[0] * b);
        ring.scale.set(1.06, 1, 0.76);
        ring.material.side = THREE.DoubleSide;
      });
    } else if (look.shirtKind === "hoodie") {
      put(root, new THREE.BoxGeometry(0.19, 0.11, 0.035), trimMat, 0, 1.03 * b, 0.168 * b);
      const hood = put(root, new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), sleeveMat, 0, 1.46 * b, -0.1);
      hood.scale.set(1.5, 1, 1.2);
      [-1, 1].forEach((s) => {
        put(root, new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), trimMat, s * 0.05 * b, 1.4 * b, 0.175 * b);
      });
    }
    // collar
    const collar = put(root, new THREE.TorusGeometry(0.088 * b, 0.026, 8, 22),
      (look.shirtKind === "jacket" || look.shirtKind === "suit") ? trimMat : shirtMat, 0, 1.475 * b, 0);
    collar.rotation.x = Math.PI / 2;

    /* ---- neck + head ---- */
    put(root, new THREE.CylinderGeometry(0.068 * b, 0.078 * b, 0.26, 14), skinMat, 0, 1.44 * b, 0);

    const HY = 1.79 * b;
    const headMat = new THREE.MeshStandardMaterial({ map: headTexture(look), roughness: 0.84, metalness: 0.0 });
    const head = put(root, new THREE.SphereGeometry(0.21 * b, 30, 22), headMat, 0, HY, 0);
    head.scale.set(1, 1.04, 0.98);
    head.userData.isHead = true;
    [-1, 1].forEach((s) => {
      const ear = put(root, new THREE.SphereGeometry(0.048, 12, 10), skinMat, s * 0.202 * b, HY - 0.01, -0.01);
      ear.scale.set(0.7, 1, 0.9);
    });

    buildHair(root, look, HY);
    buildHat(root, look, HY);

    /* ---- arms ---- */
    const mkArm = (s) => {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.272 * b, 1.355 * b, 0);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.24, 5, 14),
        look.shirtKind === "tank" ? skinMat : sleeveMat);
      upper.position.y = -0.19;
      upper.castShadow = true;
      pivot.add(upper);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.079, 14, 12), skinMat);
      hand.position.y = -0.40; hand.castShadow = true;
      pivot.add(hand);
      root.add(pivot);
      return pivot;
    };
    const armL = mkArm(-1), armR = mkArm(1);

    /* ---- legs + shoes ---- */
    const mkLeg = (s) => {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.132 * b, HIP, 0);
      const legMat = look.pantsKind === "shorts" ? skinMat : pantsMat;
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.098, 0.55, 5, 16), legMat);
      leg.position.y = -0.375; leg.castShadow = true;
      pivot.add(leg);
      if (look.pantsKind === "shorts") {
        const short = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.122, 0.34, 16), pantsMat);
        short.position.y = -0.17; short.castShadow = true;
        pivot.add(short);
      }
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.185 * b, 0.13, 0.3), shoeMat);
      shoe.position.set(0, -0.825, 0.035); shoe.castShadow = true;
      pivot.add(shoe);
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.09 * b, 12, 10), shoeMat);
      toe.position.set(0, -0.845, 0.16); toe.scale.set(1, 0.75, 1);
      pivot.add(toe);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.198 * b, 0.045, 0.315), soleMat);
      sole.position.set(0, -0.878, 0.035);
      pivot.add(sole);
      root.add(pivot);
      return pivot;
    };
    const legL = mkLeg(-1), legR = mkLeg(1);

    const tag = makeTag(name, 0, isBot ? BOT_COLOR : (color || "#4aa8ff"));
    tag.position.y = 2.34 * b; root.add(tag);

    scene.add(root);
    return {
      root: root, legL: legL, legR: legR, armL: armL, armR: armR, tag: tag,
      torso: torso, head: head, hips: hips, build: b,
      torsoBase: { x: 1.06 * b, y: 1, z: 0.76 },
      sitting: false, bot: !!isBot, hipY: HIP, look: look,
      squash: 0, cheer: 0,
      cosKey: lookKey(cosmetics)
    };
  }

  function disposeGroup(g) {
    if (!g) return;
    g.traverse((o) => {
      if (o.geometry) { try { o.geometry.dispose(); } catch (e) {} }
      if (o.material) {
        const list = Array.isArray(o.material) ? o.material : [o.material];
        list.forEach((m) => {
          try { if (m.map) m.map.dispose(); } catch (e) {}
          try { m.dispose(); } catch (e) {}
        });
      }
    });
  }

  /* rebuild a character with a new outfit, keeping its transform */
  function rebuildChar(ch, cosmetics, name, color, isBot) {
    if (!ch) return null;
    const key = lookKey(cosmetics);
    if (ch.cosKey === key) return ch;
    const fresh = makeCharacter(color, name, isBot, cosmetics);
    fresh.root.position.copy(ch.root.position);
    fresh.root.rotation.copy(ch.root.rotation);
    fresh.sitting = ch.sitting;
    fresh.walk = ch.walk;
    scene.remove(ch.root);
    disposeGroup(ch.root);
    return fresh;
  }

  function poseWalk(ch, phase, speed, baseY) {
    const sp = Math.min(1, speed);
    const s = Math.sin(phase) * 0.65 * sp;
    ch.legL.rotation.x = s;
    ch.legR.rotation.x = -s;
    ch.armL.rotation.x = -s * 0.8;
    ch.armR.rotation.x = s * 0.8;
    ch.armL.rotation.z = 0; ch.armR.rotation.z = 0;
    const by = typeof baseY === "number" ? baseY : 0;
    const moving = speed > 0;
    ch.root.position.y = by + (moving ? Math.abs(Math.sin(phase)) * 0.05 : 0);

    // torso leans into the walk and breathes while standing still
    if (ch.torso && ch.torsoBase) {
      ch.torso.rotation.x = moving ? -0.13 * sp : 0;
      const amp = moving ? 0.008 : 0.03;
      const breathe = 1 + Math.sin(animTime * 2.1 + (ch.phaseOff || 0)) * amp;
      ch.torso.scale.set(ch.torsoBase.x, ch.torsoBase.y * breathe, ch.torsoBase.z);
      if (ch.hips) ch.hips.rotation.x = moving ? 0.05 * sp : 0;
    }
    if (ch.head) {
      // head stays level and looks slightly down when idling
      ch.head.rotation.x = moving ? -0.06 * sp : Math.sin(animTime * 1.3) * 0.03;
      ch.head.rotation.z = moving ? Math.sin(phase) * 0.03 : 0;
    }
    if (!moving && ch.armL && ch.armR) {
      // idle: arms drift a touch so nobody looks frozen
      const w = Math.sin(animTime * 1.6) * 0.05;
      ch.armL.rotation.x = w; ch.armR.rotation.x = -w;
    }
  }

  /* airborne - tuck the legs and swing the arms, rising vs falling */
  function poseAir(ch, vyNow) {
    const t = Math.max(-1, Math.min(1, (vyNow || 0) / 7));
    ch.legL.rotation.x = -0.78 - t * 0.24;
    ch.legR.rotation.x = -0.34 + t * 0.22;
    ch.armL.rotation.x = -1.55 - t * 0.9;
    ch.armR.rotation.x = -1.55 - t * 0.9;
    ch.armL.rotation.z = 0.34; ch.armR.rotation.z = -0.34;
    if (ch.torso && ch.torsoBase) {
      ch.torso.rotation.x = -0.1;
      ch.torso.scale.set(ch.torsoBase.x, ch.torsoBase.y, ch.torsoBase.z);
    }
    if (ch.head) { ch.head.rotation.x = -0.12 * t; ch.head.rotation.z = 0; }
  }

  /* celebration - arms up, little bounce (wired to auction wins).
     sitMode keeps the seated pose underneath so the legs stay on the chair. */
  function poseCheer(ch, dt, sitMode) {
    if (!ch || !(ch.cheer > 0)) return false;
    ch.cheer = Math.max(0, ch.cheer - dt);
    if (sitMode) poseSit(ch);
    const w = Math.sin(animTime * 9);
    ch.armL.rotation.x = -2.4 + w * 0.3;
    ch.armR.rotation.x = -2.4 - w * 0.3;
    ch.armL.rotation.z = 0.5; ch.armR.rotation.z = -0.5;
    if (!sitMode) {
      ch.legL.rotation.x = w * 0.16;
      ch.legR.rotation.x = -w * 0.16;
      ch.root.position.y += Math.abs(w) * 0.08;
    }
    if (ch.torso && ch.torsoBase) {
      ch.torso.rotation.x = -0.06;
      ch.torso.scale.set(ch.torsoBase.x, ch.torsoBase.y, ch.torsoBase.z);
    }
    poseFx(ch, dt);
    return true;
  }

  /* landing squash - a short squash & stretch so jumps feel like they land */
  function poseFx(ch, dt) {
    if (!ch) return;
    if (ch.squash > 0) {
      ch.squash = Math.max(0, ch.squash - dt);
      const e = Math.sin((ch.squash / 0.24) * Math.PI) * 0.16;
      ch.root.scale.set(1 + e * 0.7, 1 - e, 1 + e * 0.7);
    } else if (ch.root.scale.y !== 1) {
      ch.root.scale.set(1, 1, 1);
    }
  }

  function poseSit(ch) {
    ch.legL.rotation.x = -1.5;
    ch.legR.rotation.x = -1.5;
    ch.armL.rotation.x = -0.55; ch.armL.rotation.z = 0;
    ch.armR.rotation.x = -0.55; ch.armR.rotation.z = 0;
    if (ch.torso && ch.torsoBase) {
      ch.torso.rotation.x = 0.04;
      ch.torso.scale.set(ch.torsoBase.x, ch.torsoBase.y, ch.torsoBase.z);
    }
    if (ch.head) { ch.head.rotation.x = 0; ch.head.rotation.z = 0; }
    // hips rest on TOP of the seat slab (seat is 0.14 thick around SEAT_H)
    ch.root.position.y = SEAT_H + 0.15 - (ch.hipY || 0.7);
    ch.sitting = true;
  }

  function poseStand(ch) {
    ch.legL.rotation.x = 0; ch.legR.rotation.x = 0;
    ch.armL.rotation.x = 0; ch.armL.rotation.z = 0;
    ch.armR.rotation.x = 0; ch.armR.rotation.z = 0;
    if (ch.torso && ch.torsoBase) {
      ch.torso.rotation.x = 0;
      ch.torso.scale.set(ch.torsoBase.x, ch.torsoBase.y, ch.torsoBase.z);
    }
    if (ch.head) { ch.head.rotation.x = 0; ch.head.rotation.z = 0; }
    if (ch.root.scale.y !== 1) ch.root.scale.set(1, 1, 1);
    ch.root.position.y = 0;
    ch.sitting = false;
  }

  /* ---------------- world ---------------- */
  function grassTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    x.fillStyle = "#469340"; x.fillRect(0, 0, 256, 256);
    const blades = ["#4f9e3f", "#3f8a35", "#57a846", "#357a2e", "#5fb34c", "#2c6a27"];
    for (let i = 0; i < 3000; i++) {
      const px = Math.random() * 256, py = Math.random() * 256;
      x.strokeStyle = blades[Math.floor(Math.random() * blades.length)];
      x.lineWidth = 1 + Math.random() * 1.5;
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px + (Math.random() - 0.5) * 4, py - 3 - Math.random() * 6);
      x.stroke();
    }
    for (let i = 0; i < 46; i++) {
      x.globalAlpha = 0.07;
      x.fillStyle = Math.random() > 0.5 ? "#7ccd68" : "#2a6326";
      x.beginPath();
      x.arc(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 34, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = 1;
    const t = texCanvas(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(14, 14);
    return t;
  }

  function waterTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, "#1d78d4"); g.addColorStop(0.5, "#2b93ea"); g.addColorStop(1, "#1766bd");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 80; i++) {
      x.globalAlpha = 0.2 + Math.random() * 0.35;
      x.strokeStyle = "#d5f2ff"; x.lineWidth = 1 + Math.random() * 2;
      const y = Math.random() * 256, ph = Math.random() * 6;
      x.beginPath();
      for (let px = 0; px <= 256; px += 16) x.lineTo(px, y + Math.sin((px / 256) * Math.PI * 2 + ph) * 6);
      x.stroke();
    }
    x.globalAlpha = 1;
    const t = texCanvas(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(70, 70);
    return t;
  }

  /* ---------------- scenery, shop kiosk ---------------- */
  function rand(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function kioskSignTexture(title, sub) {
    const c = document.createElement("canvas");
    c.width = 640; c.height = 200;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 640, 200);
    g.addColorStop(0, "#241046"); g.addColorStop(1, "#4a1a6e");
    // fully opaque board so the mesh can be a box and read correctly both ways
    x.fillStyle = g; x.fillRect(0, 0, 640, 200);
    x.lineWidth = 8; x.strokeStyle = "#ffcf5c";
    roundRect(x, 8, 8, 624, 184, 30); x.stroke();
    x.textAlign = "center";
    x.fillStyle = "#ffcf5c";
    x.font = "bold 84px system-ui, sans-serif";
    x.fillText(title, 320, 96);
    x.fillStyle = "#f2e9ff";
    x.font = "bold 34px system-ui, sans-serif";
    x.fillText(sub, 320, 156);
    return texCanvas(c);
  }

  function buildKiosk() {
    const g = new THREE.Group();
    g.position.set(SHOP.x, 0, SHOP.z);
    scene.add(g);

    const wall = new THREE.MeshStandardMaterial({ color: 0xf5e6c4, roughness: 0.92 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x8b4a2f, roughness: 0.8 });
    const roofM = new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.6 });
    const glass = new THREE.MeshStandardMaterial({ color: 0xaee2ff, roughness: 0.12, metalness: 0.4 });

    /* ---- shell: four walls with a REAL doorway so you can walk inside ---- */
    const WH = 3.4;
    const slab = (w, h, d, px, py, pz, mtl) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mtl || wall);
      b.position.set(px, py, pz);
      b.castShadow = true; b.receiveShadow = true;
      g.add(b);
      return b;
    };
    slab(0.2, WH, 4.4, -3.4, WH / 2, 0);        // left wall
    slab(0.2, WH, 4.4, 3.4, WH / 2, 0);         // right wall
    slab(7, WH, 0.2, 0, WH / 2, 2.1);           // back wall
    slab(2.6, WH, 0.2, -2.2, WH / 2, -2.1);     // front, left of the door
    slab(2.6, WH, 0.2, 2.2, WH / 2, -2.1);      // front, right of the door
    slab(1.8, 0.9, 0.2, 0, 2.95, -2.1);         // header over the 1.8 x 2.5 door

    // plinth is a rim only, so the floor inside stays flat and walkable
    [[0, -2.3, 7.4, 0.4], [0, 2.3, 7.4, 0.4], [-3.5, 0, 0.4, 4.8], [3.5, 0, 0.4, 4.8]]
      .forEach((q) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(q[2], 0.3, q[3]), trim);
        m.position.set(q[0], 0.15, q[1]);
        m.receiveShadow = true;
        g.add(m);
      });

    // wooden floor + ceiling
    const floorM = new THREE.MeshStandardMaterial({ color: 0xc79a63, roughness: 0.9 });
    const fl = new THREE.Mesh(new THREE.BoxGeometry(6.7, 0.06, 4.2), floorM);
    fl.position.set(0, 0.03, 0); fl.receiveShadow = true; g.add(fl);
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.1, 4.3),
      new THREE.MeshStandardMaterial({
        color: 0xefe2c4, roughness: 0.95,
        // downward faces pick up the green ground colour from the hemisphere
        // light - a warm emissive keeps the ceiling reading as an interior
        emissive: 0xffe6c0, emissiveIntensity: 0.35
      }));
    // sit the ceiling BELOW the roof's base plane: at 3.40 the two coplanar
    // faces z-fought and the blue roof showed through the cream ceiling
    ceil.position.set(0, 3.3, 0); g.add(ceil);

    // doorway trim: jambs + header (never a slab across the opening)
    [-1.0, 1.0].forEach((px) => slab(0.2, 2.7, 0.26, px, 1.35, -2.16, trim));
    slab(2.2, 0.2, 0.26, 0, 2.6, -2.16, trim);

    // doormat so the entrance reads as an entrance
    const mat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x3f7d4e, roughness: 1 }));
    mat.position.set(0, 0.05, -2.75); g.add(mat);

    // two lit windows
    [-2.3, 2.3].forEach((px) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(2, 1.7, 0.14), trim);
      f.position.set(px, 2.0, -2.24); g.add(f);
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 0.16), glass);
      w.position.set(px, 2.0, -2.3); g.add(w);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.18), trim);
      bar.position.set(px, 2.0, -2.32); g.add(bar);
    });

    // awning over the door
    const awn = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.5), roofM);
    awn.position.set(0, 2.95, -2.7); awn.rotation.x = -0.28; awn.castShadow = true; g.add(awn);
    [-1.5, 1.5].forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.9, 8), trim);
      post.position.set(px, 1.45, -3.3); post.castShadow = true; g.add(post);
    });

    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 2.3, 4), roofM);
    roof.position.y = 4.55; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);

    // a box, not a plane: BoxGeometry orients the texture so the words read
    // correctly from BOTH the front and the back of the shop
    const signTex = kioskSignTexture("SHOP", "Characters  Clothes  Cards  Luck");
    const signFace = new THREE.MeshBasicMaterial({ map: signTex });
    const signEdge = new THREE.MeshBasicMaterial({ color: 0x2b1450 });
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(4.9, 1.55, 0.12),
      [signEdge, signEdge, signEdge, signEdge, signFace, signFace]   // px nx py ny pz nz
    );
    sign.position.set(0, 6.4, -0.8);
    g.add(sign);

    // bobbing gold coin so the shop is easy to spot
    kioskCoin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.16, 26),
      new THREE.MeshStandardMaterial({ color: 0xffcf5c, roughness: 0.3, metalness: 0.75, emissive: 0x3a2a05 })
    );
    kioskCoin.position.set(SHOP.x, 7.8, SHOP.z - 1.0);
    kioskCoin.rotation.x = Math.PI / 2;
    scene.add(kioskCoin);
    kioskSign = sign;

    /* ---- interior: counter, display tables, shopkeeper, lights ---- */
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.7 });
    const woodD = new THREE.MeshStandardMaterial({ color: 0x5e3d1e, roughness: 0.82 });
    const shopBox = (w, h, d, px, py, pz, mtl, parent) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mtl);
      b.position.set(px, py, pz);
      b.castShadow = true; b.receiveShadow = true;
      (parent || g).add(b);
      return b;
    };
    const mCol = (hex, rough) =>
      new THREE.MeshStandardMaterial({ color: hex || "#cccccc", roughness: rough || 0.72 });

    // counter along the back wall, with a bell and a till
    shopBox(3.4, 1.0, 0.55, 0, 0.5, 1.05, wood);
    shopBox(3.7, 0.1, 0.78, 0, 1.05, 1.05, woodD);
    const bell = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xffd76a, metalness: 0.8, roughness: 0.25 }));
    bell.position.set(-1.15, 1.1, 1.0); g.add(bell);
    shopBox(0.44, 0.3, 0.34, 1.2, 1.25, 1.1, woodD);

    // two display tables
    const mkTable = (px, pz) => {
      const t = new THREE.Group();
      t.position.set(px, 0, pz);
      g.add(t);
      shopBox(1.5, 0.1, 0.9, 0, 0.78, 0, wood, t);
      [[-0.62, -0.34], [0.62, -0.34], [-0.62, 0.34], [0.62, 0.34]].forEach((q) => {
        shopBox(0.1, 0.78, 0.1, q[0], 0.39, q[1], woodD, t);
      });
      shopBox(1.3, 0.06, 0.75, 0, 0.3, 0, woodD, t);
      return t;
    };
    const tableA = mkTable(-2.3, -0.45);      // clothes
    const tableB = mkTable(2.3, -0.45);       // shoes + hats

    // clothes table: a hoodie on a stand and a stack of folded trousers
    const hoodie = shopItemOf("top_hoodie") || {};
    const jeans = shopItemOf("pant_jeans") || {};
    const cargo = shopItemOf("pant_cargo") || {};
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8), woodD);
    pole.position.set(-0.44, 1.43, 0); tableA.add(pole);
    shopBox(0.1, 0.06, 0.5, -0.44, 2.0, 0, woodD, tableA);
    shopBox(0.54, 0.6, 0.16, -0.44, 1.66, 0, mCol(hoodie.color), tableA);
    shopBox(0.5, 0.16, 0.4, 0.34, 0.91, -0.04, mCol(jeans.color), tableA);
    shopBox(0.46, 0.14, 0.36, 0.34, 1.06, 0.02, mCol(cargo.color), tableA);
    shopBox(0.4, 0.05, 0.3, 0.36, 1.16, 0.06, mCol("#e04a4a"), tableA);

    // shoes + hats table (real colours pulled from the shop catalogue)
    const shoe1 = shopItemOf("shoe_runners") || {};
    const shoe2 = shopItemOf("shoe_hightops") || {};
    const capI = shopItemOf("hat_cap") || {};
    const fedI = shopItemOf("hat_fedora") || {};
    [[-0.5, 0.0, shoe1], [-0.06, 0.22, shoe2]].forEach((q) => {
      const sole = shopBox(0.24, 0.1, 0.4, q[0], 0.88, q[1], mCol(q[2].sole, 0.7), tableB);
      sole.rotation.y = 0.2;
      const up = shopBox(0.24, 0.14, 0.34, q[0], 0.99, q[1] - 0.04, mCol(q[2].color, 0.55), tableB);
      up.rotation.y = 0.2;
    });
    const capDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      mCol(capI.color, 0.6));
    capDome.position.set(0.44, 0.83, -0.16); tableB.add(capDome);
    const capBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.17, 0.03, 18, 1, false, 0, Math.PI * 0.85),
      mCol(capI.color, 0.6));
    capBrim.position.set(0.44, 0.85, -0.02); tableB.add(capBrim);
    const fed = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.15, 18), mCol(fedI.color, 0.62));
    fed.position.set(0.5, 0.94, 0.24); tableB.add(fed);
    const fedBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 20), mCol(fedI.color, 0.62));
    fedBrim.position.set(0.5, 0.87, 0.24); tableB.add(fedBrim);

    // hat shelf on the back wall, left of the counter
    shopBox(1.2, 0.08, 0.34, -2.6, 1.5, 1.98, wood);
    const beanie = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      mCol((shopItemOf("hat_beanie") || {}).color, 0.6));
    beanie.position.set(-2.85, 1.54, 1.96); g.add(beanie);
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.16, 16),
      mCol((shopItemOf("hat_crown") || {}).color, 0.35));
    crown.position.set(-2.35, 1.62, 1.96); g.add(crown);

    // luck pedestal with a bobbing orb
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, 0.95, 20), woodD);
    ped.position.set(-2.4, 0.475, 0.55); ped.castShadow = ped.receiveShadow = true; g.add(ped);
    const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 20), wood);
    pedTop.position.set(-2.4, 0.99, 0.55); g.add(pedTop);
    shopOrb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 16),
      new THREE.MeshStandardMaterial({ color: 0xb79bff, emissive: 0x5a2fc0, emissiveIntensity: 1.2, roughness: 0.2 }));
    shopOrb.position.set(-2.4, 1.3, 0.55);
    shopOrbY = 1.3;
    g.add(shopOrb);

    // chair skin display on a podium
    const chairG = new THREE.Group();
    chairG.position.set(2.4, 0, 0.55);
    chairG.rotation.y = -0.5;
    g.add(chairG);
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.22, 22), woodD);
    podium.position.y = 0.11; podium.receiveShadow = true; chairG.add(podium);
    const chairSkin = new THREE.MeshStandardMaterial({ color: 0x36b7ff, roughness: 0.55 });
    shopBox(0.6, 0.1, 0.6, 0, 0.66, 0, chairSkin, chairG);
    [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].forEach((q) => {
      shopBox(0.08, 0.5, 0.08, q[0], 0.38, q[1], woodD, chairG);
    });
    shopBox(0.6, 0.7, 0.09, 0, 1.06, -0.26, chairSkin, chairG);

    // mannequin wearing the featured outfit
    shopModel = makeCharacter("#f0c8a0", "Model", false, {
      character: "char_zara", shirt: "top_gold", pants: "pant_suit",
      shoes: "shoe_gold", cap: "hat_crown"
    });
    shopModel.tag.visible = false;
    shopModel.root.position.set(SHOP.x + 2.7, 0, SHOP.z - 1.62);
    shopModel.root.rotation.y = Math.PI;          // faces the door

    // the shopkeeper behind the counter
    shopKeeper = makeCharacter("#c98a52", "Shopkeeper", false, {
      character: "char_rex", shirt: "top_jacket", pants: "pant_cargo",
      shoes: "shoe_boots", cap: "hat_none"
    });
    shopKeeper.root.position.set(SHOP.x, 0, SHOP.z + 1.72);
    shopKeeper.root.rotation.y = Math.PI;         // faces the customers
    shopKeeper.phaseOff = 1.7;
    setTag(shopKeeper.tag, "Shopkeeper", 0, "#ffd76a", "Items for sale");

    // one cheap point light + a lamp so the inside is readable
    shopLight = new THREE.PointLight(0xffe6bf, 0.55, 9, 1);
    shopLight.position.set(0, 2.55, 0.2);
    g.add(shopLight);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), woodD);
    cord.position.set(0, 3.25, 0.2); g.add(cord);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffdf9a, emissiveIntensity: 1.5, roughness: 0.4 }));
    lamp.position.set(0, 3.02, 0.2); g.add(lamp);

    /* ---- collision: walls only, the doorway stays open ---- */
    const wx = SHOP.x, wz = SHOP.z;
    colliders.push({ x: wx - 3.4, z: wz, hx: 0.1 + PLAYER_R, hz: 2.2 + PLAYER_R });
    colliders.push({ x: wx + 3.4, z: wz, hx: 0.1 + PLAYER_R, hz: 2.2 + PLAYER_R });
    colliders.push({ x: wx, z: wz + 2.1, hx: 3.5 + PLAYER_R, hz: 0.1 + PLAYER_R });
    colliders.push({ x: wx - 2.2, z: wz - 2.1, hx: 1.3 + PLAYER_R, hz: 0.1 + PLAYER_R });
    colliders.push({ x: wx + 2.2, z: wz - 2.1, hx: 1.3 + PLAYER_R, hz: 0.1 + PLAYER_R });
    colliders.push({ x: wx, z: wz + 1.05, hx: 1.85 + PLAYER_R, hz: 0.39 + PLAYER_R });
    colliders.push({ x: wx - 2.3, z: wz - 0.45, hx: 0.75 + PLAYER_R, hz: 0.45 + PLAYER_R });
    colliders.push({ x: wx + 2.3, z: wz - 0.45, hx: 0.75 + PLAYER_R, hz: 0.45 + PLAYER_R });
    colliders.push({ x: wx - 2.4, z: wz + 0.55, hx: 0.42 + PLAYER_R, hz: 0.42 + PLAYER_R });
    colliders.push({ x: wx + 2.4, z: wz + 0.55, hx: 0.7 + PLAYER_R, hz: 0.7 + PLAYER_R });
    colliders.push({ x: wx + 2.7, z: wz - 1.62, hx: 0.35 + PLAYER_R, hz: 0.35 + PLAYER_R });

    /* ---- what you can browse from where ---- */
    shopStops = [
      { x: wx, z: wz + 1.15, r: 1.7, tab: "characters", sub: null, label: "Press E to talk to the Shopkeeper" },
      { x: wx - 2.3, z: wz - 0.45, r: 1.4, tab: "clothes", sub: "shirts", label: "Press E for Clothes" },
      { x: wx + 2.3, z: wz - 0.45, r: 1.4, tab: "clothes", sub: "shoes", label: "Press E for Shoes" },
      { x: wx - 2.6, z: wz + 1.85, r: 1.2, tab: "clothes", sub: "caps", label: "Press E for Hats" },
      { x: wx - 2.4, z: wz + 0.55, r: 1.3, tab: "luck", sub: null, label: "Press E for Luck upgrades" },
      { x: wx + 2.4, z: wz + 0.55, r: 1.4, tab: "chairs", sub: null, label: "Press E for Chair skins" },
      { x: wx + 2.7, z: wz - 1.62, r: 1.3, tab: "characters", sub: null, label: "Press E for Characters" }
    ];
  }

  function buildScenery() {
    const r = rand(20261004);
    const freeSpot = (minR, maxR) => {
      for (let i = 0; i < 40; i++) {
        const a = r() * Math.PI * 2;
        const d = minR + r() * (maxR - minR);
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (Math.abs(x) < 21 && Math.abs(z) < 21) continue;         // keep the tables clear
        if (Math.abs(x) < 9 && z > 18 && z < 41) continue;          // keep the shop + spawn clear
        return { x: x, z: z };
      }
      return null;
    };

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4526, roughness: 0.95 });
    const leafMats = [0x3f8f3a, 0x47a043, 0x347c32, 0x55a94a].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9aa2ad, roughness: 0.95, flatShading: true });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f8a35, roughness: 1 });
    const petalMats = [0xff6f9a, 0xffd257, 0xffffff, 0xb98cff, 0xff9a4d].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }));

    // leafy trees around the island
    for (let i = 0; i < 30; i++) {
      const s = freeSpot(23, 44);
      if (!s) continue;
      const g = new THREE.Group();
      g.position.set(s.x, 0, s.z);
      const h = 2.1 + r() * 1.7;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.26, h, 8), trunkMat);
      trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
      const lm = leafMats[Math.floor(r() * leafMats.length)];
      const blob = (y, rad, sx, sy, sz) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 10), lm);
        m.position.y = y; m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m);
      };
      blob(h + 0.55, 1.25 + r() * 0.5, 1, 0.92, 1);
      blob(h + 1.5, 0.85 + r() * 0.4, 1, 0.95, 1);
      blob(h + 0.15, 1.0, 1.15, 0.7, 1.15);
      scene.add(g);
      colliders.push({ x: s.x, z: s.z, hx: 0.5 + PLAYER_R, hz: 0.5 + PLAYER_R });
    }

    // rocks
    for (let i = 0; i < 24; i++) {
      const s = freeSpot(21, 45);
      if (!s) continue;
      const size = 0.35 + r() * 0.7;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), rockMat);
      m.position.set(s.x, size * 0.42, s.z);
      m.rotation.set(r() * 3, r() * 3, r() * 3);
      m.scale.set(1, 0.7, 1.15);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      if (size > 0.6) colliders.push({ x: s.x, z: s.z, hx: size + PLAYER_R, hz: size + PLAYER_R });
    }

    // flowers
    for (let i = 0; i < 70; i++) {
      const s = freeSpot(9, 45);
      if (!s) continue;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 5), stemMat);
      stem.position.set(s.x, 0.12, s.z);
      scene.add(stem);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6),
        petalMats[Math.floor(r() * petalMats.length)]);
      head.position.set(s.x, 0.27, s.z);
      head.scale.set(1, 0.7, 1);
      scene.add(head);
    }

    // drifting clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.94 });
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group();
      const a = r() * Math.PI * 2, d = 40 + r() * 90;
      g.position.set(Math.cos(a) * d, 28 + r() * 22, Math.sin(a) * d);
      for (let k = 0; k < 4; k++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(4 + r() * 4, 12, 10), cloudMat);
        m.position.set((k - 1.5) * 5.5 + r() * 3, r() * 2.5, (r() - 0.5) * 5);
        m.scale.y = 0.5;
        g.add(m);
      }
      scene.add(g);
    }
  }

  /* stone plaza under the tables + a path to the shop */
  function buildPlaza() {
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(27, 72),
      new THREE.MeshStandardMaterial({ color: 0xc3b190, roughness: 1 })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    plaza.receiveShadow = true;
    scene.add(plaza);

    const edge = new THREE.Mesh(
      new THREE.RingGeometry(26.1, 27, 72),
      new THREE.MeshStandardMaterial({ color: 0x9c8a6d, roughness: 1 })
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.026;
    scene.add(edge);

    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5.6),
      new THREE.MeshStandardMaterial({ color: 0xcbbb9c, roughness: 1 })
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(SHOP.x, 0.024, SHOP.z - 5);
    path.receiveShadow = true;
    scene.add(path);
  }

  function buildWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8ecdf5);            // clear day sky
    scene.fog = new THREE.Fog(0x8ecdf5, 80, 230);

    camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 420);

    // ---- daylight ----
    scene.add(new THREE.HemisphereLight(0xdaf1ff, 0x4c7a3a, 0.5));
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    const sun = new THREE.DirectionalLight(0xfff4dc, 0.6);
    sun.position.set(34, 58, 24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -54; sc.right = 54; sc.top = 54; sc.bottom = -54; sc.far = 150;
    sc.updateProjectionMatrix();
    scene.add(sun);

    // ---- water, all the way around the island ----
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshStandardMaterial({ map: waterTexture(), roughness: 0.2, metalness: 0.2 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.4;
    scene.add(water);
    waterMesh = water;

    // ---- the island ----
    const land = new THREE.Mesh(
      new THREE.CircleGeometry(LAND_R, 96),
      new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 })
    );
    land.rotation.x = -Math.PI / 2;
    land.receiveShadow = true;
    scene.add(land);

    // sandy beach at the rim so land and water meet properly
    const shore = new THREE.Mesh(
      new THREE.RingGeometry(LAND_R - 5, LAND_R, 96),
      new THREE.MeshStandardMaterial({ color: 0xead9a6, roughness: 1 })
    );
    shore.rotation.x = -Math.PI / 2;
    shore.position.y = 0.012;
    shore.receiveShadow = true;
    scene.add(shore);

    buildPlaza();

    tables = [];
    colliders = [];
    const n = Math.min(B.CFG.stationCount || 9, 16);
    const side = Math.ceil(Math.sqrt(n));
    for (let i = 1; i <= n; i++) {
      const col = (i - 1) % side;
      const row = Math.floor((i - 1) / side);
      const x = (col - (side - 1) / 2) * SPACING;
      const z = (row - (side - 1) / 2) * SPACING;
      tables.push(buildTable(i, x, z));
      colliders.push({ x: x, z: z, hx: 2.5 + PLAYER_R, hz: 1.5 + PLAYER_R });
    }

    buildKiosk();
    buildScenery();

    built = true;
  }

  function buildTable(id, x, z) {
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5730, roughness: 0.75 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3a2413, roughness: 0.9 });
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);

    const top = new THREE.Mesh(new THREE.BoxGeometry(5, 0.22, 3), wood);
    top.position.y = 1.0; top.castShadow = true; top.receiveShadow = true; g.add(top);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(5.16, 0.1, 3.16), dark);
    trim.position.y = 0.88; g.add(trim);

    [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.2], [2.2, 1.2]].forEach((p) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.9, 8), dark);
      leg.position.set(p[0], 0.45, p[1]);
      g.add(leg);
    });

    // two chairs, opposite sides (each chair owns its material so a
    // chair skin from the shop can recolour just that one seat)
    const chairs = [];
    [-1, 1].forEach((dir) => {
      const c = new THREE.Group();
      c.position.set(x, 0, z + dir * 2.7);
      c.rotation.y = dir === -1 ? 0 : Math.PI;   // face the table
      scene.add(c);

      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.75 });
      const legMat = new THREE.MeshStandardMaterial({ color: 0x5e3d1e, roughness: 0.85 });

      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 1.05), bodyMat);
      seat.position.y = SEAT_H; seat.castShadow = true; c.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 0.14), bodyMat);
      back.position.set(0, 1.0, -0.45); back.castShadow = true; c.add(back);

      [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]].forEach((p) => {
        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, SEAT_H, 6), legMat);
        l.position.set(p[0], SEAT_H / 2, p[1]);
        c.add(l);
      });

      chairs.push({
        x: x, z: z + dir * 2.7, ry: dir === -1 ? 0 : Math.PI,
        bodyMat: bodyMat, legMat: legMat, skinKey: ""
      });
    });

    // rotating 3D card above the table
    const tex0 = cardTexture(null);
    const edge = new THREE.MeshStandardMaterial({ color: 0x11162a, roughness: 0.6 });
    const front = new THREE.MeshStandardMaterial({
      map: tex0, emissiveMap: tex0, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.55
    });
    const back = new THREE.MeshStandardMaterial({ color: 0x1b2444, roughness: 0.7 });
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.0, 0.09), [edge, edge, edge, edge, front, back]);
    card.position.set(x, 2.35, z);
    card.castShadow = true;
    scene.add(card);

    // status board floating over the table
    const boardTex = boardTexture(["STATION " + id, "Waiting", ""]);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.06),
      new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, side: THREE.DoubleSide })
    );
    board.position.set(x, 4.1, z);
    scene.add(board);

    return {
      id: id, x: x, z: z, g: g, card: card, front: front, chairs: chairs,
      board: board, boardTex: boardTex, lastBoard: "",
      lastCard: ""
    };
  }

  /* ---------------- rendering ---------------- */
  function ensureRenderer() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ canvas: el("w3canvas"), antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    resize();
  }

  function resize() {
    if (!renderer || !camera) return;
    const host = el("world3d");
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ---------------- input ---------------- */
  function onKeyDown(e) {
    if (!running) return;
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (B.modalOpen && B.modalOpen()) {   // shop / collection owns the keyboard
      keys[e.key.toLowerCase()] = false;
      return;
    }
    keys[e.key.toLowerCase()] = true;
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === " ") e.preventDefault();
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === "e") { if (nearShop) openWorldShop(); else toggleSit(); }
    if (k === "b") firstBid();
    if (k === "p") openPass();
    if (k === " " || e.code === "Space") jump();
  }
  function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }

  function openWorldShop() {
    if (!B.openShop) return;
    const s = nearStop;
    B.openShop(s ? s.tab : undefined, s && s.sub ? s.sub : undefined);
    B.Sfx && B.Sfx.click && B.Sfx.click();
  }

  /* ---------------- shop kiosk proximity ---------------- */
  function setNearShop(on, label) {
    const txt = on
      ? (label || "Press E to open the Shop")
      : (touchMode ? "Stick to move · drag to look · Jump button to hop"
                   : "WASD to move · drag to look · Space to jump");
    if (on === nearShop && txt === hintLast) return;
    nearShop = on;
    hintLast = txt;
    const hint = el("w3Hint");
    if (hint) hint.textContent = txt;
  }

  function updateShop(dt, now) {
    if (kioskCoin) {
      kioskCoin.rotation.y += dt * 1.4;
      kioskCoin.position.y = 7.8 + Math.sin(now / 520) * 0.22;
    }
    if (shopOrb) {
      shopOrb.rotation.y += dt * 0.9;
      shopOrb.position.y = shopOrbY + Math.sin(now / 620) * 0.07;
    }
    if (shopKeeper) {
      // the shopkeeper idles: slow breathing, a little look-around, weight shift
      const w = Math.sin(animTime * 1.4 + 0.6);
      shopKeeper.torso.scale.set(
        shopKeeper.torsoBase.x,
        shopKeeper.torsoBase.y * (1 + Math.sin(animTime * 2.0) * 0.026),
        shopKeeper.torsoBase.z);
      shopKeeper.head.rotation.y = Math.sin(animTime * 0.5) * 0.42;
      shopKeeper.head.rotation.x = 0.03;
      shopKeeper.armL.rotation.x = -0.12 + w * 0.06;
      shopKeeper.armR.rotation.x = -0.12 - w * 0.06;
      shopKeeper.root.rotation.z = Math.sin(animTime * 0.8) * 0.015;
      poseFx(shopKeeper, dt);
    }
    if (!me || seated != null || sitTween || (B.modalOpen && B.modalOpen())) {
      nearStop = null;
      setNearShop(false);
      return;
    }
    const p = me.root.position;

    // indoor displays win over the plain "shop is near" prompt
    let best = null;
    for (let i = 0; i < shopStops.length; i++) {
      const s = shopStops[i];
      const d = Math.hypot(p.x - s.x, p.z - s.z);
      if (d <= s.r && (!best || d / s.r < best.k)) best = { s: s, k: d / s.r };
    }
    if (best) {
      nearStop = best.s;
      setNearShop(true, best.s.label);
      return;
    }
    nearStop = null;
    setNearShop(Math.hypot(p.x - SHOP.x, p.z - SHOP.z) < SHOP.range, "Press E to open the Shop");
  }

  function bindPointer() {
    const cv = el("w3canvas");
    cv.addEventListener("pointerdown", (e) => {
      dragging = true; lastPtr = { x: e.clientX, y: e.clientY };
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    });
    cv.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastPtr.x, dy = e.clientY - lastPtr.y;
      lastPtr = { x: e.clientX, y: e.clientY };
      camYaw -= dx * 0.006;
      camHeight = Math.max(2.4, Math.min(9, camHeight + dy * 0.02));
    });
    const up = () => { dragging = false; };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", (e) => {
      camDist = Math.max(5, Math.min(18, camDist + e.deltaY * 0.01));
      e.preventDefault();
    }, { passive: false });

    // virtual joystick (touch)
    const stk = el("w3Stick"), knob = el("w3Knob");
    let sid = null;
    const moveStick = (e) => {
      const r = stk.getBoundingClientRect();
      let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      stick.x = dx; stick.y = dy;
      knob.style.transform = "translate(" + dx * 30 + "px," + dy * 30 + "px)";
    };
    stk.addEventListener("pointerdown", (e) => { sid = e.pointerId; stk.setPointerCapture(sid); moveStick(e); e.preventDefault(); });
    stk.addEventListener("pointermove", (e) => { if (sid === e.pointerId) moveStick(e); });
    const endStick = (e) => {
      if (sid !== e.pointerId) return;
      sid = null; stick.x = 0; stick.y = 0;
      knob.style.transform = "translate(0,0)";
    };
    stk.addEventListener("pointerup", endStick);
    stk.addEventListener("pointercancel", endStick);

    window.addEventListener("resize", resize);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }

  /* ---------------- movement ---------------- */
  function forwardVec() { return { x: -Math.sin(camYaw), z: -Math.cos(camYaw) }; }
  function rightVec() { return { x: Math.cos(camYaw), z: -Math.sin(camYaw) }; }

  function updatePlayer(dt) {
    if (!me) return;
    if (sitTween) { updateSitTween(dt); return; }
    if (seated != null) {
      if (me.cheer > 0) poseCheer(me, dt, true);
      else poseSit(me);
      return;
    }

    let mx = 0, mz = 0;
    const f = forwardVec(), r = rightVec();
    if (keys.w || keys.arrowup) { mx += f.x; mz += f.z; }
    if (keys.s || keys.arrowdown) { mx -= f.x; mz -= f.z; }
    if (keys.a || keys.arrowleft) { mx -= r.x; mz -= r.z; }
    if (keys.d || keys.arrowright) { mx += r.x; mz += r.z; }
    if (Math.abs(stick.x) > 0.12 || Math.abs(stick.y) > 0.12) {
      mx += f.x * -stick.y + r.x * stick.x;
      mz += f.z * -stick.y + r.z * stick.x;
    }

    const len = Math.hypot(mx, mz);
    const p = me.root.position;
    if (len > 0.02) {
      mx /= len; mz /= len;
      p.x += mx * WALK * dt;
      p.z += mz * WALK * dt;
      resolveCollisions(p);
      const target = Math.atan2(mx, mz);
      me.root.rotation.y = lerpAngle(me.root.rotation.y, target, Math.min(1, dt * 12));
      walkPhase += dt * 11;
      sendPos();
    } else {
      walkPhase = 0;
    }

    // jump + gravity
    if (onGround && (jumpQueued || keys[" "])) { vy = JUMP_V; onGround = false; me.squash = 0.16; }
    jumpQueued = false;
    if (!onGround) {
      vy -= GRAVITY * dt;
      p.y += vy * dt;
      if (p.y <= 0) {
        if (vy < -4) me.squash = 0.24;   // hard landing - squash on impact
        p.y = 0; vy = 0; onGround = true;
      }
    } else if (p.y !== 0) {
      p.y = 0;
    }

    if (!onGround) poseAir(me, vy);
    else poseWalk(me, walkPhase, len > 0.02 ? 1 : 0, p.y);
    poseCheer(me, dt);
    poseFx(me, dt);
  }

  function jump() { if (seated == null && !sitTween) jumpQueued = true; }

  function resolveCollisions(p) {
    for (const c of colliders) {
      const dx = p.x - c.x, dz = p.z - c.z;
      if (Math.abs(dx) < c.hx && Math.abs(dz) < c.hz) {
        const px = c.hx - Math.abs(dx), pz = c.hz - Math.abs(dz);
        if (px < pz) p.x = c.x + (dx < 0 ? -1 : 1) * c.hx;
        else p.z = c.z + (dz < 0 ? -1 : 1) * c.hz;
      }
    }
    // island edge - the player can never reach the water
    const d = Math.hypot(p.x, p.z);
    if (d > BOUND_R) { p.x = (p.x / d) * BOUND_R; p.z = (p.z / d) * BOUND_R; }
  }

  function lerpAngle(a, b, t) {
    let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  function updateSitTween(dt) {
    sitTween.t += dt;
    const k = Math.min(1, sitTween.t / sitTween.dur);
    const e = 1 - Math.pow(1 - k, 3);
    const p = me.root.position;
    p.x = sitTween.from.x + (sitTween.to.x - sitTween.from.x) * e;
    p.z = sitTween.from.z + (sitTween.to.z - sitTween.from.z) * e;
    me.root.rotation.y = lerpAngle(sitTween.fromRy, sitTween.ry, e);
    poseWalk(me, walkPhase, 0);
    walkPhase += dt * 9;
    if (k >= 1) { poseSit(me); sitTween = null; }
  }

  /* ---------------- camera ---------------- */
  function updateCamera(dt) {
    if (!camera || !me) return;
    const jumpY = me.root.position.y || 0;
    const baseY = (seated != null ? 1.35 : 1.5) + jumpY * 0.9;
    // follow the jump smoothly instead of snapping - rise a little slower
    // than the character so the lift reads on screen, then settle on landing
    const follow = jumpY > 0.06 ? 9 : 5.5;
    camFocusY += (baseY - camFocusY) * Math.min(1, dt * follow);
    const focus = new THREE.Vector3(me.root.position.x, camFocusY, me.root.position.z);
    const desired = new THREE.Vector3(
      focus.x + Math.sin(camYaw) * camDist,
      focus.y + camHeight,
      focus.z + Math.cos(camYaw) * camDist
    );
    const k = Math.min(1, dt * 6);
    camera.position.lerp(desired, k);
    camera.lookAt(focus);
  }

  /* ---------------- interaction ---------------- */
  function freeChairNear() {
    const v = App.view;
    if (!v || !me) return null;
    const p = me.root.position;
    let best = null;
    for (const t of tables) {
      const st = v.stations[t.id - 1];
      if (!st || st.state === "FINISHED") continue;
      for (let i = 0; i < t.chairs.length && i < st.seats.length; i++) {
        const s = st.seats[i];
        const mineHere = !!(s && s.id === App.pid);
        if (s && !mineHere) continue;              // somebody else owns this chair
        const ch = t.chairs[i];
        if (!ch) continue;
        const d = Math.hypot(ch.x - p.x, ch.z - p.z);
        if (d < SIT_RANGE && (!best || d < best.d)) best = { t: t, i: i, d: d };
      }
    }
    return best;
  }

  function toggleSit() {
    if (seated != null) { standUp(); return; }
    const hit = freeChairNear();
    if (!hit) return;
    B.act("sit", { station: hit.t.id, seat: hit.i });
    // the seat comes back through the shared view a moment later
  }

  function standUp() {
    if (seated == null) return;
    B.act("stand", {});
    seated = null;
    if (me) { poseStand(me); me.root.position.y = 0; }
    if (standPos) { me.root.position.x = standPos.x; me.root.position.z = standPos.z; }
    setHud(false);
  }

  function firstBid() {
    const hud = el("w3Hud");
    const row = el("w3Row");
    if (!hud || hud.hidden || !row || seated == null) return;
    const btns = row.querySelectorAll(".bidbtn[data-tier]");
    for (const b of btns) { if (!b.disabled) { b.click(); return; } }
  }

  function openPass() {
    if (seated == null) return;
    const box = el("w3PassBox");
    if (box) box.hidden = false;
  }

  /* ---------------- HUD ---------------- */
  function setHud(on) {
    el("w3Hud").hidden = !on;
    if (!on) { resultKey = ""; hideResult(); }
  }

  /* who is at the table, what they can afford and who currently leads */
  function renderSeats(st, v) {
    const box = el("w3Seats");
    if (!box) return;
    const seats = st.seats || [];
    const sig = seats.map((s) => (s ? s.id + ":" + (s.leader ? 1 : 0) + (s.passed ? 1 : 0) + (s.left ? 1 : 0) : "-")).join("|");
    if (sig === seatKey) return;
    seatKey = sig;
    box.innerHTML = "";
    const list = (v && v.players) || [];
    for (let i = 0; i < seats.length; i++) {
      const s = seats[i];
      if (!s) continue;
      let coins = null, color = "#8b94ad", wins = 0;
      for (let j = 0; j < list.length; j++) {
        if (list[j].id === s.id) { coins = list[j].coins; color = list[j].color || color; wins = list[j].wins || 0; break; }
      }
      const mine = s.id === App.pid;
      const cls = "seatchip" + (mine ? " me" : "") + (s.leader ? " lead" : "") + (s.passed || s.left ? " out" : "");
      const chip = document.createElement("span");
      chip.className = cls;
      chip.title = mine ? "You" : s.name + " — " + wins + " wins";
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = color;
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.textContent = s.name + (mine ? " (you)" : "");
      chip.appendChild(dot);
      chip.appendChild(nm);
      if (coins != null) {
        const cv = document.createElement("span");
        cv.className = "cv";
        cv.textContent = B.fmtCoins(coins);
        chip.appendChild(cv);
      }
      const note = s.passed ? "passed" : s.left ? "left" : s.leader ? "leads" : "";
      if (note) {
        const n = document.createElement("span");
        n.textContent = note;
        chip.appendChild(n);
      }
      box.appendChild(chip);
    }
  }

  /* the last few things that happened in this round, newest first */
  function renderFeed(st) {
    const feed = el("w3Feed");
    if (!feed) return;
    const log = st.log || [];
    const last = log.length ? log[log.length - 1] : null;
    const sig = log.length + ":" + (last ? last.kind + (last.who || "") + (last.amt || 0) : "");
    if (sig === feedKey) return;
    feedKey = sig;
    const ul = el("w3Log");
    if (!ul) return;
    ul.innerHTML = "";
    feed.hidden = log.length === 0;
    for (let i = log.length - 1; i >= 0 && log.length - i <= 5; i--) {
      const e = log[i];
      const li = document.createElement("li");
      li.className = e.kind === "pass" ? "pass" : (e.kind === "end" || e.kind === "none") ? "end" : "";
      const who = document.createElement("span");
      who.className = "who";
      who.textContent = e.kind === "bid" ? (e.who || "?") + " bid"
        : e.kind === "pass" ? (e.who || "?") + " passed"
        : e.kind === "end" ? (e.who || "?") + " wins"
        : "no sale";
      li.appendChild(who);
      if (e.amt != null && e.amt > 0) {
        const a = document.createElement("span");
        a.className = "amt2";
        a.textContent = B.fmtCoins(e.amt);
        li.appendChild(a);
      }
      ul.appendChild(li);
    }
  }

  /* the round is over - one card with the winner, the price and the art */
  function showResult(st) {
    const box = el("w3Result");
    if (!box || !st || !st.result) return;
    const r = st.result;
    const won = r.winnerId === App.pid;
    const none = r.winnerId == null;
    el("w3RKicker").textContent = none ? "NO SALE" : won ? "YOU WON THE AUCTION" : "AUCTION CLOSED";
    el("w3RWho").textContent = none ? "Nobody wanted it" : (r.winner || "Someone");
    el("w3RPrice").textContent = none
      ? "The card goes back to the pool"
      : "Final price: " + B.fmtCoins(r.price || 0);
    el("w3RCard").textContent = st.card
      ? st.card.name + " \u00b7 " + st.card.rarity + " \u00b7 +" + st.card.income + "/sec"
      : "";
    el("w3RAgain").hidden = none;
    const inner = box.querySelector(".w3rbox");
    if (inner) inner.classList.toggle("win", !none && won);
    const art = el("w3RArt");
    art.innerHTML = "";
    if (st.card && B.cardFace) {
      try {
        const c = document.createElement("canvas");
        c.width = 240; c.height = 336;
        B.cardFace(c.getContext("2d"), st.card, 240, 336);
        art.appendChild(c);
      } catch (e) { /* art is decoration, never worth breaking the result */ }
    }
    box.hidden = false;
    if (won && B.Sfx) { try { B.Sfx.win(); } catch (e) {} }
    else if (!none && B.Sfx) { try { B.Sfx.click(); } catch (e) {} }
  }
  function hideResult() {
    const box = el("w3Result");
    if (box && !box.hidden) box.hidden = true;
  }

  function syncHud() {
    const v = App.view;
    if (!v) return;
    const you = v.you || {};
    if (me) {
      let mine = null;
      const list = v.players || [];
      for (let i = 0; i < list.length; i++) if (list[i].id === App.pid) { mine = list[i]; break; }
      if (mine) setTag(me.tag, mine.name || you.name || "You", mine.wins || 0, mine.color || "#4aa8ff");
    }
    el("w3coins").textContent = B.fmtCoins(you.coins || 0);
    el("w3income").textContent = "+" + B.fmtCoins(you.income || 0) + "/sec";
    const rm = el("w3room");
    rm.hidden = !App.room;
    if (App.room) rm.textContent = App.room;

    const stationNow = you.station;
    // the engine moved us to a different table (sat somewhere else) - resync
    if (stationNow != null && seated != null && stationNow !== seated && !sitTween) {
      seated = null;
      if (me) { poseStand(me); me.root.position.y = 0; }
      standPos = { x: me.root.position.x, z: me.root.position.z };
      setHud(false);
    }
    if (stationNow != null && seated == null && me && !sitTween) {
      // seat granted - walk to the chair then sit
      const t = tables[stationNow - 1];
      const st = B.station(stationNow);
      let idx = 0;
      if (st) { for (let i = 0; i < st.seats.length; i++) if (st.seats[i] && st.seats[i].id === App.pid) idx = i; }
      if (t && t.chairs[idx]) {
        seated = stationNow;
        standPos = { x: me.root.position.x, z: me.root.position.z };
        sitTween = {
          from: { x: me.root.position.x, z: me.root.position.z },
          to: { x: t.chairs[idx].x, z: t.chairs[idx].z },
          ry: t.chairs[idx].ry,
          fromRy: me.root.rotation.y,
          t: 0, dur: 0.55
        };
        setHud(true);
        el("w3PassBox").hidden = true;
        B.Sfx && B.Sfx.click && B.Sfx.click();
      }
    } else if (stationNow == null && seated != null) {
      seated = null;
      if (me) { poseStand(me); me.root.position.y = 0; }
      if (standPos) { me.root.position.x = standPos.x; me.root.position.z = standPos.z; }
      setHud(false);
    }

    if (seated != null) renderHud(seated);
    updatePrompt();
  }

  function renderHud(id) {
    const st = B.station(id);
    if (!st) return;
    const v = App.view, you = v.you || {};
    const meSeat = st.seats.find((s) => s && s.id === App.pid);
    const active = st.state === "ACTIVE";

    // fire the celebration emote exactly once per finished auction
    const rk = st.state === "FINISHED" && st.result ? String(st.result.winnerId) + ":" + st.round : "";
    if (rk !== lastWinKey) {
      if (rk && st.result.winnerId === App.pid && me) me.cheer = 1.9;
      lastWinKey = rk;
    }

    if (st.card) {
      const r = B.getRarity(st.card.rarity);
      el("w3Card").textContent = st.card.name;
      el("w3Card").style.color = r.color;
      el("w3Rarity").textContent = st.card.rarity + " · +" + st.card.income + "/sec";
      el("w3Rarity").style.color = r.color;
    } else {
      el("w3Card").textContent = st.state === "FINISHED" && st.result ? st.result.text : "Waiting for a card...";
      el("w3Card").style.color = "";
      el("w3Rarity").textContent = "";
    }
    el("w3Bid").textContent = st.currentBid > 0 ? "HIGH BID: " + st.currentBid : "NO BIDS YET";
    el("w3Bidder").textContent = st.highestName ? "by " + st.highestName : "";

    renderSeats(st, v);
    renderFeed(st);

    if (seated != null && st.state === "FINISHED" && st.result) {
      const rk = String(st.round) + ":" + (st.result.winnerId || "-") + ":" + (st.result.price || 0);
      if (rk !== resultKey) { resultKey = rk; showResult(st); }
    } else {
      resultKey = "";
      hideResult();
    }

    const live = st.state === "ACTIVE" || st.state === "STARTING" || st.state === "FINISHED";
    el("w3Tfill").style.width = (live && st.phaseTotal > 0 ? Math.max(0, Math.min(1, st.timeLeft / st.phaseTotal)) * 100 : 0) + "%";
    el("w3Tbar").classList.toggle("idle", !live);
    el("w3Tbar").classList.toggle("warn", st.state === "ACTIVE" && st.timeLeft <= 5);
    el("w3Time").textContent = live ? Math.max(0, Math.ceil(st.timeLeft)) + "s" : "--";
    el("w3TurnLine").classList.toggle("idle", !live);

    let msg = "Bid or Pass";
    if (st.state === "WAITING") msg = "Waiting for a second player...";
    else if (st.state === "STARTING") msg = "Get ready!";
    else if (st.state === "FINISHED") msg = B.displayResult(st.result);
    else if (!meSeat) msg = "Watching this auction";
    else if (meSeat.passed) msg = "You passed";
    else if (meSeat.leader) msg = "You lead the auction";
    el("w3Turn").textContent = msg;

    const canBid = !!meSeat && active && !meSeat.passed && !meSeat.leader;
    const coins = you.coins || 0;
    const amounts = B.bidTiers(st, B.minBidFor(id));
    const btns = el("w3Row").querySelectorAll(".bidbtn[data-tier]");
    for (let i = 0; i < btns.length; i++) {
      btns[i].querySelector(".amt").textContent = B.fmtCoins(amounts[i]);
      btns[i].disabled = !canBid || amounts[i] > coins;
    }
    el("w3Pass").disabled = !(meSeat && active && !meSeat.passed);

    // exact bid: any number between the minimum and what you can afford
    const cAmt = el("w3CustomAmt"), cGo = el("w3CustomGo");
    if (cAmt && cGo) {
      const min = B.minBidFor(id);
      cAmt.disabled = !canBid;
      cGo.disabled = !canBid;
      if (cAmt.getAttribute("data-min") !== String(min)) {
        cAmt.setAttribute("data-min", String(min));
        cAmt.min = String(min);
        cAmt.placeholder = "custom bid \u2265 " + min;
        // a stale number below the new minimum would only be rejected, so drop it
        if (cAmt.value !== "" && Number(cAmt.value) < min) cAmt.value = "";
      }
    }
  }

  function updatePrompt() {
    const p = el("w3Prompt");
    const act = el("w3Action");
    if (seated != null || sitTween) { p.hidden = true; act.classList.remove("on"); return; }
    const hit = freeChairNear();
    if (hit) {
      p.hidden = false;
      p.textContent = touchMode
        ? "Station " + hit.t.id + " — tap Sit"
        : "Station " + hit.t.id + " — press E to sit";
      if (touchMode) { act.textContent = "Sit"; act.classList.add("on"); }
    } else {
      p.hidden = true;
      act.classList.remove("on");
    }
  }

  /* ---------------- syncing the shared game view ---------------- */
  function chairOf(stationId, index) {
    const t = tables[stationId - 1];
    return t && t.chairs[index] ? t.chairs[index] : null;
  }

  /* a chair takes the skin of whoever sits on it */
  function applyChairSkin(stationId, index, cos) {
    const ch = chairOf(stationId, index);
    if (!ch || !ch.bodyMat) return;
    const id = (cos && cos.chair) || "chair_wood";
    if (ch.skinKey === id) return;
    ch.skinKey = id;
    const it = shopItemOf(id) || { color: "#8a5a2b", accent: "#5e3d1e" };
    ch.bodyMat.color.set(it.color || "#8a5a2b");
    ch.legMat.color.set(it.accent || "#5e3d1e");
    ch.bodyMat.roughness = it.shine ? 0.18 : 0.72;
    ch.bodyMat.metalness = it.shine ? 0.5 : 0.0;
    if (ch.bodyMat.emissive) {
      if (it.glow) { ch.bodyMat.emissive.set(it.color || "#25e0c0"); ch.bodyMat.emissiveIntensity = 0.6; }
      else { ch.bodyMat.emissive.set(0x000000); ch.bodyMat.emissiveIntensity = 1; }
    }
    ch.bodyMat.needsUpdate = true;
  }

  /* every chair gets a skin: occupants show theirs, free chairs fall back */
  function syncChairSkins(v) {
    const roster = {};
    (v.players || []).forEach((p) => { roster[p.id] = p; });
    v.stations.forEach((st) => {
      (st.seats || []).forEach((s, i) => {
        let cos = null;
        if (s) cos = (s.id === App.pid) ? (v.you && v.you.cosmetics) : ((roster[s.id] || {}).cosmetics || null);
        applyChairSkin(st.id, i, cos);
      });
    });
  }

  function syncTableVisuals() {
    const v = App.view;
    if (!v) return;
    for (const t of tables) {
      const st = v.stations[t.id - 1];
      if (!st) continue;

      const cardKey = st.card ? st.card.id + ":" + st.round : "";
      if (cardKey !== t.lastCard) {
        t.lastCard = cardKey;
        if (t.front.map) t.front.map.dispose();
        t.front.map = cardTexture(st.card);
        t.front.emissiveMap = t.front.map;
        t.front.needsUpdate = true;
        t.card.visible = true;
        t.card.scale.setScalar(st.card ? 1 : 0.6);
      }

      let l1 = "STATION " + t.id, l2 = "", l3 = "";
      if (st.state === "ACTIVE" && st.card) {
        l2 = st.card.name;
        l3 = (st.currentBid > 0 ? st.currentBid + " coins" : "no bids") + (st.highestName ? " · " + st.highestName : "");
      } else if (st.state === "FINISHED" && st.result) {
        l2 = st.result.winner ? st.result.winner + " wins!" : "No winner";
        l3 = st.result.text || "";
      } else if (st.state === "STARTING") {
        l2 = "Starting...";
      } else if (st.state === "WAITING") {
        l2 = "Waiting for a player";
      } else if (st.state === "EMPTY") {
        l2 = "Free table";
      } else {
        l2 = st.state;
      }
      const key = l1 + "|" + l2 + "|" + l3;
      if (key !== t.lastBoard) {
        t.lastBoard = key;
        if (t.boardTex) t.boardTex.dispose();
        t.boardTex = boardTexture([l1, l2, l3]);
        t.board.material.map = t.boardTex;
        t.board.material.needsUpdate = true;
      }
    }
  }

  function syncCharacters() {
    const v = App.view;
    if (!v) return;
    const seen = new Set();
    const seatedAt = new Map();

    v.stations.forEach((st) => {
      st.seats.forEach((s, i) => { if (s) seatedAt.set(s.id, { station: st.id, index: i, seat: s }); });
    });

    const roster = {};
    (v.players || []).forEach((p) => { roster[p.id] = p; });

    syncChairSkins(v);

    seatedAt.forEach((info, pid) => {
      if (pid === App.pid) return;                  // me is handled by the world itself
      const meta = roster[pid] || {};
      const col = meta.color || (info.seat.isBot ? BOT_COLOR : "#4aa8ff");
      const ch = ensureChar(pid, meta.name || info.seat.name, col, !!info.seat.isBot, meta.cosmetics);
      const chair = chairOf(info.station, info.index);
      if (!chair) return;
      seen.add(pid);
      setTag(ch.tag, meta.name || info.seat.name, meta.wins || 0, info.seat.isBot ? BOT_COLOR : col);
      ch.root.position.x = chair.x;
      ch.root.position.z = chair.z;
      ch.root.rotation.y = chair.ry;
      if (!ch.sitting) poseSit(ch);
    });

    (v.players || []).forEach((p) => {
      if (p.id === App.pid || seen.has(p.id)) return;
      if (String(p.id).indexOf("bot-") === 0) return;   // bots only exist when seated
      const ch = ensureChar(p.id, p.name, p.color || "#4aa8ff", false, p.cosmetics);
      seen.add(p.id);
      setTag(ch.tag, p.name, p.wins || 0, p.color || "#4aa8ff");
      if (ch.sitting) poseStand(ch);
      if (p.pos) {
        ch.root.position.x += (p.pos.x - ch.root.position.x) * 0.25;
        ch.root.position.z += (p.pos.z - ch.root.position.z) * 0.25;
        if (typeof p.pos.ry === "number") ch.root.rotation.y = p.pos.ry;
        const moving = Math.hypot(p.pos.x - ch.root.position.x, p.pos.z - ch.root.position.z) > 0.05;
        ch.walk = (ch.walk || 0) + (moving ? 0.35 : 0);
        poseWalk(ch, ch.walk, moving ? 1 : 0);
      }
    });

    others.forEach((ch, pid) => {
      if (seen.has(pid)) return;
      scene.remove(ch.root);
      others.delete(pid);
    });
  }

  function ensureChar(pid, name, color, isBot, cosmetics) {
    let ch = others.get(pid);
    if (!ch) {
      ch = makeCharacter(color, name, isBot, cosmetics);
      const spawn = spawnFor(pid);
      ch.root.position.set(spawn.x, 0, spawn.z);
      others.set(pid, ch);
    } else if (ch.cosKey !== lookKey(cosmetics)) {
      ch = rebuildChar(ch, cosmetics, name, color, isBot);
      others.set(pid, ch);
      if (ch.sitting) poseSit(ch);
    }
    return ch;
  }

  function spawnFor(pid) {
    let h = 0;
    for (let i = 0; i < pid.length; i++) h = (h * 31 + pid.charCodeAt(i)) % 997;
    return { x: ((h % 7) - 3) * 1.8, z: 30 + ((h >> 3) % 4) * 1.6 };
  }

  function sendPos() {
    if (App.mode !== "online" || !App.room || !me) return;
    const now = Date.now();
    if (now - lastPosSent < 170) return;
    const x = +me.root.position.x.toFixed(2);
    const z = +me.root.position.z.toFixed(2);
    const ry = +me.root.rotation.y.toFixed(2);
    if (x === lastSent.x && z === lastSent.z && ry === lastSent.ry) return;
    lastSent = { x: x, z: z, ry: ry };
    lastPosSent = now;
    const url = B.serverUrl ? B.serverUrl("/api/pos") : "/api/pos";
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid: App.pid, room: App.room, x: x, z: z, ry: ry })
    }).catch(() => {});
  }
  let lastSent = { x: 0, z: 0, ry: 0 };

  /* ---------------- loop ---------------- */
  function update(dt, now) {
    animTime += dt;
    updatePlayer(dt);
    updateCamera(dt);

    for (const t of tables) {
      t.card.rotation.y += dt * 0.9;
      t.card.rotation.z = 0.06;
      t.card.position.y = 2.35 + Math.sin(now / 700 + t.id) * 0.08;
      const dx = camera.position.x - t.board.position.x;
      const dz = camera.position.z - t.board.position.z;
      t.board.rotation.y = Math.atan2(dx, dz);
    }

    syncTableVisuals();
    syncCharacters();
    updateShop(dt, now);

    if (waterMesh && waterMesh.material.map) {
      const off = waterMesh.material.map.offset;
      off.x = (off.x + dt * 0.006) % 1;
      off.y = (off.y + dt * 0.0022) % 1;
    }

    if (now - lastHud > 110) { lastHud = now; syncHud(); }
  }

  function frame(ts) {
    rafId = requestAnimationFrame(frame);
    frameCount += 1;
    const now = ts || performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt, now);
    renderer.render(scene, camera);
  }

  /* ---------------- start / stop ---------------- */
  function retryStart() {
    startPending = null;
    if (startAborted || running) return;
    if (App.view) { start(); return; }
    if (++startTries < 40) startPending = setTimeout(retryStart, 300);
    else B.toast("Enter Offline or Online mode first.", "bad");
  }
  function start() {
    startAborted = false; startTries = 0;
    if (running) return;
    if (!App.view) {                       // the room view may still be on its way
      if (startPending == null) startPending = setTimeout(retryStart, 300);
      return;
    }
    B.closeStation();
    try { ensureRenderer(); } catch (e) { B.toast("3D is not available on this device.", "bad"); return; }
    if (!built) buildWorld();

    const host = el("world3d");
    host.hidden = false;
    resize();

    // my character
    const meInfo = (App.view.players || []).find((p) => p.id === App.pid) || {};
    const meColor = meInfo.color || App.color || "#4aa8ff";
    const meName = meInfo.name || App.name || "You";
    const meCos = (App.view && App.view.you && App.view.you.cosmetics) ||
      (B.cosmetics ? B.cosmetics() : null);
    if (me) { scene.remove(me.root); disposeGroup(me.root); }
    me = makeCharacter(meColor, meName, false, meCos);
    setTag(me.tag, meName, meInfo.wins || 0, meColor);
    me.root.position.set(0, 0, 26);
    camYaw = Math.PI;
    camHeight = 4.8;
    camDist = 10;
    camFocusY = 1.5;
    camera.position.set(0, camHeight + 1.5, 26 + camDist);
    camera.lookAt(0, 1.5, 26);

    others.forEach((ch) => scene.remove(ch.root));
    others.clear();
    seated = null; sitTween = null;
    setHud(false);

    document.body.classList.add("w3on");
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
    syncHud();
    B.Sfx && B.Sfx.click && B.Sfx.click();
  }

  function stop() {
    startAborted = true;                      // cancel any pending auto-entry
    if (startPending != null) { clearTimeout(startPending); startPending = null; }
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    el("world3d").hidden = true;
    document.body.classList.remove("w3on");
    if (stick.x || stick.y) { stick.x = 0; stick.y = 0; el("w3Knob").style.transform = "translate(0,0)"; }
    jumpQueued = false; vy = 0; onGround = true;
    if (me) { me.root.position.y = 0; }
  }

  /* ---------------- wiring ---------------- */
  const touchMode = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  function boot() {
    const enter = el("btnWorld3d");
    if (enter) enter.addEventListener("click", start);
    const exit = el("w3Exit");
    if (exit) exit.addEventListener("click", stop);

    const row = el("w3Row");
    if (row) {
      row.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".bidbtn[data-tier]") : null;
        if (!btn || btn.disabled || seated == null) return;
        const st = B.station(seated);
        if (!st) return;
        const amount = B.bidTiers(st, B.minBidFor(seated))[Number(btn.dataset.tier)];
        if (!Number.isFinite(amount)) return;
        B.act("bid", { station: seated, amount: amount });
      });
    }
    const pass = el("w3Pass");
    if (pass) pass.addEventListener("click", openPass);

    // exact bid: typed, checked against the real minimum and our real coins
    const cGo = el("w3CustomGo"), cAmt = el("w3CustomAmt");
    if (cGo && cAmt) {
      const submit = () => {
        if (seated == null) return;
        const st = B.station(seated);
        if (!st) return;
        const min = B.minBidFor(seated);
        const coins = (App.view && App.view.you && App.view.you.coins) || 0;
        const raw = cAmt.value;
        let n = Math.floor(Number(raw));
        if (raw === "" || !Number.isFinite(n)) n = min;
        if (n < min) { n = min; B.toast("The minimum bid is " + B.fmtCoins(min) + ".", "bad"); }
        if (n > coins) { B.toast("You only have " + B.fmtCoins(coins) + " coins.", "bad"); cAmt.value = ""; return; }
        cAmt.value = "";
        B.act("bid", { station: seated, amount: n });
      };
      cGo.addEventListener("click", submit);
      cAmt.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); submit(); return; }
        if (e.key !== "Escape") e.stopPropagation();
      });
      cAmt.addEventListener("pointerdown", (e) => e.stopPropagation());
    }

    const yes = el("w3PassYes"), no = el("w3PassNo");
    if (yes) yes.addEventListener("click", () => {
      el("w3PassBox").hidden = true;
      if (seated != null) B.act("pass", { station: seated });
    });
    if (no) no.addEventListener("click", () => { el("w3PassBox").hidden = true; });

    const stand = el("w3Stand");
    if (stand) stand.addEventListener("click", standUp);

    const rAgain = el("w3RAgain"), rClose = el("w3RClose");
    const closeResult = () => { hideResult(); };
    if (rAgain) rAgain.addEventListener("click", closeResult);
    if (rClose) rClose.addEventListener("click", closeResult);

    const act = el("w3Action");
    if (act) act.addEventListener("click", () => { if (nearShop) openWorldShop(); else toggleSit(); });

    const jmp = el("w3Jump");
    if (jmp) {
      jmp.addEventListener("pointerdown", (e) => { e.preventDefault(); jump(); });
      jmp.addEventListener("click", (e) => { e.preventDefault(); jump(); });
    }

    bindPointer();
    if (touchMode) {
      el("w3Stick").classList.add("on");
      if (jmp) { jmp.hidden = false; jmp.classList.add("on"); }
      el("w3Hint").textContent = "Stick to move · drag to look · Jump button to hop";
    }
  }

  window.World3D = {
    start: start,
    stop: stop,
    jump: jump,
    active: () => running,
    /* dev: render one frame from a camera angle and return it as a data URL */
    shot: (yaw, dist, height) => {
      if (!renderer || !camera || !me) return null;
      if (typeof yaw === "number") camYaw = yaw;
      if (typeof dist === "number") camDist = dist;
      if (typeof height === "number") camHeight = height;
      const fy = seated != null ? 1.35 : 1.5;
      camera.position.set(
        me.root.position.x + Math.sin(camYaw) * camDist,
        fy + camHeight,
        me.root.position.z + Math.cos(camYaw) * camDist
      );
      camera.lookAt(me.root.position.x, fy, me.root.position.z);
      renderer.render(scene, camera);
      try { return document.getElementById("w3canvas").toDataURL("image/jpeg", 0.85); } catch (e) { return String(e); }
    },
    /* free camera: place the eye anywhere and look at any point (visual tests) */
    signRot: (y) => { if (kioskSign && typeof y === "number") kioskSign.rotation.y = y; return kioskSign ? kioskSign.rotation.y : null; },
    shotAt: (px, py, pz, tx, ty, tz) => {
      if (!renderer || !camera) return null;
      camera.position.set(px, py, pz);
      camera.lookAt(tx, ty, tz);
      renderer.render(scene, camera);
      try { return document.getElementById("w3canvas").toDataURL("image/jpeg", 0.85); } catch (e) { return String(e); }
    },
    /* re-read the equipped outfit and rebuild the local character */
    refreshOutfit: () => {
      if (!running || !scene || !me) return false;
      const v = App.view;
      const cos = (v && v.you && v.you.cosmetics) || (B.cosmetics ? B.cosmetics() : null);
      const info = (v && (v.players || []).find((p) => p.id === App.pid)) || {};
      const color = info.color || App.color || "#4aa8ff";
      const name = info.name || App.name || "You";
      const wasSitting = me.sitting;
      const next = rebuildChar(me, cos, name, color, false);
      if (next && next !== me) {
        me = next;
        if (wasSitting) poseSit(me); else poseStand(me);
        setTag(me.tag, name, info.wins || 0, color);
        return true;
      }
      return false;
    },
    // celebration emote (also fired automatically when you win an auction)
    cheer: (secs) => { if (me) me.cheer = secs == null ? 1.9 : secs; return me ? me.cheer : 0; },
    // test helpers
    pos: () => (me ? { x: +me.root.position.x.toFixed(2), y: +me.root.position.y.toFixed(2), z: +me.root.position.z.toFixed(2) } : null),
    seat: () => seated,
    // manual loop for tests / background tabs (no requestAnimationFrame there)
    step: (n, dtms) => {
      if (!running || !renderer) return frameCount;
      const dt = (dtms || 16.7) / 1000;
      for (let i = 0; i < (n || 1); i++) {
        frameCount += 1;
        lastHud = 0;
        lastTime = performance.now();
        update(dt, lastTime);
      }
      renderer.render(scene, camera);
      return frameCount;
    },
    dbg: () => ({
      running: running, frames: frameCount, seated: seated, tween: !!sitTween,
      keys: Object.keys(keys).filter(function (k) { return keys[k]; }),
      yaw: +camYaw.toFixed(2), built: built, tables: tables.length,
      others: others.size,
      othersPos: Array.from(others.entries()).map(function (e) {
        return { id: String(e[0]).slice(0, 8), x: +e[1].root.position.x.toFixed(1), z: +e[1].root.position.z.toFixed(1), sit: e[1].sitting };
      }),
      chairs0: tables[0] ? tables[0].chairs.length : -1,
      pos: (me ? [+me.root.position.x.toFixed(2), +me.root.position.y.toFixed(2), +me.root.position.z.toFixed(2)] : null),
      cam: (camera ? [+camera.position.x.toFixed(2), +camera.position.y.toFixed(2), +camera.position.z.toFixed(2)] : null),
      focusY: +camFocusY.toFixed(2),
      cheer: me ? +(me.cheer || 0).toFixed(2) : null,
      near: nearStop ? nearStop.label : (nearShop ? "shop" : null),
      stops: shopStops.length,
      sky: (scene && scene.background && scene.background.getHexString) ? scene.background.getHexString() : null,
      fog: (scene && scene.fog) ? [scene.fog.near, scene.fog.far, scene.fog.color.getHexString()] : null,
      water: !!waterMesh,
      bound: typeof BOUND_R === "undefined" ? null : BOUND_R,
      tags: (me && me.tag ? me.tag.userData.key : null),
      otherTags: Array.from(others.values()).map(function (c) { return c.tag ? c.tag.userData.key : null; }),
      sceneKids: (scene ? scene.children.length : -1),
      sign: kioskSign ? [kioskSign.rotation.y, kioskSign.position.z, kioskSign.parent ? kioskSign.parent.position.z : null] : null,
      signCount: (function () {
        let n = 0, rots = [];
        if (!scene) return [0, []];
        scene.traverse(function (o) {
          if (!o.isMesh || !o.material) return;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          const hit = mats.some(function (m) {
            return m && m.map && m.map.image && m.map.image.width === 640 && m.map.image.height === 200;
          });
          if (hit) { n++; rots.push(+o.rotation.y.toFixed(2)); }
        });
        return [n, rots];
      })(),
      sprites: (function () {
        const out = [];
        if (!scene) return out;
        scene.traverse(function (o) {
          if (!o.isSprite) return;
          const w = o.getWorldPosition(new THREE.Vector3());
          out.push([o.userData.key || "?", +w.x.toFixed(1), +w.y.toFixed(1), +w.z.toFixed(1)]);
        });
        return out;
      })()
    }),
    tp: (x, z) => { if (me) { me.root.position.x = x; me.root.position.z = z; } },
    /* what is drawn at this screen point? (debug: click-to-identify) */
    pick: (px, py) => {
      if (!camera || !scene) return null;
      const cv = el("w3canvas");
      const r = cv.getBoundingClientRect();
      const v = new THREE.Vector2(
        ((px - r.left) / r.width) * 2 - 1,
        -((py - r.top) / r.height) * 2 + 1
      );
      const rc = new THREE.Raycaster();
      rc.setFromCamera(v, camera);
      return rc.intersectObjects(scene.children, true).slice(0, 5).map((h) => ({
        type: h.object.type,
        geo: h.object.geometry ? h.object.geometry.type : "",
        dist: +h.distance.toFixed(1),
        at: [+h.point.x.toFixed(1), +h.point.y.toFixed(1), +h.point.z.toFixed(1)],
        map: !!(h.object.material && h.object.material.map),
        key: h.object.userData && h.object.userData.key ? String(h.object.userData.key).slice(0, 24) : ""
      }));
    },
    cam: (yaw, dist, height) => {
      if (typeof yaw === "number") camYaw = yaw;
      if (typeof dist === "number") camDist = dist;
      if (typeof height === "number") camHeight = height;
      if (camera && me) updateCamera(1);
      if (renderer && camera) renderer.render(scene, camera);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
