import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class UserNameResponse {
  @Field()
  uid: string;

  @Field()
  name: string;
}
