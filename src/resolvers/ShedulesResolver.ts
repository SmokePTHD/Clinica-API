import { Arg, Mutation, Resolver } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";

@Resolver()
export class ConfirmarConsultaResolver {
  private firestore = getFirestore();

  @Mutation(() => Boolean)
  async confirmarConsultaPorToken(
    @Arg("token") token: string
  ): Promise<boolean> {
    try {
      const snapshot = await this.firestore
        .collection("schedules")
        .where("confirmToken", "==", token)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(
          "Token de confirmação inválido ou consulta não encontrada."
        );
        return false;
      }

      const consulta = snapshot.docs[0];

      await consulta.ref.update({
        status: 3,
        confirmToken: null,
        confirmedAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error("Erro ao confirmar a consulta:", error);
      throw new Error("Erro interno ao confirmar a consulta.");
    }
  }
}
