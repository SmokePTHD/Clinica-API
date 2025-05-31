import { InputType, Field } from "type-graphql";

@InputType()
export class ApplyResetPasswordInput {
  @Field()
  token: string;

  @Field()
  password: string;
}
