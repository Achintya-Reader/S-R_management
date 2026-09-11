// helper for Firestore REST with service account (optional)
// For 10-min deploy we keep client SDK path; this is scaffold for future server TX
export function createClient(env){ return { projectId: env.FIREBASE_PROJECT_ID }; }
export async function firestoreGet(projectId, coll){
  const url=`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${coll}`;
  const r=await fetch(url);
  return r.json();
}
