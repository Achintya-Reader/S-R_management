// Node seed for fir-r-management — creates Auth user + Firestore users/{uid}
// Usage: 
// 1. Firebase Console > Project Settings > Service Accounts > Generate new private key -> save as serviceAccountKey.json in Deploy/
// 2. npm i
// 3. node seed_admin.js [email] [password] [name]
//    default: admin@sms3.com admin123 Admin
import fs from 'fs';
import admin from 'firebase-admin';

const projectId = 'fir-r-management';
const saPath = './serviceAccountKey.json';
const email = process.argv[2] || 'admin@sms3.com';
const password = process.argv[3] || 'admin123';
const name = process.argv[4] || 'Admin';

if(!fs.existsSync(saPath)){
  console.error('Missing serviceAccountKey.json');
  console.error('Get it: https://console.firebase.google.com/project/fir-r-management/settings/serviceaccounts/adminsdk -> Generate new private key');
  process.exit(1);
}
const sa = JSON.parse(fs.readFileSync(saPath,'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId });
const auth = admin.auth();
const db = admin.firestore();

async function run(){
  let user;
  try{
    user = await auth.createUser({ email, password, displayName: name, emailVerified:true });
    console.log(`Auth created: ${user.uid} ${email}`);
  }catch(e){
    if(e.code==='auth/email-already-exists'){
      user = await auth.getUserByEmail(email);
      console.log(`Auth exists: ${user.uid} ${email} - updating password`);
      await auth.updateUser(user.uid, { password, displayName:name });
    } else throw e;
  }
  await db.collection('users').doc(user.uid).set({
    name, email, is_active:1, isActive:true, role:'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    created_at: new Date().toISOString()
  }, {merge:true});
  console.log(`Firestore users/${user.uid} written`);
  // also set custom claim for admin (optional, for rules)
  await auth.setCustomUserClaims(user.uid, {admin:true});
  console.log(`Custom claim admin:true set`);
  console.log(`\n✅ Done. Login with ${email} / ${password}`);
  process.exit(0);
}
run().catch(e=>{ console.error(e); process.exit(1); });
