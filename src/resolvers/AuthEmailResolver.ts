import dotenv from "dotenv";
import axios from "axios";
import { Arg, Mutation, Query, Resolver } from "type-graphql";

import { LoginEmailInput } from "../dtos/inputs/AuthEmailInput";
import { LoginResponse } from "../dtos/model/AuthEmailModel";

dotenv.config();

@Resolver()
class AuthEmailResolver {
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
  testQuery(): string {
    return "Yup";
  }
}

export default AuthEmailResolver;
