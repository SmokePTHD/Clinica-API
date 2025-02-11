import { Arg, Query, Resolver } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";

import { GetUserByRole } from "../dtos/model/GetUserByRoleModel";

@Resolver()
export class GetUsersByRoleResolver {
  private firestore = getFirestore();

  @Query(() => [GetUserByRole])
  async getUsersByRole(@Arg("role") role: string): Promise<GetUserByRole[]> {
    const usersRef = this.firestore.collection("users");
    const snapshot = await usersRef.where("role", "==", role).get();

    if (snapshot.empty) {
      return [];
    }

    const users: GetUserByRole[] = [];
    snapshot.forEach((doc) => {
      const user = doc.data() as GetUserByRole;
      user.uid = doc.id;
      users.push(user);
    });

    return users;
  }
}
