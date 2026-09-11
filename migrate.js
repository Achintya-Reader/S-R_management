// Simple sms3.sql -> Firestore migrator (works for A-8/ Project/sms3.sql small demo)
// Usage: 
// 1. Firebase Console > Project Settings > Service Accounts > Generate new private key -> save as serviceAccountKey.json in Deploy/
// 2. Edit projectId below, then: npm i; node migrate.js

import fs from 'fs';
import admin from 'firebase-admin';

const projectId = 'REPLACE_WITH_YOUR_PROJECT_ID'; // <-- edit or set FIREBASE_PROJECT_ID env
const sqlPath = '../Project/sms3.sql';
const saPath = './serviceAccountKey.json';

if(!fs.existsSync(saPath)){
  console.error('Missing serviceAccountKey.json');
  console.error('Get it: Firebase Console > Project Settings > Service Accounts > Generate new private key');
  process.exit(1);
}
if(projectId === 'REPLACE_WITH_YOUR_PROJECT_ID'){
  console.error('Edit projectId in migrate.js first');
  process.exit(1);
}
const sa = JSON.parse(fs.readFileSync(saPath,'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId });
const db = admin.firestore();

function parseInserts(sql, table){
  const re = new RegExp(`INSERT INTO \`${table}\`[^;]*?VALUES\\s*([\\s\\S]*?);`, 'm');
  const m = sql.match(re);
  if(!m) return [];
  let block = m[1].trim();
  // split rows on ),\n( but keep content
  // Remove leading ( and trailing )
  // Use placeholder split
  const rows = [];
  let cur='', depth=0, inStr=false, esc=false;
  for(let i=0;i<block.length;i++){
    const ch=block[i];
    if(ch==="'" && !esc) inStr=!inStr;
    if(ch==='(' && !inStr) depth++;
    if(ch===')' && !inStr) depth--;
    cur+=ch;
    if(depth===0 && !inStr && cur.trim().endsWith(')') ){
      // end of row? check next char is comma
      // peek ahead
      let j=i+1; while(j<block.length && /\s/.test(block[j])) j++;
      if(j>=block.length || block[j]===','){
        rows.push(cur.trim());
        cur=''; i=j; // skip comma
      }
    }
    esc = ch==='\\' && !esc;
    if(ch!=="\\") esc=false;
  }
  // parse each row tuple to fields array (naive split by ',')
  return rows.map(r=>{
    let s=r.trim(); if(s.startsWith('(')) s=s.slice(1); if(s.endsWith(')')) s=s.slice(0,-1); if(s.endsWith(',')) s=s.slice(0,-1);
    // split by ',' but not inside quotes
    const fields=[]; let f='', ins=false, es=false;
    for(let i=0;i<s.length;i++){
      const ch=s[i];
      if(ch==="'" && !es) ins=!ins;
      if(ch===',' && !ins){ fields.push(f.trim()); f=''; }
      else f+=ch;
      es = ch==='\\' && !es; if(ch!=="\\") es=false;
    }
    fields.push(f.trim());
    return fields.map(v=>{
      if(v==='NULL') return null;
      if(v.startsWith("'") && v.endsWith("'")) return v.slice(1,-1).replace(/\\'/g,"'").replace(/''/g,"'");
      if(!isNaN(v) && v!=='' && !v.includes('-') && !v.includes(':')) return Number(v);
      return v;
    });
  });
}

async function run(){
  const sql=fs.readFileSync(sqlPath,'utf8');
  console.log('Parsing', sqlPath);

  // Map SQL tables to Firestore collections + field names (from sms3.sql)
  // customers: id, customer_code, name, email, phone, address, created_at
  const customers = parseInserts(sql,'customers');
  for(const f of customers){
    const [id,customer_code,name,email,phone,address,created_at] = f;
    await db.collection('customers').doc(String(id)).set({customer_code,name,email,phone,address, createdAt: created_at? new Date(created_at): admin.firestore.FieldValue.serverTimestamp()});
    console.log('customers',id);
  }
  const suppliers = parseInserts(sql,'suppliers');
  for(const f of suppliers){
    const [user_code,id,name,designation,phone,email,address,created_at,category] = f;
    // note sms3.sql column order is weird: user_code first then id
    await db.collection('suppliers').doc(String(id)).set({user_code,name,designation,phone,email,address,category, createdAt: created_at? new Date(created_at): admin.firestore.FieldValue.serverTimestamp()});
    console.log('suppliers',id);
  }
  const products = parseInserts(sql,'products');
  for(const f of products){
    const [id,sku,name,category,description,price,stock,created_at]=f;
    await db.collection('products').doc(String(id)).set({sku,name,category,description,price:Number(price),stock:Number(stock), createdAt: created_at? new Date(created_at): admin.firestore.FieldValue.serverTimestamp()});
    console.log('products',id);
  }
  const purchase = parseInserts(sql,'purchase_orders');
  for(const f of purchase){
    const [id,supplier_id,product_id,quantity,price,total,order_date,created_at,status,product_name]=f;
    await db.collection('purchase_orders').doc(String(id)).set({supplier_id:String(supplier_id),product_id:String(product_id),quantity:Number(quantity),price:Number(price),total:Number(total),order_date: order_date && order_date!=='0000-00-00 00:00:00'? new Date(order_date): null, createdAt: created_at? new Date(created_at): admin.firestore.FieldValue.serverTimestamp(), status, product_name});
    console.log('purchase_orders',id);
  }
  const sales = parseInserts(sql,'sales');
  for(const f of sales){
    const [id,product_id,customer_id,qty,price_each,total,sale_date]=f;
    await db.collection('sales').doc(String(id)).set({product_id:String(product_id),customer_id:String(customer_id),qty:Number(qty),quantity:Number(qty),price_each:Number(price_each),price:Number(price_each),total:Number(total), sale_date: sale_date? new Date(sale_date): admin.firestore.FieldValue.serverTimestamp(), createdAt: sale_date? new Date(sale_date): admin.firestore.FieldValue.serverTimestamp()});
    console.log('sales',id);
  }
  const sells = parseInserts(sql,'sell_orders');
  for(const f of sells){
    const [id,customer_id,product_id,quantity,price,status,created_at]=f;
    await db.collection('sell_orders').doc(String(id)).set({customer_id:String(customer_id),product_id:String(product_id),quantity:Number(quantity),price:Number(price),total:Number(quantity)*Number(price),status, createdAt: created_at? new Date(created_at): admin.firestore.FieldValue.serverTimestamp()});
    console.log('sell_orders',id);
  }
  console.log('Done. Create Firebase Auth user admin@sms3.com manually in Console > Authentication.');
}
run().catch(e=>{console.error(e); process.exit(1);});
