import { Arg, Query, Resolver } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";

import { User } from "../dtos/model/UserModel";

@Resolver()
export class GetUsersByRoleResolver {
  private firestore = getFirestore();

  @Query(() => [User])
  async getUsersByRole(@Arg("role") role: string): Promise<User[]> {
    const usersRef = this.firestore.collection("users");
    const snapshot = await usersRef.where("role", "==", role).get();

    if (snapshot.empty) {
      return [];
    }

    const users: User[] = [];
    snapshot.forEach((doc) => {
      const user = doc.data() as User;
      user.uid = doc.id;
      users.push(user);
    });

    return users;
  }

  @Query(() => [User])
  async getUsers(
    @Arg("limit", { defaultValue: 10 }) limit: number,
    @Arg("role") role: string
  ): Promise<User[]> {
    try {
      const usersSnapshot = await this.firestore
        .collection("users")
        .where("role", "==", role)
        .limit(limit)
        .get();

      if (usersSnapshot.empty) {
        throw new Error("Nenhum utilizador encontrado.");
      }

      const users: User[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          uid: doc.id,
          address: userData.address,
          birthDate: userData.birthDate?.toDate(),
          email: userData.email,
          name: userData.name,
          nif: userData.nif,
          note: userData.note,
          phone: userData.phone,
          role: userData.role,
          sex: userData.sex,
          status: userData.status,
          profileImage: userData.profileImage,
        });
      });

      return users;
    } catch (error: any) {
      throw new Error(
        `Erro ao buscar dados dos utilizadores: ${error.message}`
      );
    }
  }
}
