import { InputType, Field } from "type-graphql";

@InputType()
export class UserFilterInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  nif?: string;

  @Field({ nullable: true })
  role?: string;
}
