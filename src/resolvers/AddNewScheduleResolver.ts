import dotenv from "dotenv";
import { Arg, Mutation, Resolver, UseMiddleware, Ctx } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { v4 as uuidv4 } from "uuid";

import { AddScheduleModel } from "../dtos/model/AddScheduleModel";
import { AddScheduleInputs } from "../dtos/inputs/AddScheduleInputs";

import mg from "../config/mailer";
import { AuthFirebase } from "../middleware/AuthFirebase";
import { MyContext } from "../types/MyContext";
import { getCurrentYear } from "../utils/dateUtils";

dotenv.config();

@Resolver()
export class AddNewScheduleResolver {
  private firestore = getFirestore();

  @Mutation(() => AddScheduleModel)
  @UseMiddleware(AuthFirebase)
  async addNewSchedule(
    @Arg("data")
    { office, patient, dentist, dateStart, dateEnd, status }: AddScheduleInputs,
    @Ctx() context: MyContext
  ): Promise<AddScheduleModel> {
    try {
      const patientDoc = await this.firestore
        .collection("users")
        .doc(patient)
        .get();

      if (!patientDoc.exists) {
        throw new Error("Paciente não encontrado.");
      }

      const email = patientDoc.data()?.email;
      const nome = patientDoc.data()?.name?.split(" ")[0];

      if (!email) {
        throw new Error("Email do paciente não encontrado.");
      }

      const scheduleId = new Date().toISOString();

      const confirmToken = uuidv4();

      const scheduleDoc = this.firestore
        .collection("schedules")
        .doc(scheduleId);

      await scheduleDoc.set({
        office,
        patient,
        dentist,
        dateStart,
        dateEnd,
        status,
        confirmToken,
      });

      const year = getCurrentYear();

      const confirmLink = `https://desenvolvimentoclinicarioeste.pt/confirmar-consulta?token=${confirmToken}`;

      await mg.messages.create(process.env.MAIL_HOST!, {
        from: `"Clínica Rio Este" <${process.env.MAIL_USER!}>`,
        to: [email],
        subject: "Foi adicionada uma nova consulta!",
        template: "confirm appointment",
        "h:X-Mailgun-Variables": JSON.stringify({
          name: nome,
          date: new Date(dateStart).toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
          }),
          time: new Date(dateStart).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          year: year,
          confirmLink: confirmLink,
        }),
      });

      return {
        success: true,
        message: "A consulta foi adicionada com sucesso",
      };
    } catch (error) {
      console.error("Erro ao adicionar novo agendamento:", error);
      throw new Error("Não foi possível adicionar o novo agendamento.");
    }
  }
}

export default AddNewScheduleResolver;
