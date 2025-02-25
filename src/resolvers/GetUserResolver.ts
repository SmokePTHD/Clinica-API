import { Arg, Query, Resolver } from "type-graphql";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { User } from "../dtos/model/UserModel";

@Resolver()
export class UserResolver {
  private firestore = getFirestore();

  @Query(() => User)
  async getUser(@Arg("token") token: string): Promise<User> {
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      const uid = decodedToken.uid;

      const userDoc = await this.firestore.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        throw new Error("Utilizador não encontrado.");
      }

      const userData = userDoc.data();

      return {
        uid,
        address: userData?.address,
        birthDate: userData?.birthDate?.toDate(),
        email: userData?.email,
        name: userData?.name,
        nif: userData?.nif,
        note: userData?.note,
        phone: userData?.phone,
        role: userData?.role,
        sex: userData?.sex,
        status: userData?.status,
        profileImage: userData?.profileImage,
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar dados do utilizador: ${error.message}`);
    }
  }
}
