import admin from "firebase-admin";
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types/MyContext";

export function RoleGuard(allowedRoles: string[]): MiddlewareFn<MyContext> {
  return async ({ context }, next) => {
    const authHeader = context.req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      throw new Error("Token não fornecido.");
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await admin.firestore().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      throw new Error("Usuário não encontrado.");
    }

    const userData = userDoc.data();

    if (!userData || !allowedRoles.includes(userData.role)) {
      throw new Error("Acesso negado. Permissão insuficiente.");
    }

    context.user = { ...decoded, role: userData.role };
    return next();
  };
}