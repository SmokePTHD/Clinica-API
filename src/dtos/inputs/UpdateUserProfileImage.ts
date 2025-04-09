import { Field, InputType } from "type-graphql";
import GraphQLUpload from "graphql-upload";

@InputType()
export class UpdateUserProfileImageInputs {
  @Field()
  userid: string;

  @Field(() => GraphQLUpload)
  image: any;
}
