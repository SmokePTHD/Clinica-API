import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class UpdateUserProfileImage {
  @Field()
  url: string;
}
