import { Arg, Query, Resolver, UseMiddleware } from "type-graphql";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

import { RoleGuard } from "../middleware/RoleGuard";

import { Schedule } from "../dtos/model/ScheduleModel";
import { SchedulesIntervalInput } from "../dtos/inputs/SchedulesIntervalInput";

@Resolver()
export class GetSchedulesResolver {
  private firestore = getFirestore();

  @Query(() => [Schedule])
  async getSchedulesByInterval(
    @Arg("data") data: SchedulesIntervalInput
  ): Promise<Schedule[]> {
    const { dateStart, dateEnd } = data;

    const startTimestamp = Timestamp.fromDate(new Date(dateStart));
    const endTimestamp = Timestamp.fromDate(new Date(dateEnd));

    const snapshot = await this.firestore
      .collection("schedules")
      .where("dateStart", "<=", endTimestamp)
      .where("dateEnd", ">=", startTimestamp)
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
