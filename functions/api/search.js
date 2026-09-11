export async function onRequestPost(context){
  try{
    const {q} = await context.request.json().catch(()=>({}));
    const term = (q||'').toLowerCase();
    // This endpoint is fallback - frontend does client filter (simple search)
    // Keep for compatibility with old assets/js/script.js which POSTs to /api/search
    return new Response(JSON.stringify({useClient:true, term}), {headers:{'Content-Type':'application/json'}});
  }catch(e){ return new Response(JSON.stringify([]),{headers:{'Content-Type':'application/json'}}); }
}
export async function onRequestGet(context){
  const url=new URL(context.request.url);
  const term=(url.searchParams.get('q')||'').toLowerCase();
  return new Response(JSON.stringify({useClient:true, term}),{headers:{'Content-Type':'application/json'}});
}
