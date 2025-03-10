import dotenv from "dotenv";
import axios from "axios";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { google } from "googleapis";

import { admin } from "../config/firebase";

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
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
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

      const customToken = await admin.auth().createCustomToken(uid);

      return customToken;
    } catch (error) {
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
    @Arg("token") token: string,
    @Arg("idToken") idToken: string
  ): Promise<boolean> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      await admin.auth().updateUser(uid, {
        providerToLink: {
          providerId: "google.com",
          idToken,
        },
      });

      return true;
    } catch (error) {
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

      await admin.auth().updateUser(uid, {
        customClaims: { facebookLinked: true },
      });

      return true;
    } catch (error) {
      throw new Error("Erro ao vincular conta Facebook.");
    }
  }
}

export default AuthResolver;
