import { Field, InputType } from "type-graphql";

@InputType()
export class GetUserProfilePictureInput {
  @Field()
  uid: string;

  @Field()
  role: string;

  @Field()
  sex: string;
}
