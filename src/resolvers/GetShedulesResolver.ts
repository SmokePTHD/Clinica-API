import { Arg, Query, Resolver, UseMiddleware, Ctx } from "type-graphql";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

import { RoleGuard } from "../middleware/RoleGuard";
import { AuthFirebase } from "../middleware/AuthFirebase";
import { MyContext } from "../types/MyContext";

import { Schedule } from "../dtos/model/ScheduleModel";
import {
  SchedulesIntervalInput,
  DentistSchedulesIntervalInput,
} from "../dtos/inputs/SchedulesIntervalInput";

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
      const { dateStart, dateEnd, ...rest } = doc.data();

      return {
        ...rest,
        dateStart: (dateStart as Timestamp).toDate().toISOString(),
        dateEnd: (dateEnd as Timestamp).toDate().toISOString(),
      } as Schedule;
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
      const { dateStart, dateEnd, ...rest } = doc.data();

      return {
        ...rest,
        dateStart: (dateStart as Timestamp).toDate().toISOString(),
        dateEnd: (dateEnd as Timestamp).toDate().toISOString(),
      } as Schedule;
    });
  }
}
