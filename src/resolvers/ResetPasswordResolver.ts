import dotenv from "dotenv";
import { Arg, Mutation, Resolver } from "type-graphql";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

import { ResetPasswordInput } from "../dtos/inputs/ResetPasswordInput";
import { ApplyResetPasswordInput } from "../dtos/inputs/ApplyResetPasswordInput";
import { ResetPassword } from "../dtos/model/ResetPasswordModel";

import mg from "../config/mailer";
import { getCurrentYear } from "../utils/dateUtils";

dotenv.config();

@Resolver()
class ResetUsersPassword {
  private auth = getAuth();
  private db = getFirestore();

  @Mutation(() => ResetPassword)
  async Reset(
    @Arg("data") { email }: ResetPasswordInput
  ): Promise<ResetPassword> {
    try {
      const now = Date.now();

      const existingTokensSnapshot = await this.db
        .collection("password_resets")
        .where("email", "==", email)
        .orderBy("createdAt", "desc")
        .get();

      if (!existingTokensSnapshot.empty) {
        const lastReset = existingTokensSnapshot.docs[0].data();
        const timeDiff = now - lastReset.createdAt;

        if (timeDiff < 10 * 60 * 1000) {
          const minutesLeft = Math.ceil((10 * 60 * 1000 - timeDiff) / 60000);
          throw new Error(
            `Já foi enviado um pedido recentemente. Tenta novamente daqui a ${minutesLeft} minutos.`
          );
        }

        const deleteBatch = this.db.batch();
        existingTokensSnapshot.docs.forEach((doc) => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
      }

      const token = uuidv4();
      const expiresAt = now + 5 * 60 * 1000;

      await this.db.collection("password_resets").doc(token).set({
        email,
        expiresAt,
        createdAt: now,
      });

      const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      const year = getCurrentYear();

      await mg.messages.create(process.env.MAIL_HOST!, {
        from: `"Clínica Rio Este" <${process.env.MAIL_USER!}>`,
        to: [email],
        subject: "Redefinição de senha",
        template: "reset password",
        "h:X-Mailgun-Variables": JSON.stringify({
          reset_password_link: link,
          year,
        }),
      });

      return {
        success: true,
        message: `O link de redefinição foi enviado para ${email}`,
      };
    } catch (error) {
      console.error("Erro ao gerar token de reset:", error);
      throw new Error(
        typeof error === "string"
          ? error
          : "Não foi possível gerar o link de redefinição de senha."
      );
    }
  }

  @Mutation(() => ResetPassword)
  async AplyResetPassword(
    @Arg("data") { token, password }: ApplyResetPasswordInput
  ): Promise<ResetPassword> {
    const docRef = this.db.collection("password_resets").doc(token);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Token inválido ou expirado.");
    }

    const data = doc.data();
    const { email, expiresAt } = data!;

    if (Date.now() > expiresAt) {
      await docRef.delete();
      throw new Error("Token expirado. Por favor, solicite novo link.");
    }

    try {
      const user = await this.auth.getUserByEmail(email);
      await this.auth.updateUser(user.uid, { password });

      await docRef.delete();

      return {
        success: true,
        message: "Password alterada com sucesso.",
      };
    } catch (err) {
      console.error("Erro ao aplicar nova password:", err);
      throw new Error("Não foi possível alterar a password.");
    }
  }
}

export default ResetUsersPassword;
