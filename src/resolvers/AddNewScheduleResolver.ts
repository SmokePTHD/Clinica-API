import dotenv from "dotenv";
import { Arg, Mutation, Resolver } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import { AddScheduleModel } from "../dtos/model/AddScheduleModel";
import { AddScheduleInputs } from "../dtos/inputs/AddScheduleInputs";

import mg from "../config/mailer";

dotenv.config();

@Resolver()
export class AddNewScheduleResolver {
  private firestore = getFirestore();
  private auth = getAuth();

  @Mutation(() => AddScheduleModel)
  async addNewSchedule(
    @Arg("data")
    {
      office,
      pacient,
      doctor,
      dateStart,
      dateEnd,
      note,
      status,
    }: AddScheduleInputs
  ): Promise<AddScheduleModel> {
    try {
      const pacientDoc = await this.firestore
        .collection("users")
        .doc(pacient)
        .get();

      if (!pacientDoc.exists) {
        throw new Error("Paciente não encontrado.");
      }

      const email = pacientDoc.data()?.email;

      if (!email) {
        throw new Error("Email do paciente não encontrado.");
      }

      const scheduleId = new Date().toISOString();

      const scheduleDoc = this.firestore
        .collection("schedules")
        .doc(scheduleId);

      await scheduleDoc.set({
        office,
        pacient,
        doctor,
        dateStart,
        dateEnd,
        note,
        status,
      });

      await mg.messages.create(process.env.MAIL_HOST, {
        from: `"Clínica Rio Este" <${process.env.MAIL_USER}>`,
        to: [email],
        subject: "Foi adiciana uma nova consulta",
        text: `Foi adicionada uma nova consulta`,
        html: `<p>Foi adicionada uma nova consulta</p>`,
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
