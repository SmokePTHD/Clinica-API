import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class AddScheduleModel {
  @Field()
  success: boolean;

  @Field()
  message: string;
  
  @Field()
  id: string;
}
