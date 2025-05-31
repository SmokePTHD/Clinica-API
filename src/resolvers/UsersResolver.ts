import { getFirestore } from "firebase-admin/firestore";
import {
  Arg,
  Ctx,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Field,
} from "type-graphql";

import { MyContext } from "../types/MyContext";

@ObjectType()
class UserStatusResponse {
  @Field()
  status!: number;
}

@Resolver()
class UserResolver {
  private firestore = getFirestore();

  @Mutation(() => Boolean)
  async ChangeUserStatus(
    @Arg("newStatus") newStatus: number,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    try {
      const uid = context.user.uid;
      const userDoc = await this.firestore.collection("users").doc(uid).get();

      await userDoc.ref.update({
        status: newStatus,
      });

      return true;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  @Query(() => UserStatusResponse)
  async GetUserStatus(@Ctx() context: MyContext): Promise<UserStatusResponse> {
    const uid = context.user.uid;
    const userDoc = await this.firestore.collection("users").doc(uid).get();
    const data = userDoc.data();

    if (!data || typeof data.status !== "number") {
      throw new Error("Campo 'status' inválido ou ausente");
    }

    return { status: data.status };
  }

  // TODO: Verificar se vai ser necessario
  @Query(() => [UserStatusResponse])
  async GetAllColaboratorsStatus(): Promise<UserStatusResponse[]> {
    const snapshot = await this.firestore
      .collection("users")
      .where("role", "!=", "patient")
      .get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        status: data.status,
      };
    });

    return users;
  }
}
