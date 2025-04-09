import { Query, Resolver, UseMiddleware, Ctx } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";
import { GetOffices } from "../dtos/model/GetOfficesModel";
import { AuthFirebase } from "../middleware/AuthFirebase";
import { MyContext } from "../types/MyContext";

@Resolver()
export class GetOfficesResolver {
  private firestore = getFirestore();

  @Query(() => [GetOffices])
  @UseMiddleware(AuthFirebase)
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
