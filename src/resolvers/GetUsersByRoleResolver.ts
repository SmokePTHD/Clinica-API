// GetAllUsersByRoleResolver.ts
import { Arg, Query, Resolver, UseMiddleware, Ctx } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";

import { User } from "../dtos/model/UserModel";
import { PaginatedUsersResponse } from "../dtos/model/PaginatedUsersResponseModel";
import { UserFilterInput } from "../dtos/inputs/UserFilterInput";
import { AuthFirebase } from "../middleware/AuthFirebase";
import { MyContext } from "../types/MyContext";

@Resolver()
class GetAllUsersByRoleResolver {
  private firestore = getFirestore();

  @Query(() => [User])
  @UseMiddleware(AuthFirebase)
  async getUsersByRole(
    @Arg("role") role: string,
    @Ctx() context: MyContext
  ): Promise<User[]> {
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
  @UseMiddleware(AuthFirebase)
  async getPaginatedUsers(
    @Ctx() context: MyContext,
    @Arg("limit", () => Number, { defaultValue: 10 }) limit: number,
    @Arg("offset", () => Number, { nullable: true }) offset?: number,
    @Arg("cursor", () => String, { nullable: true }) cursor?: string,
    @Arg("filter", () => UserFilterInput, { nullable: true })
    filter?: UserFilterInput
  ): Promise<PaginatedUsersResponse> {
    try {
      let query = this.firestore
        .collection("users")
        .orderBy("name")
        .limit(limit);

      if (filter) {
        Object.keys(filter).forEach((key) => {
          const value = filter[key as keyof UserFilterInput];
          if (value !== undefined && value !== null) {
            if (key === "role" && value === "!=patient") {
              query = query.where("role", "!=", "patient");
            } else if (key === "name") {
              const words = value.split("*").map((word) => word.trim());
              if (words.length > 0) {
                query = query
                  .where("name", ">=", words[0])
                  .where("name", "<=", words[0] + "\uf8ff");
              }
            } else {
              query = query.where(key, "==", value);
            }
          }
        });
      }

      if (cursor) {
        const snapshot = await this.firestore
          .collection("users")
          .doc(cursor)
          .get();
        if (snapshot.exists) {
          query = query.startAfter(snapshot.data()?.name);
        }
      }

      const usersSnapshot = await query.get();
      if (usersSnapshot.empty) return { users: [], lastCursor: undefined };

      const users: User[] = usersSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: data.name || "",
            email: data.email || "",
            address: data.address || "",
            cc: data.cc || "",
            sns: data.sns || "",
            nif: data.nif || "",
            note: data.note || "",
            phone: data.phone || "",
            gender: data.gender || "",
            role: data.role || "",
            status: data.status || 0,
            profileImage: data.profileImage || "",
            sex: data.sex || "",
            birthDate: data.birthDate?._seconds
              ? new Date(data.birthDate._seconds * 1000)
              : new Date(0),
          };
        })
        .filter((user) => {
          if (filter?.name) {
            const words = filter.name.split("*").map((word) => word.trim());
            return words.every((word) => user.name.includes(word));
          }
          return true;
        });

      const lastCursor =
        usersSnapshot.docs[usersSnapshot.docs.length - 1]?.id || null;

      return { users, lastCursor: lastCursor ?? undefined };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
      }
      throw error;
    }
  }
}

export default GetAllUsersByRoleResolver;
