import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Holiday {
  @Field()
  title: string;

  @Field()
  date: string; 
}
