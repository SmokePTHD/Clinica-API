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

      await mg.messages.create(process.env.MAIL_HOST, {
        from: `"Clínica Rio Este" <${process.env.MAIL_USER}>`,
        to: [email],
        subject: "Redefinição de senha",
        template: "reset password",
        "h:X-Mailgun-Variables": JSON.stringify({
          reset_password_link: resetLink,
          year: "2025",
        }),
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
