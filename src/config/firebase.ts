import * as admin from "firebase-admin";
import path from "node:path";

export function initializeFirebase() {
  const serviceAccountPath = path.resolve(
    __dirname,
    "./serviceAccountKey.json"
  );
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL,
  });
}

export { admin };
