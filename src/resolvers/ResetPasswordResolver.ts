import dotenv from "dotenv";
import { Arg, Mutation, Resolver } from "type-graphql";
import { getAuth } from "firebase-admin/auth";

import { ResetPasswordInput } from "../dtos/inputs/ResetPasswordInput"; 
import { ResetPassword } from "../dtos/model/ResetPasswordModel";

import mg from "../config/mailer";

dotenv.config();

@Resolver()
export class ResetUsersPassword {
  private auth = getAuth();

  @Mutation(() => ResetPassword)
  async Reset(
    @Arg("data") { email }: ResetPasswordInput
  ): Promise<ResetPassword> {
    try {
      const resetLink = await this.auth.generatePasswordResetLink(email);
      console.log("Link de redefinição de senha:", resetLink);

      await mg.messages.create(process.env.MAIL_HOST, {
        from: `"Clínica Rio Este" <${process.env.MAIL_USER}>`,
        to: [email],
        subject: "Redefinição de senha",
        text: `Clique no link para redefinir sua senha: ${resetLink}`,
        html: `<p>Clique no link para redefinir sua senha: <a href="${resetLink}">${resetLink}</a></p>`,
      });

      return {
        success: true,
        message: `O link de redefinição foi enviado para ${email}`,
      };
    } catch (error) {
      console.error("Erro ao redefinir a senha:", error);
      throw new Error("Não foi possível gerar o link de redefinição de senha.");
    }
  }
}