import { Arg, Query, Resolver } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";

import { User } from "../dtos/model/UserModel";
import { PaginatedUsersResponse } from "../dtos/model/PaginatedUsersResponseModel";

@Resolver()
export class GetAllUsersByRoleResolver {
  private firestore = getFirestore();

  @Query(() => [User])
  async getUsersByRole(@Arg("role") role: string): Promise<User[]> {
    const usersRef = this.firestore.collection("users");
    const snapshot = await usersRef.where("role", "==", role).get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      uid: doc.id,
    })) as User[];
  }

  @Query(() => PaginatedUsersResponse)
  async getPaginatedUsers(
    @Arg("role") role: string,
    @Arg("limit", { defaultValue: 10 }) limit: number,
    @Arg("cursor", { nullable: true }) cursor?: string
  ): Promise<PaginatedUsersResponse> {
    try {
      let query = this.firestore
        .collection("users")
        .where("role", "==", role)
        .orderBy("name") // Garantir que o campo de ordenação seja correto
        .limit(limit);

      if (cursor) {
        const snapshot = await this.firestore
          .collection("users")
          .doc(cursor)
          .get();

        if (snapshot.exists) {
          query = query.startAfter(snapshot.data()?.name); // Ou outro campo de ordenação
        }
      }

      const usersSnapshot = await query.get();
      if (usersSnapshot.empty) return { users: [], lastCursor: null };

      const users: User[] = usersSnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      })) as User[];

      const lastCursor =
        usersSnapshot.docs[usersSnapshot.docs.length - 1]?.id || null;

      return { users, lastCursor };
    } catch (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }
  }
}
