import { Field, InputType } from "type-graphql";

@InputType()
export class LoginEmailInput {
  @Field()
  email: string;

  @Field()
  password: string;
}
