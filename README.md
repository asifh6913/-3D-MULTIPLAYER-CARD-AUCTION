# Card Auction

Nine auction tables. Two seats per table. One card on the table — bid, bluff, pass.

* **Offline mode** — you vs a practice bot (Chill / Sharp / Ruthless).
* **Online mode** — real people, room codes, live bidding.
* Collection, history, leaderboard, profile, settings.

---

## 1. Run it (single PC)

```
start-game.bat
```

Double-click it. It starts the server and opens the game in your browser.
Keep the black window open while you play; close it to stop the server.

Manual way (same thing):

```
node server.js
```

then open <http://localhost:8787/CardAuction.html>.

> You need [Node.js](https://nodejs.org) installed (LTS version). Nothing else —
> the server has **zero dependencies**, no `npm install`.

---

## 2. Play with friends

### A. Two players, one PC
Open a second browser tab and join the same room code. That is enough for testing.

### B. Friends on the same WiFi / LAN (best for a classroom, café, house party)
1. Start the server with `start-game.bat`.
2. The console prints your LAN address, e.g. `http://192.168.0.113:8787`.
3. Your friends open that address in **their own** browser (phone or laptop).
4. You **Create server**, they **Join server** with the 5-character code.

That is real online multiplayer — every player's screen updates live.

### C. Friends anywhere on the internet
The LAN address only works on your own network, so pick one:

| Method | Cost | Difficulty |
|---|---|---|
| **Cloudflare Tunnel** (`cloudflared`) | Free | Easy |
| **ngrok** (`ngrok http 8787`) | Free tier | Easy |
| Port forwarding on your router | Free | Medium |
| A cheap VPS (Hetzner, DigitalOcean…) | ~$4/mo | Medium |
| Render / Railway / Fly.io | Free tier* | Easy |

Easiest two:

**ngrok**
```
ngrok http 8787
```
It prints a public `https://....ngrok-free.app` URL — your friends open that.

**cloudflared**
```
cloudflared tunnel --url http://localhost:8787
```
It prints a public `https://....trycloudflare.com` URL.

Then everything else is unchanged: create a room, share the code.

\* On free hosts the disk is usually wiped on redeploy, so `cardauction-data.json`
(profiles + leaderboard) is lost. Use a VPS, or attach a persistent disk, if you
care about saved progress.

---

## 3. Files

| File | What it does |
|---|---|
| `CardAuction.html` | The whole game client (UI, screens, offline mode) |
| `engine.js` | The auction rules — used by the browser **and** by the server |
| `game3d.js` | The walk-around 3D world (Three.js) |
| `three.min.js` | Three.js r147 — local copy, no internet needed |
| `server.js` | Static files + rooms + live updates (SSE) + REST actions |
| `cardauction-data.json` | Saved profiles + leaderboard (created automatically) |
| `start-game.bat` | One-click launcher for Windows |

Because `engine.js` is shared, offline and online games behave exactly the same.

---

## 4. The 3D world

The menu's big green **Enter 3D World** button drops you straight in —
Offline or Online, both play in the same world.

| Input | Action |
|---|---|
| `W A S D` / arrow keys | Walk |
| `Space` | Jump |
| Mouse drag | Orbit the camera |
| Mouse wheel | Zoom |
| `E` | Sit on the highlighted chair (or stand up) |
| `B` | Place the cheapest available bid |
| `P` | Open the PASS confirmation |
| `Esc` | Back to the lobby |
| Touch | Left stick to move, drag to look, **Sit** button + **Jump** button |

* **Day time only** — bright sky, no night.
* **A grass island surrounded by water.** The player is clamped to the island
  (`BOUND_R = 46.5`), so you can walk to the beach but never into the sea.
* **Wins over your head** — every name tag shows `★ n wins`, taken from the
  server's `stats.won` (offline and online, humans and bots).
* Nine tables on a **stone plaza**, two chairs opposite each other — walk up to a
  free chair and the match starts on its own (bot joins, or your friend does).
* **Island scenery** — trees, rocks, flowers, drifting clouds and a sandy beach
  all the way round; the sea never lets you past the boundary.
* **Shop kiosk** — a purple-roofed SHOP building behind the spawn with a bobbing
  gold coin on top. Walk close and the hint changes to *Press E to open the
  Shop*; press `E` to open it without leaving the world.
* A rotating card floats over every table and a board above it shows the
  station, the card and the current high bid. The card itself is big enough to
  read: full card art, name, rarity and **income per second**.
* **Chair skins** — the chair you sit on takes the skin you have equipped
  (gold throne, neon, diamond…), while empty chairs stay on the default wood.
* Everyone in an online room appears as a walking character: your position is
  sent to the server about 6× per second (`/api/pos`) and replayed for the
  other players, so you can see them walk to a table too.
* The auction itself is unchanged — same rules, same server authority.

Console helpers: `World3D.start() / stop() / jump() / pos() / seat() / tp(x,z) /
cam(yaw,dist,height) / shot(yaw,dist,height) / dbg() / step(frames, ms)` —
`step()` drives the loop by hand for tests (background tabs do not run
`requestAnimationFrame`), `shot()` renders one frame and returns a JPEG data URL.

### The Shop

Same panel in the lobby (**Profile → Shop**), in the top bar and inside the 3D
world — one catalogue lives in `engine.js → SHOP`, so the preview you see in the
shop is the same art the 3D model uses.

| Tab | What is in it |
|---|---|
| **Characters** | 10 playable characters (Rookie → Titan, 0 → 52k) with their own skin, hair and build. |
| **Clothes** | Shirts, pants, shoes and hats — four separate sub-tabs so you can mix and match. |
| **Chair skins** | Wood, Red Velvet, Gold Throne, Neon Glow, Diamond. Applied to your chair while you sit. |
| **Luck** | Luck 1–5, bought in order. Highest owned level is always active. |
| **Sell cards** | Cards back into coins: COMMON 60, UNCOMMON 160, RARE 450, EPIC 1300, LEGENDARY 4200, MYTHIC 15000. |

* **Buying wears it.** The moment a purchase succeeds it is equipped; the button
  turns into `Equipped`. `Equip` is for switching back to things you own.
* **Luck changes the odds for real** (verified with 4000 rolls per level):
  COMMON falls from ~67% to ~29% while MYTHIC climbs from ~0.65% to ~1.9%.
* **Server rules**: the price is read from the catalogue (never from the
  client), duplicates are refused, older luck levels cannot be re-bought, a card
  can be sold once, and every response is rate-limited like the auction actions.
* Cosmetics live in `profile.cosmetics` and are sanitised on load, so a hand
  edited save can only fall back to defaults — never to an item you do not own.

---

## 5. A free server on the internet (no API key, no paid plan)

You do **not** need to buy anything, and there is **no API id or secret** to
paste anywhere. The only "server id" this game ever uses is a plain **URL**.

### Option A — your own PC + a free tunnel (fastest, zero signup)
1. Keep `start-game.bat` running.
2. In a second terminal run one of these:

   ```
   cloudflared tunnel --url http://localhost:8787
   ```
   *(no account needed — prints a `https://....trycloudflare.com` URL)*

   ```
   ngrok http 8787
   ```
   *(free account: sign up with Google/GitHub, copy the token once, then it
   prints a `https://....ngrok-free.app` URL)*
3. That URL **is** your server address. Friends open it, create a room, share
   the 5-character code.

Your PC must stay on and connected while friends play.

### Option B — a permanently free hosted server (your PC can be off)
**Render.com** (recommended, free tier, no credit card):

1. Make a free **GitHub** account → create a repository → upload these files:
   `CardAuction.html`, `engine.js`, `game3d.js`, `three.min.js`, `server.js`.
2. Go to <https://render.com> → **New → Web Service** → connect GitHub.
3. Settings:
   * Environment: **Node**
   * Build command: *(leave empty)*
   * Start command: `node server.js`
4. Deploy. You get something like `https://cardauction.onrender.com`.
   Put that URL into the game (next section) and share it with friends.

Free-tier notes: the service **sleeps** after ~15 minutes with no visitors —
opening the URL once wakes it up (takes ~30 s). The saved
`cardauction-data.json` is wiped on re-deploy.

Other free hosts that run this app unchanged: **Koyeb**, **Fly.io**,
**Railway** (trial), **Cyclic**, **Glitch** — the app has zero npm
dependencies, so the start command is always just `node server.js`.

### What friends need
Nothing. No account, no key. They open your URL (or your LAN address), type the
room code, done.

---

## 6. Setting the server address in the game

By default the client talks to **the same address the page was loaded from**,
which is correct when you open `http://localhost:8787` or your LAN address.

To point the client at a server somewhere else (hosted server, friend's tunnel,
or the Android APK), do **one** of these:

*Open `CardAuction.html` and add this line just before the main script:*
```html
<script>window.CA_SERVER = "https://cardauction.onrender.com";</script>
```

or set it once from the browser console / devtools:
```js
localStorage.CA_SERVER = "https://cardauction.onrender.com";
```
(empty string = same address as the page; delete the key to go back).

The server already sends `Access-Control-Allow-Origin: *`, so a page served
from anywhere (file://, another domain, the APK WebView) can call it.

---

## 7. Making an Android APK

Because the whole game is one HTML file, wrapping it is easy. Pick one:

| Way | What you install | Best for |
|---|---|---|
| **[Capacitor](https://capacitorjs.com)** | Node + Android Studio | Real Play Store-ready APK |
| **[PWABuilder](https://www.pwabuilder.com)** | Nothing (website) | Quick APK from a hosted URL |
| **[WebIntoApp](https://webintoapp.com)** / AppsGeyser | Nothing (website) | Fastest, no tooling at all |

**Capacitor (recommended):**
```
npm init -y
npm i @capacitor/core @capacitor/cli
npx cap init "Card Auction" com.yourname.cardauction --web-dir=www
# copy CardAuction.html, engine.js, game3d.js, three.min.js into www/
npx cap add android
npx cap sync
npx cap open android      # then Build > Build APK(s) in Android Studio
```
In the APK make sure `window.CA_SERVER` points at your **public** server URL —
a phone cannot reach `localhost` or your PC's `192.168.x.x` LAN address.

**PWABuilder / WebIntoApp:** host the game first (Option B above), paste the
URL on the site, download the APK. Set `CA_SERVER` before packaging.

---

## 8. How online play works

* **State** flows to players over **SSE** (`EventSource`) — `/api/stream`.
* **Actions** are `POST` calls — `/api/create`, `/join`, `/sit`, `/stand`,
  `/bid`, `/pass`, `/allowBots`, `/name`, `/leave`, `/pos` (3D position),
  `/buy`, `/equip`, `/sell` (the shop).
* The **server decides everything**: coins, bids, timer, winner, inventory.
  A modified client can only ask for an action; it cannot invent coins.
* If the connection drops, the player has a **15 second grace period** —
  reconnect and the seat, coins and cards are still there. After that the seat
  is freed for someone else and the profile is saved.
* Bots never take a seat while a real player in the room still wants one.

---

## 9. Good next features

* Season / weekly leaderboard with a reset timer.
* Trading between players (offer a card, accept, both confirm).
* Card fusion: three of a kind → one card of the next rarity.
* More tables (12–16) and a spectator mode.
* Chat and quick reactions at the table.
* Sound pack + music slider, custom table themes.
* Daily quests and a streak reward.
* Private rooms with a password, plus a "spectate final table" link.
