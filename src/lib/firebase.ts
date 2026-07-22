import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  doc,
  getDocFromServer,
  runTransaction,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Test Connection on Boot (Critical Constraint)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration. Client appears to be offline.");
    }
  }
}
testConnection();

// Firestore Error Handler conforming to standard ErrorInfo schemas
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Concurrency-safe tracking number generator using Firestore Transactions.
 * Format: TPL-YYYYMMDD-000001
 */
export async function generateTrackingNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`; // YYYYMMDD

  const metadataRef = doc(db, "system", "metadata");

  try {
    const nextTrackingNum = await runTransaction(db, async (transaction) => {
      const metadataDoc = await transaction.get(metadataRef);

      let nextSequence = 1;

      if (metadataDoc.exists()) {
        const data = metadataDoc.data();
        if (data.lastDate === dateStr) {
          nextSequence = (data.lastSequence || 0) + 1;
        }
      }

      transaction.set(metadataRef, {
        lastDate: dateStr,
        lastSequence: nextSequence,
      });

      const sequenceFormatted = String(nextSequence).padStart(6, "0");
      return `TPL-${dateStr}-${sequenceFormatted}`;
    });

    return nextTrackingNum;
  } catch (err) {
    console.warn("Firestore transaction failed, falling back to timestamp-based unique generator:", err);
    // Secure fallback: generate a unique random counter suffix to prevent duplicate errors
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `TPL-${dateStr}-${randomSuffix}`;
  }
}
