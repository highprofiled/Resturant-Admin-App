import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, serverTimestamp, onSnapshot, getDocFromServer } from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

export function getStoredFirebaseConfig() {
  const local = window.localStorage.getItem('custom-firebase-config');
  if (local) {
    try { return JSON.parse(local); } catch(e){}
  }
  if (defaultFirebaseConfig && defaultFirebaseConfig.apiKey && defaultFirebaseConfig.apiKey.length > 0 && !defaultFirebaseConfig.apiKey.includes('YOUR_API_KEY')) {
    return defaultFirebaseConfig;
  }
  return null;
}

export let app: FirebaseApp | any = null;
export let auth: Auth | any = null;
export let db: Firestore | any = null;

export function initFirebase(config: any) {
  if (getApps().length === 0) {
    app = initializeApp(config);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app, config.firestoreDatabaseId);
  return { app, auth, db };
}

const config = getStoredFirebaseConfig();
if (config) {
  initFirebase(config);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
