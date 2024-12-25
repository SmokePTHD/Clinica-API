import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class User {
  @Field()
  uid: string;

  @Field()
  address: string;

  @Field(() => Date, { nullable: true })
  birthDate: Date | null;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  nif: number;

  @Field({ nullable: true })
  note: string;

  @Field()
  phone: string;

  @Field()
  role: string;

  @Field()
  sex: string;

  @Field()
  status: string;
}
