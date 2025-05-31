import { Field, InputType } from "type-graphql";

@InputType()
export class ResetPasswordInput {
  @Field()
  email: string;
}

@InputType()
export class ApplyResetPasswordInput {
  @Field()
  token: string;

  @Field()
  password: string;
}
