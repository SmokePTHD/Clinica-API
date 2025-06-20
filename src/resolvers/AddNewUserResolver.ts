import dotenv from "dotenv";
import { Arg, Mutation, Resolver, UseMiddleware, Ctx } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { randomBytes } from "crypto";

import { AddUserModel } from "../dtos/model/AddUserModel";
import { AddUserInputs } from "../dtos/inputs/AddUserInputs";
import { getCurrentYear } from "../utils/dateUtils";

import mg from "../config/mailer";
import { AuthFirebase } from "../middleware/AuthFirebase";
import { MyContext } from "../types/MyContext";
import { KpiResolver } from "./KpiResolver";

dotenv.config();

@Resolver()
class AddNewUserResolver {
  private firestore = getFirestore();
  private auth = getAuth();

  private generatePassword(length: number): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
      password += charset[bytes[i] % charset.length];
    }
    return password;
  }

  @Mutation(() => AddUserModel)
  @UseMiddleware(AuthFirebase)
  async addNewUser(
    @Arg("data")
    {
      birthDate,
      email,
      name,
      iban,
      nif,
      phone,
      role,
      percentage,
      salary,
      sex,
    }: AddUserInputs,
    @Ctx() context: MyContext
  ): Promise<AddUserModel> {
    try {
      const password = this.generatePassword(12);

      const userRecord = await this.auth.createUser({
        email,
        password: password,
        displayName: name,
      });

      const userDoc = this.firestore.collection("users").doc(userRecord.uid);

      let profileImage =
        sex === "M"
          ? "https://firebasestorage.googleapis.com/v0/b/clinica-rio-este.appspot.com/o/imagens%2FnoProfileM.jpg?alt=media&token=35125862-d467-48fc-9397-02bfc4656d1e"
          : "https://firebasestorage.googleapis.com/v0/b/clinica-rio-este.appspot.com/o/imagens%2FnoProfileW.jpg?alt=media&token=bc49b717-3b3e-47a1-b8cc-29afabe8222d";

      switch (role) {
        case "patient":
          await userDoc.set({
            birthDate: birthDate,
            email: email,
            name: name,
            nif: nif,
            sex: sex,
            phone: phone,
            role: role,
            profileImage: profileImage,
          });
          break;

        case "dentist":
          await userDoc.set({
            iban: iban,
            birthDate: birthDate,
            email: email,
            name: name,
            phone: phone,
            sex: sex,
            role: role,
            status: 0,
            percentage: percentage || 0,
          });

        default:
          await userDoc.set({
            iban: iban,
            birthDate: birthDate,
            email: email,
            name: name,
            phone: phone,
            sex: sex,
            role: role,
            status: 0,
            salary: salary || 0,
          });
      }

      if (["patient", "dentist"].includes(role)) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const kpiService = new KpiResolver();
        await kpiService.updateKpiUsersCount(year, month);
      }

      const [firstName] = name.split(" ");
      const currentYear = getCurrentYear();

      await mg.messages.create(process.env.MAIL_HOST!, {
        from: `"Clínica Rio Este" <${process.env.MAIL_USER!}>`,
        to: [email],
        subject: "Bem-vindo à Clínica Rio Este",
        template: "create user",
        "h:X-Mailgun-Variables": JSON.stringify({
          email: email,
          name: firstName,
          password: password,
          year: currentYear,
        }),
      });

      return {
        success: true,
        message: `Usuário ${name} criado com sucesso`,
      };
    } catch (error) {
      console.error("Erro ao criar novo usuário:", error);
      throw new Error("Não foi possível criar o novo usuário.");
    }
  }
}

export default AddNewUserResolver;
