import { Query, Resolver } from "type-graphql";

@Resolver()
export class GetOfficesResolver {
  @Query()
  async GetOffices() {}
}
