import { Request } from "express";
import admin from "firebase-admin";

export interface MyContext {
  req: Request;
  user: admin.auth.DecodedIdToken;
}
