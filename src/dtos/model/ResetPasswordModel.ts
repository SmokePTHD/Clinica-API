import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ResetPassword {
  @Field()
  success: boolean;

  @Field()
  message: string;
}
