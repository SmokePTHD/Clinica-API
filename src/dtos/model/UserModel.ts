import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class User {
  @Field()
  uid: string;

  @Field()
  address: string;

  @Field()
  birthDate: Date;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  cc: string;

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

  @Field()
  profileImage: string;
}
