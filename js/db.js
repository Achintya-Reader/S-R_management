// Helpers that call Pages Functions /api/* with Firebase ID token, fallback to direct Firestore if functions not deployed
import { getIdToken } from "./firebase.js";
export async function api(path, opts={}){
  const token = await getIdToken();
  const headers = opts.headers || {};
  if(token) headers['Authorization']=`Bearer ${token}`;
  headers['Content-Type']='application/json';
  const res = await fetch(path, {...opts, headers});
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
export function fmt(n){ return Number(n||0).toLocaleString(); }
export function money(n){ return '$'+Number(n||0).toFixed(2); }
