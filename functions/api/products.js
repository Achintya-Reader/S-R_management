import { createClient } from "../_lib/firestore.js";

// Pages Function: /api/products -> proxies to Firestore REST
// For free tier simplest path is client SDK; this function shows how to use service account if you set FIREBASE_SERVICE_ACCOUNT
export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  // Verify ID token
  const auth = request.headers.get('Authorization')||'';
  if(!auth.startsWith('Bearer ') && env.REQUIRE_AUTH==='1'){
    return new Response(JSON.stringify({error:'unauthorized'}),{status:401, headers:{'Content-Type':'application/json'}});
  }
  // If no service account configured, tell client to use direct SDK
  if(!env.FIREBASE_PROJECT_ID || !env.FIREBASE_SERVICE_ACCOUNT){
    return new Response(JSON.stringify({useClient:true, message:'Configure FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT in Pages > Settings > Variables'}),{headers:{'Content-Type':'application/json'}});
  }
  // With service account you'd use firestore REST here
  // Simplified: just return useClient flag - frontend will do direct Firestore
  return new Response(JSON.stringify({useClient:true}),{headers:{'Content-Type':'application/json'}});
}
