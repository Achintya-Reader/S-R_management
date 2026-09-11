# SMS3 — Cloudflare Pages + Pages Functions + Firebase Firestore (Free)

Converted from `Project/` PHP+MySQL (`includes/config.php:6`, `sms3.sql`) to static + serverless.

## Stack Chosen (your choices)
- **A) Cloudflare Pages + Pages Functions** — single `pages.dev` deploy
- **Firebase Auth** (Email/Password) instead of PHP sessions `includes/auth.php:4`
- **Simple search** — client filter (no LIKE, no Algolia), mirrors `includes/search.php:10`
- **Easy UI** — kept Bootstrap 5.1.3 `includes/header.php:16` + DataTables + `assets/css/style.css`

## Free Quotas
- Firestore Spark: 1GiB, 50k reads/day, 20k writes/day
- Pages: unlimited bandwidth, Functions 100k req/day

## Quick Deploy (10 min)

### 1) Firebase
1. Create project at console.firebase.google.com
2. Auth > Sign-in method > Email/Password > Enable > Add user `admin@sms3.com` / `admin123` (or your choice)
3. Firestore Database > Create > Native mode > us-central > Start in test mode (then deploy `firestore.rules`)
4. Project Settings > General > Your apps > Web > copy config into `firebase-config.js`
5. Service Accounts > Generate new private key > save as `serviceAccountKey.json` in `Deploy/`

### 2) Configure
Edit `firebase-config.js`:
```js
export const firebaseConfig = { apiKey:"...", authDomain:"...", projectId:"...", ... }
```

### 3) Migrate Data (optional but recommended)
- Easiest (no Node): in Firebase Console > Firestore > Start collection `products`, `customers`, `suppliers`, `purchase_orders`, `sell_orders`, `sales` and add docs manually (see `../Project/sms3.sql:44-252` for sample).
- Or run `npm i` then `npm run migrate` (parses `sms3.sql` INSERTs, needs `serviceAccountKey.json`). If parser stub, manually add 2-3 docs via console.

### 4) Deploy to Cloudflare Pages (Free)
```bash
npm i -g wrangler firebase-tools
wrangler login
wrangler pages publish ./ --project-name=sms3 --branch=main
# then in Cloudflare Dashboard > Pages > sms3 > Settings > Variables:
# FIREBASE_PROJECT_ID = your projectId
# (optional) FIREBASE_SERVICE_ACCOUNT = content of serviceAccountKey.json (stringified)
```
Or connect GitHub: Dashboard > Create application > Pages > Connect to Git > select this `Deploy/` folder > Build settings: Framework preset None, Build command empty, Output directory `.`

Pages Function `/api/*` in `functions/api/*.js` currently return `{useClient:true}` — meaning frontend does direct Firestore via JS SDK (free, no server cost). To enforce server TXs, fill `FIREBASE_SERVICE_ACCOUNT` and extend `functions/api/*.js` with REST.

### 5) Deploy Rules
```bash
firebase login
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Test: open `https://sms3.pages.dev/login.html` > sign in > `index.html` counts should show.

## Structure
```
Deploy/
  index.html (dashboard counts Project/index.php:8)
  login.html (firebase/auth, replaces Project/login.php:20)
  customers.html -> Firestore `customers` (dup check customer_code)
  suppliers.html -> `suppliers`
  products.html -> `products` (sku+category unique)
  sales.html -> `sales` + stock TX `products.stock` (Project/sales.php:37)
  purchase_orders.html -> `purchase_orders` + stock on Complete (Project/purchase_orders.php:51)
  sell_orders.html -> `sell_orders`
  reports.html -> aggregations (daily/weekly/monthly, pdf via jspdf)
  js/firebase.js -> init, requireAuth, getIdToken
  functions/api/*.js -> Pages Functions (scaffold, uses client SDK fallback)
  firestore.rules, firestore.indexes.json
```

## How PHP Was Mapped
- `mysqli $conn->query("SELECT *")` -> `getDocs(collection(db,'...'))`
- `session is_logged_in()` -> `onAuthStateChanged` `js/firebase.js:requireAuth`
- `password_verify` -> `signInWithEmailAndPassword`
- `stock +/- transaction` -> `getDoc + updateDoc` with check (for production use `runTransaction`)
- `Fpdf` -> `jspdf` client `reports.html: downloadPdf`
- `search LIKE '%x%'` -> `hay.includes(term)` client filter

## Pages Functions Note
Current Functions are thin proxies to allow future server-side verification without breaking free quota. Frontend already handles auth header:
```js
fetch('/api/products',{headers:{Authorization:`Bearer ${await getIdToken()}`}})
```
If you don't set env vars, they return `useClient:true` and frontend auto-falls back to direct SDK — keeps free tier zero-cost.

## Troubleshooting
- `-` counts: check `firebase-config.js` projectId and `firestore.rules` allows `request.auth != null`, and user is logged in.
- `Failed to get document`: enable Firestore API.
- Stock not updating: check Firestore rules allow write, and user is Auth'd.

## Original PHP
Kept untouched in `../Project/` for reference. Deploy folder is Pages-ready static.
