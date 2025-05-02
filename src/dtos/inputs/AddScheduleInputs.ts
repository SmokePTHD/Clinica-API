import { Field, InputType } from "type-graphql";

@InputType()
export class AddScheduleInputs {
  @Field()
  office: number;

  @Field()
  patient: string;

  @Field()
  dentist: string;

  @Field()
  dateStart: Date;

  @Field()
  dateEnd: Date;

  @Field()
  status: number;
}
