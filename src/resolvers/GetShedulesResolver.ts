import moment from "moment";
import {
  Arg,
  Query,
  Mutation,
  Resolver,
  UseMiddleware,
  Ctx,
} from "type-graphql";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

import { RoleGuard } from "../middleware/RoleGuard";
import { AuthFirebase } from "../middleware/AuthFirebase";
import { MyContext } from "../types/MyContext";
import { KpiResolver } from "./KpiResolver";

import { Schedule } from "../dtos/model/ScheduleModel";
import {
  SchedulesIntervalInput,
  DentistSchedulesIntervalInput,
} from "../dtos/inputs/SchedulesIntervalInput";
import {
  SchedulesChangeStatusInput,
  FinalizeScheduleInput,
} from "../dtos/inputs/SchedulesChangeStatusInput";

@Resolver()
export class GetSchedulesResolver {
  private firestore = getFirestore();

  @Query(() => [Schedule])
  async getSchedulesByInterval(
    @Arg("data") data: SchedulesIntervalInput
  ): Promise<Schedule[]> {
    const { dateStart, dateEnd, office } = data;

    const startTimestamp = Timestamp.fromDate(new Date(dateStart));
    const endTimestamp = Timestamp.fromDate(new Date(dateEnd));

    const snapshot = await this.firestore
      .collection("schedules")
      .where("dateStart", "<=", endTimestamp)
      .where("dateEnd", ">=", startTimestamp)
      .where("office", "==", office)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        patient: data.patient,
        dentist: data.dentist,
        office: data.office,
        status: data.status,
        dateStart: (data.dateStart as Timestamp).toDate().toISOString(),
        dateEnd: (data.dateEnd as Timestamp).toDate().toISOString(),
      };
    });
  }

  @Query(() => [Schedule])
  @UseMiddleware(AuthFirebase)
  async getDentistSchedulesByInterval(
    @Arg("data") data: DentistSchedulesIntervalInput,
    @Ctx() context: MyContext
  ): Promise<Schedule[]> {
    const dentist = context.user.uid;

    const startTimestamp = Timestamp.fromDate(new Date(data.dateStart));
    const endTimestamp = Timestamp.fromDate(new Date(data.dateEnd));

    const snapshot = await this.firestore
      .collection("schedules")
      .where("dateStart", "<=", endTimestamp)
      .where("dateEnd", ">=", startTimestamp)
      .where("dentist", "==", dentist)
      .where("status", "!=", 1)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        patient: data.patient,
        dentist: data.dentist,
        office: data.office,
        status: data.status,
        dateStart: (data.dateStart as Timestamp).toDate().toISOString(),
        dateEnd: (data.dateEnd as Timestamp).toDate().toISOString(),
      };
    });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(AuthFirebase, RoleGuard(["ceo", "receptionist", "manager"]))
  async updateScheduleStatus(
    @Arg("data") data: SchedulesChangeStatusInput
  ): Promise<boolean> {
    const { scheduleId, newStatus } = data;

    const scheduleRef = await this.firestore
      .collection("schedules")
      .doc(scheduleId);

    await scheduleRef.update({ status: newStatus });
    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(AuthFirebase, RoleGuard(["receptionist", "manager", "ceo"]))
  async finalizeSchedule(
    @Arg("data") data: FinalizeScheduleInput
  ): Promise<boolean> {
    const { scheduleId, price, paymentMethod, installments } = data;

    const scheduleRef = this.firestore.collection("schedules").doc(scheduleId);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      throw new Error("Consulta não encontrada");
    }

    const scheduleData = scheduleDoc.data();
    const dentist = scheduleData?.dentist;
    const dateEnd: Date = (scheduleData?.dateEnd as Timestamp).toDate();
    const revenueDate = moment(dateEnd).format("YYYY-MM-DD");

    await scheduleRef.update({
      status: 5,
      price,
      paymentMethod,
      installments: paymentMethod === 3 ? installments ?? 1 : null,
      finalizedAt: new Date().toISOString(),
    });

    const revenueRef = this.firestore.collection("revenues").doc(revenueDate);
    await this.firestore.runTransaction(async (t) => {
      const revenueSnap = await t.get(revenueRef);
      const data = revenueSnap.exists
        ? revenueSnap.data()!
        : {
            total: 0,
            dentists: {},
            createdAt: Timestamp.now(),
          };

      data.total += price;
      data.dentists[dentist] = (data.dentists[dentist] || 0) + price;

      t.set(revenueRef, data);
    });

    const year = dateEnd.getFullYear();
    const month = dateEnd.getMonth();
    const kpiService = new KpiResolver();
    await kpiService.addRevenueToKpi(year, month, price);
    await kpiService.incrementConsultas(year, month);

    return true;
  }

  @Query(() => [Schedule])
  @UseMiddleware(AuthFirebase, RoleGuard(["receptionist", "manager", "ceo"]))
  async getUserSchedules(@Arg("uid") uid: string): Promise<Schedule[]> {
    const snapshot = await this.firestore
      .collection("schedules")
      .where("patient", "==", uid)
      .get();

    const schedules = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        let dentistName = "N/D";
        if (data.dentist) {
          const dentistDoc = await this.firestore
            .collection("users")
            .doc(data.dentist)
            .get();
          if (dentistDoc.exists) {
            dentistName = dentistDoc.data()?.name || "N/D";
          }
        }

        return {
          id: doc.id,
          patient: data.patient,
          dentist: dentistName, 
          office: data.office,
          status: data.status,
          dateStart: (data.dateStart as Timestamp).toDate().toISOString(),
          dateEnd: (data.dateEnd as Timestamp).toDate().toISOString(),
          price: data.price ?? null,
          paymentMethod: data.paymentMethod ?? null,
          installments: data.installments ?? null,
        };
      })
    );

    return schedules;
  }
}
