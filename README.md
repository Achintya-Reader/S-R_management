# Sales and Rent Management — Cloudflare Pages + Pages Functions + Firebase Firestore (Free)

Converted from `Project/` PHP+MySQL (`includes/config.php:6`, `sms3.sql`) to static + serverless. Added **Rentals** module.

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
- Easiest (no Node): in Firebase Console > Firestore > Start collection `products`, `customers`, `suppliers`, `purchase_orders`, `sell_orders`, `sales`, `rentals` and add docs manually (see `../Project/sms3.sql:44-252` for sample; rentals: see `rentals.html` schema).
- Or run `npm i` then `npm run migrate` (parses `sms3.sql` INSERTs, needs `serviceAccountKey.json`). If parser stub, manually add 2-3 docs via console.
- Rentals: collection `rentals` {customer_id, product_id, quantity, rent_price, days, total, deposit, rent_date, due_date, status: rented/returned/overdue/cancelled}

### 4) Deploy to Cloudflare Pages (Free)
```bash
npm i -g wrangler firebase-tools
wrangler login
wrangler pages publish ./ --project-name=s-r-management --branch=main
# then in Cloudflare Dashboard > Pages > s-r-management > Settings > Variables:
# FIREBASE_PROJECT_ID = your projectId
# (optional) FIREBASE_SERVICE_ACCOUNT = content of serviceAccountKey.json (stringified)
```
Or connect GitHub: Dashboard > Create application > Pages > Connect to Git > `Achintya-Reader/S-R_management` > Build settings: Framework preset None, Build command `npm run build`, Output directory `.`

Pages Function `/api/*` in `functions/api/*.js` currently return `{useClient:true}` — meaning frontend does direct Firestore via JS SDK (free, no server cost). To enforce server TXs, fill `FIREBASE_SERVICE_ACCOUNT` and extend `functions/api/*.js` with REST.

### 5) Deploy Rules
```bash
firebase login
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Test: open `https://s-r-management.pages.dev/login.html` > sign in > `index.html` counts should show (now includes rentals).

## Structure
```
Deploy/
  index.html (dashboard + rentals stats)
  login.html (firebase/auth, replaces Project/login.php:20)
  customers.html -> Firestore `customers` (dup check customer_code)
  suppliers.html -> `suppliers`
  products.html -> `products` (sku+category unique)
  rentals.html -> Firestore `rentals` {customer, product, qty, rent_price/day, days, total, deposit, rent_date, due_date, status} + stock TX
  sales.html -> `sales` + stock TX `products.stock` (Project/sales.php:37)
  purchase_orders.html -> `purchase_orders` + stock on Complete (Project/purchase_orders.php:51)
  sell_orders.html -> `sell_orders`
  reports.html -> aggregations (daily/weekly/monthly, pdf via jspdf) + rentals revenue
  js/firebase.js -> init, requireAuth, getIdToken
  functions/api/*.js -> Pages Functions (scaffold, uses client SDK fallback) includes rentals.js
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
