import { Field, InputType } from "type-graphql";

@InputType()
export class AddUserInputs {
  @Field()
  birthDate: Date;

  @Field()
  nif: number;

  @Field({ nullable: true })
  iban: string;

  @Field()
  phone: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  role: string;

  @Field()
  sex: string;

  @Field({ nullable: true })
  percentage: number;

  @Field({ nullable: true })
  salary: number;
}
