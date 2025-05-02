import { InputType, Field } from "type-graphql";

@InputType()
export class SchedulesIntervalInput {
  @Field()
  dateStart: string;

  @Field()
  dateEnd: string;

  @Field()
  office: number;
}

@InputType()
export class DentistSchedulesIntervalInput {
  @Field()
  dateStart: string;

  @Field()
  dateEnd: string;
}
