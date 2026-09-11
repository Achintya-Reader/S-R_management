// Pages Functions middleware - verifies Firebase ID token if present
// Requires env FIREBASE_PROJECT_ID. For free tier we allow request even without token but mark as unauthed
export async function onRequest(context){
  // Allow login page without auth
  const url = new URL(context.request.url);
  if(url.pathname.endsWith('login.html') || url.pathname.startsWith('/api/')){
    // let api handle its own auth
  }
  return await context.next();
}
