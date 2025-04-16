import { InputType, Field } from "type-graphql";

@InputType()
export class SchedulesIntervalInput {
  @Field()
  dateStart: string;

  @Field()
  dateEnd: string;
}
