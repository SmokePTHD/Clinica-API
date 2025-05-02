import { Arg, Query, Resolver, UseMiddleware, Ctx } from "type-graphql";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { User } from "../dtos/model/UserModel";
import { UserNameResponse } from "../dtos/model/GetUserNamesModel";
import { AuthFirebase } from "../middleware/AuthFirebase";
import { MyContext } from "../types/MyContext";

@Resolver()
class UserResolver {
  private firestore = getFirestore();

  @Query(() => User)
  @UseMiddleware(AuthFirebase)
  async getUser(@Ctx() context: MyContext): Promise<User> {
    try {
      const uid = context.user.uid;
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
        cc: userData?.cc,
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

  @Query(() => User)
  @UseMiddleware(AuthFirebase)
  async getUserByUID(@Arg("UID") uid: string): Promise<User> {
    try {
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
        cc: userData?.cc,
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

  @Query(() => [UserNameResponse])
  @UseMiddleware(AuthFirebase)
  async getUserNamesByUids(
    @Arg("uids", () => [String]) uids: string[]
  ): Promise<UserNameResponse[]> {
    try {
      const promises = uids.map(async (uid) => {
        const doc = await this.firestore.collection("users").doc(uid).get();
        return {
          uid,
          name: doc.exists
            ? doc.data()?.name ?? "Desconhecido"
            : "Desconhecido",
        };
      });

      return await Promise.all(promises);
    } catch (error: any) {
      throw new Error(`Erro ao obter nomes dos utilizadores: ${error.message}`);
    }
  }
}

export default UserResolver;
