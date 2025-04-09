import { MiddlewareFn } from "type-graphql";
import admin from "firebase-admin";

export const AuthFirebase: MiddlewareFn<any> = async ({ context }, next) => {
  const authHeader = context.req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Não autorizado");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    context.user = decodedToken;
    return next();
  } catch (err) {
    throw new Error("Token inválido ou expirado");
  }
};