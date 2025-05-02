import dotenv from "dotenv";
import * as functions from "firebase-functions/v1";
import { getFirestore } from "firebase-admin/firestore";

import mg from "../config/mailer";

dotenv.config();

const firestore = getFirestore();

export const reminderAppointment = functions.pubsub
  .schedule("every 60 minutes")
  .timeZone("Europe/Lisbon")
  .onRun(async (context) => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const snapshot = await firestore
      .collection("schedules")
      .where("status", "in", [2, 3])
      .where("notified", "==", false)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const dataConsulta = new Date(data.dateStart);

      const diffHours =
        Math.abs(dataConsulta.getTime() - in24h.getTime()) / 36e5;

      if (diffHours < 1) {
        const pacienteRef = await firestore
          .collection("users")
          .doc(data.patient)
          .get();

        const email = pacienteRef.data()?.email;
        const nome = pacienteRef.data()?.name?.split(" ")[0];
        const status = data.status;

        if (email) {
          if (status === 2) {
            await mg.messages.create(process.env.MAIL_HOST!, {
              from: `"Clínica Rio Este" <${process.env.MAIL_USER!}>`,
              to: [email],
              subject: "A sua consulta está a chegar!",
              template: "reminder appointment not confirmed",
              "h:X-Mailgun-Variables": JSON.stringify({
                name: nome,
                date: new Date(data.dateStart).toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "2-digit",
                }),
                confirmation_link: `${process.env.FRONTEND_URL}/confirm/${data.confirmToken}`,
                time: new Date(data.dateStart).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }),
            });
          }
          if (status === 3) {
            await mg.messages.create(process.env.MAIL_HOST!, {
              from: `"Clínica Rio Este" <${process.env.MAIL_USER!}>`,
              to: [email],
              subject: "A sua consulta está a chegar!",
              template: "reminder appointment",
              "h:X-Mailgun-Variables": JSON.stringify({
                name: nome,
                date: new Date(data.dateStart).toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "2-digit",
                }),
                time: new Date(data.dateStart).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }),
            });
          }

          await doc.ref.update({ notified: true });
        }
      }
    }

    return null;
  });
