import { ObjectType, Field } from "type-graphql";
import { User } from "./UserModel";

@ObjectType()
export class PaginatedUsersResponse {
  @Field(() => [User])
  users: User[];

  @Field(() => String, { nullable: true })
  lastCursor?: string;
}
