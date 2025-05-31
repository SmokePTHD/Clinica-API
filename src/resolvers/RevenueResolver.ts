import { Arg, Query, Resolver } from "type-graphql";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import moment from "moment";

@Resolver()
export class RevenueResolver {
  private firestore = getFirestore();

  @Query(() => Number)
  async getDailyRevenue(@Arg("date") date: string): Promise<number> {
    const doc = await this.firestore.collection("revenues").doc(date).get();
    if (!doc.exists) return 0;
    return doc.data()?.total || 0;
  }

  @Query(() => Number)
  async getMonthlyRevenue(
    @Arg("month") month: number,
    @Arg("year") year: number
  ): Promise<number> {
    const start = moment().year(year).month(month).startOf("month");
    const end = moment().year(year).month(month).endOf("month");

    let total = 0;
    const daysInMonth = end.date();

    for (let i = 1; i <= daysInMonth; i++) {
      const day = start.clone().date(i).format("YYYY-MM-DD");
      const doc = await this.firestore.collection("revenues").doc(day).get();
      if (doc.exists) {
        total += doc.data()?.total || 0;
      }
    }

    return total;
  }

  @Query(() => Number)
  async getMonthlyRevenueByDentist(
    @Arg("month") month: number,
    @Arg("year") year: number,
    @Arg("dentistUid") dentistUid: string
  ): Promise<number> {
    const start = moment().year(year).month(month).startOf("month");
    const end = moment().year(year).month(month).endOf("month");

    let total = 0;
    const daysInMonth = end.date();

    for (let i = 1; i <= daysInMonth; i++) {
      const day = start.clone().date(i).format("YYYY-MM-DD");
      const doc = await this.firestore.collection("revenues").doc(day).get();
      if (doc.exists) {
        const dentists = doc.data()?.dentists || {};
        total += dentists[dentistUid] || 0;
      }
    }

    return total;
  }
}
