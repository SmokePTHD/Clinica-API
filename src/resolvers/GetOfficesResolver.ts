import { Query, Resolver, UseMiddleware, Ctx } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";

import { GetOffices } from "../dtos/model/GetOfficesModel";

import { RoleGuard } from "../middleware/RoleGuard";
import { MyContext } from "../types/MyContext";

@Resolver()
export class GetOfficesResolver {
  private firestore = getFirestore();

  @Query(() => [GetOffices])
  @UseMiddleware(RoleGuard(["recepsionist", "manager", "ceo"]))
  async getOffices(@Ctx() context: MyContext): Promise<GetOffices[]> {
    const officesRef = this.firestore.collection("offices");
    const snapshot = await officesRef.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        schedule: data.schedule
          ? data.schedule.map((item: any) => ({
              dentist: item.dentist,
              days: item.days,
            }))
          : [],
      };
    });
  }
}

export default GetOfficesResolver;
