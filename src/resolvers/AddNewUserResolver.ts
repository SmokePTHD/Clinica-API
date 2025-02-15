import dotenv from "dotenv";
import { Arg, Mutation, Resolver } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { randomBytes } from "crypto";

import { AddUserModel } from "../dtos/model/AddUserModel";
import { AddUserInputs } from "../dtos/inputs/AddUserInputs";
import { getCurrentYear } from "../utils/dateUtils";

import mg from "../config/mailer";

dotenv.config();

@Resolver()
export class AddNewUserResolver {
  private firestore = getFirestore();
  private auth = getAuth();
  private storage = getStorage().bucket(process.env.BUCKET);

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
  async addNewUser(
    @Arg("data")
    {
      address,
      birthDate,
      email,
      name,
      nif,
      note,
      phone,
      role,
      percentage,
      salary,
    }: AddUserInputs
  ): Promise<AddUserModel> {
    try {
      const password = this.generatePassword(12);

      const userRecord = await this.auth.createUser({
        email,
        password: password,
        displayName: name,
      });

      const userDoc = this.firestore.collection("users").doc(userRecord.uid);

      if (role === "pacient") {
        await userDoc.set({
          address: address,
          birthDate: birthDate,
          email: email,
          name: name,
          nif: nif,
          note: note,
          phone: phone,
          role: role,
        });
      } else {
        await userDoc.set({
          address: address,
          birthDate: birthDate,
          email: email,
          name: name,
          phone: phone,
          role: role,
          percentage: percentage || 0,
          salary: salary || 0,
        });
      }

      const folderPath = `users/${userRecord.uid}/profile`;
      const file = this.storage.file(`${folderPath}/placeholder.txt`);
      await file.save("This is a placeholder file to create the folder.");

      const [firstName] = name.split(" ");
      const currentYear = getCurrentYear();

      await mg.messages.create(process.env.MAIL_HOST, {
        from: `"Clínica Rio Este" <${process.env.MAIL_USER}>`,
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
