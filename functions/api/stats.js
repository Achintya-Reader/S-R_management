export async function onRequestGet(context){
  // Try to use Firestore REST - requires FIREBASE_PROJECT_ID env
  const projectId = context.env.FIREBASE_PROJECT_ID;
  if(!projectId){
    // fallback: tell frontend to compute via client SDK
    return new Response(JSON.stringify({useClient:true}), {headers:{'Content-Type':'application/json'}});
  }
  try{
    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    // For speed/free quota, we just return counts via frontend; this is placeholder
    // Real impl would use aggregation queries with service account
    return new Response(JSON.stringify({useClient:true, note:"Configure FIREBASE_SERVICE_ACCOUNT to enable server counts"}), {headers:{'Content-Type':'application/json'}});
  }catch(e){
    return new Response(JSON.stringify({error:e.message}), {status:500, headers:{'Content-Type':'application/json'}});
  }
}
