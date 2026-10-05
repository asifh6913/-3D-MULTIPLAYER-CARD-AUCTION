# Cloudflare par server live karna — poori tareeqe se

Ye guide aapko **always-online server** set up karne me madad karegi. Is ka matlab hai:

- aapka **PC band bhi ho jaye** tab bhi server chalta rahe ga
- aap **mobile** se bhi multiplayer khel sakte hain (same WiFi par bhi, aur kahin se bhi)
- koi bhi **free** hai (Cloudflare ka free plan chahiye, koi credit card nahi)

---

## 1. Kya banaya gaya hai (files)

| File | Kaam |
|---|---|
| `worker/index.mjs` | Poora online server (Cloudflare Worker + Durable Object) |
| `wrangler.toml` | Cloudflare ki setting (Worker, D1 database, Durable Object) |
| `migrations/0001_init.sql` | Database ka table (`profiles`) |
| `scripts/sync-assets.js` | Game ki files `public/` me copy karta hai |
| `public/` | Jo files Cloudflare par upload hongi |
| `test_worker.mjs` | Server ka test — bina internet ke chal jata hai |
| `package.json` | Neeche diye gaye commands |

**Zaroori baat:** `CardAuction.html` me **ek line bhi nahi badli**. Worker wahi `/api/...`
routes deta hai jo local `server.js` deta hai, aur wahi `engine.js` file use hota hai.
Is liye rules (bid, coins, timers, winner) local aur cloud dono par bilkul same hain.

---

## 2. Ek baar ki tayyari (sirf ek dafa)

### 2.1 Node.js check karein
```
node -v
```
Agar `v18` ya us se barra number aaye to theek hai.

### 2.2 Cloudflare ka free account
1. <https://dash.cloudflare.com> par jayein
2. Sign up / login (GitHub ya Google se bhi ho jata hai)
3. Koi credit card nahi chahiye free plan ke liye

### 2.3 Wrangler install (terminal me, isi project folder me)
```
npm install
```
Ye sirf ek hi cheez (`wrangler`) install karta hai — game ke code me koi nayi library nahi aati.

---

## 3. Database banayein (D1)

```
npx wrangler login
```
> Browser khule ga — Cloudflare ka account select kar lein. Uske baad terminal me wapas aa jaye.

Ab database banayein:
```
npx wrangler d1 create cardauction
```
Ye ek line print karega jis me **`database_id`** hota hai, jaise:

```
[[d1_databases]]
binding = "DB"
database_name = "cardauction"
database_id = "a1b2c3d4-0000-1111-2222-333344445555"
```

Us `database_id` ko copy karke `wrangler.toml` me paste kar dein:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cardauction"
database_id = "YAHAN_APNA_ID_PASTE_KAREIN"     <-- ye line badlein
```

Ab table bana dein:
```
npm run cf:db:init
```

> Ye sirf **ek baar** chalana hai. Har baar chalane se koi nuqsan nahi hota (table pehle se ho to
> `CREATE TABLE IF NOT EXISTS` skip kar deta hai).

---

## 4. Test karo (bina internet ke, apne PC par)

```
node test_worker.mjs
```
Aapko `30 passed, 0 failed` milna chahiye. Ye证明 karta hai ke server ke andar ke rules
(theek se kaam kar rahe hain) — bid ki kami par mana karna, wallet check, claim validation,
save, leaderboard — sab.

---

## 5. Live karein

```
npm run cf:deploy
```
(=`node scripts/sync-assets.js` + `npx wrangler deploy`)

30-60 second lagte hain. End me aapko ek **address** milega, jaise:

```
https://card-auction.your-name.workers.dev
```

**Yehi aapka permanent server address hai.** Usay kisi ko bhi bhej dein.

### Zaroori: custom domain (apna naam)
`workers.dev` address kaafi hai, lekin apna domain lagana behtar lagta hai:
1. <https://dash.cloudflare.com> → **Workers & Pages** → `card-auction` → **Settings** → **Domains & Routes**
2. **Add Custom Domain** → apna domain daalein (e.g. `play.yourdomain.com`)

---

## 6. Mobile se khelna

1. Phone me browser kholein (Chrome / Safari)
2. Apna address daalein: `https://card-auction.your-name.workers.dev`
3. **PLAY ONLINE** dabayein
4. **Create Room** dabayein → aapko ek **5 harf ka code** milega (jaise `K7P2M`)
5. Dusre phone/browser me wahi address kholein → **Join Room** → code daalein
6. Dono **ENTER 3D WORLD** dabayein, table par baith jayein, auction shuru

### Dono phone ek hi WiFi par ho to
Koi bhi kaam kare ga. Aap **LAN address** par bhi local server chala sakte hain:
`node server.js` → `http://192.168.x.x:8787`

---

## 7. Server har waqt on kaise rehta hai?

Ye Cloudflare ke server hain — aapka PC is mamle me **bilkul involved nahi** hai:

- Cloudflare ke data centers duniya bhar me chamakhte hain
- aapke PC ka band hona, net jaana, laptop ki battery khatam hona — koi farak nahi padta
- traffic barhne par koi hosting bill nahi aata (free plan: **100,000 requests / roz**)

Sirf **ek** cheez aapko khud karni hai: **code update** karna ho to `npm run cf:deploy`
dobara chalana. Aur data (coins, cards, wins) D1 me safe rehta hai.

---

## 8. Aam masale aur hal

| Masla | Hal |
|---|---|
| `no such table: profiles` | `npm run cf:db:init` chala dein |
| `[code: REPLACE-THIS...]` aaya | `wrangler.toml` me apna `database_id` paste karein |
| `Failed to find a worker for script` | `npm install` phir `npm run cf:deploy` |
| Room code kaam nahi kar raha | Dono players same URL par hon, aur `/api/ping` khol kar dekhein ke `{"ok":true}` aa raha hai |
| Page nahi khul raha | `npx wrangler tail` chala kar dekhein ke error kya hai |
| Game ka naya version chahiye | `npm run cf:deploy` — bas |

### Live logs dekhna
```
npx wrangler tail
```
Ye terminal me real-time me dikha de ga ke kya request aa rahi hai.

---

## 9. Local server bhi saath chal sakta hai

Ye do alag cheezein hain, dono ek saath chalti hain:

| | Local | Cloudflare |
|---|---|---|
| Command | `npm start` | `npm run cf:deploy` |
| Address | `http://localhost:8787` | `https://card-auction...workers.dev` |
| PC band? | Chalta nahi | **Chalta rehta hai** |
| Mobile se? | Sirf same WiFi | **Kahin se bhi** |
| Coins | Alag (offline practice) | Alag (online, asli players) |

Coins/cards dono me **alag** rehte hain — bilkul wahi rule jo aapne kaha tha.

---

## 10. Ek hi command me sab kuch

Baar baar type karne ke bajaye `start-game.bat` me `npm run cf:deploy` bhi add kar sakte hain.

---

## Files ka kya hoga agar main kuch badaloon?

- `CardAuction.html`, `engine.js`, `game3d.js` — game ki files (in me se kuch nahi badla)
- `worker/index.mjs` — sirf server ka wrapper; rules `engine.js` me hain
- `migrations/` — sirf database ka structure
- `public/` — **automatic** copy, isay haath se na edit karein (har deploy par dobara ban jata hai)

`public/` khud-ba-khud `npm run cf:deploy` par refresh hota hai, is liye agar aap
`CardAuction.html` me kuch badlein to bas deploy dobara chala dein.
