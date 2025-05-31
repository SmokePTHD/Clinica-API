import { Arg, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { AuthFirebase } from "../middleware/AuthFirebase";
import { RoleGuard } from "../middleware/RoleGuard";
import { KpiResolver } from "./KpiResolver";

@Resolver()
export class DeleteUserResolver {
  private firestore = getFirestore();
  private auth = getAuth();

  @Mutation(() => Boolean)
  @UseMiddleware(AuthFirebase, RoleGuard(["manager", "ceo"]))
  async deleteUserById(@Arg("uid") uid: string): Promise<boolean> {
    try {
      const userDoc = this.firestore.collection("users").doc(uid);
      const docSnap = await userDoc.get();

      if (!docSnap.exists) {
        throw new Error("Usuário não encontrado.");
      }

      const role = docSnap.data()?.role;

      await userDoc.delete();

      await this.auth.deleteUser(uid);

      if (role === "dentist") {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const kpiService = new KpiResolver();
        await kpiService.updateKpiUsersCount(year, month);
      }

      return true;
    } catch (err) {
      console.error("Erro ao excluir utilizador:", err);
      throw new Error("Erro ao excluir utilizador.");
    }
  }
}
