import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let db: Firestore | null = null;

function parseServiceAccount():
  | { projectId: string; clientEmail: string; privateKey: string }
  | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) {
    try {
      const parsed = JSON.parse(json) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch {
      console.error("[firebase] FIREBASE_SERVICE_ACCOUNT is not valid JSON");
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(parseServiceAccount());
}

export function getFirebaseDb(): Firestore | null {
  const account = parseServiceAccount();
  if (!account) return null;

  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: account.projectId,
          clientEmail: account.clientEmail,
          privateKey: account.privateKey,
        }),
        projectId: account.projectId,
      });
  }

  if (!db) {
    db = getFirestore(app);
  }

  return db;
}
