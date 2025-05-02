import dotenv from "dotenv";
import axios from "axios";
import { Arg, Mutation, Query, Resolver, Ctx } from "type-graphql";
import { google } from "googleapis";

import { admin } from "../config/firebase";
import { MyContext } from "../types/MyContext";

import { LoginResponse } from "../dtos/model/AuthEmailModel";
import { LoginEmailInput } from "../dtos/inputs/AuthEmailInput";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

@Resolver()
class AuthResolver {
  @Mutation(() => LoginResponse)
  async login(
    @Arg("data") { email, password }: LoginEmailInput
  ): Promise<LoginResponse> {
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process
          .env.FIREBASE_API_KEY!}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );

      const { idToken } = response.data;

      return { token: idToken };
    } catch (error: any) {
      throw new Error(
        `Falha no login: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }

  @Query(() => String)
  async getGoogleAuthUrl(): Promise<string> {
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
      prompt: "consent",
    });
  }

  @Mutation(() => String)
  async loginWithGoogle(@Arg("code") code: string): Promise<string> {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      const idToken = tokens.id_token;

      if (!idToken) {
        throw new Error("Erro ao obter ID Token do Google.");
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // 👉 Faz login com custom token para obter ID token
      const customToken = await admin.auth().createCustomToken(uid);

      const loginRes = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
        {
          token: customToken,
          returnSecureToken: true,
        }
      );

      const finalIdToken = loginRes.data.idToken;

      return finalIdToken; // Este sim será o token que o front usa
    } catch (error) {
      console.error("Erro ao autenticar com Google:", error);
      throw new Error("Falha ao autenticar com Google.");
    }
  }

  @Mutation(() => String)
  async loginWithFacebook(
    @Arg("accessToken") accessToken: string
  ): Promise<string> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,email,name&access_token=${accessToken}`
      );
      const { id, email, name } = response.data;

      if (!id) {
        throw new Error("Erro ao obter informações do Facebook.");
      }

      const uid = `facebook:${id}`;

      const customToken = await admin.auth().createCustomToken(uid);

      return customToken;
    } catch (error) {
      throw new Error("Falha ao autenticar com Facebook.");
    }
  }

  @Mutation(() => Boolean)
  async linkGoogleAccount(
    @Arg("token") firebaseToken: string,
    @Arg("googleIdToken") googleIdToken: string
  ): Promise<boolean> {
    try {
      // Verifica o utilizador atual
      const currentUser = await admin.auth().verifyIdToken(firebaseToken);
      const uid = currentUser.uid;

      // Verifica o ID Token do Google
      const googleUser = await admin.auth().verifyIdToken(googleIdToken);
      const googleEmail = googleUser.email;

      if (!googleEmail) {
        throw new Error("Email da conta Google não encontrado.");
      }

      // Aqui, opcionalmente, podes verificar se o email do Google é o mesmo que o do Firebase

      // Atualiza custom claims (ou apenas anota que foi vinculado)
      await admin.auth().setCustomUserClaims(uid, {
        ...currentUser.claims,
        googleLinked: true,
        googleEmail,
      });

      return true;
    } catch (error: any) {
      console.error("Erro ao vincular conta Google:", error);
      throw new Error("Erro ao vincular conta Google.");
    }
  }

  @Mutation(() => Boolean)
  async linkFacebookAccount(
    @Arg("token") token: string,
    @Arg("accessToken") accessToken: string
  ): Promise<boolean> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,email,name&access_token=${accessToken}`
      );
      const { id } = response.data;

      if (!id) {
        throw new Error("Erro ao obter informações do Facebook.");
      }

      await admin.auth().setCustomUserClaims(uid, {
        facebookLinked: true,
      });

      return true;
    } catch (error) {
      throw new Error("Erro ao vincular conta Facebook.");
    }
  }

  @Mutation(() => String, { nullable: true })
  async verifyFirebaseToken(@Ctx() ctx: MyContext): Promise<string | null> {
    if (!ctx.user) {
      throw new Error("Não autenticado");
    }

    return ctx.user.uid;
  }
}

export default AuthResolver;
