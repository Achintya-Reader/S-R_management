import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-analytics.js";
import { firebaseConfig } from "../firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Analytics optional - only runs in browser with measurementId
isSupported().then(ok=>{ if(ok) try{ getAnalytics(app); }catch(e){} }).catch(()=>{});

export { onAuthStateChanged, signInWithEmailAndPassword, signOut, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp };

// simple auth guard for pages (easiest - no Worker verification needed for free tier)
export function requireAuth(redirect='login.html'){
  onAuthStateChanged(auth, user=>{
    if(!user){
      // add ?next= so login can redirect back + show hint
      const next = encodeURIComponent(location.pathname + location.search);
      // avoid loop if already on login
      if(!location.pathname.endsWith('login.html')){
        location.href = `${redirect}?next=${next}`;
      }
    } else {
      const el=document.getElementById('userEmail');
      if(el) el.textContent=user.email;
    }
  });
}
export async function getIdToken(){
  const u=auth.currentUser;
  return u ? await u.getIdToken() : null;
}
