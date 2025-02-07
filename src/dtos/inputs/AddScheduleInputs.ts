import { Field, InputType } from "type-graphql";

@InputType()
export class AddScheduleInputs {
  @Field()
  office: number;

  @Field()
  pacient: string;

  @Field()
  doctor: string;

  @Field()
  dateStart: Date;

  @Field()
  dateEnd: Date;

  @Field()
  note: string;

  @Field()
  status: string;
}
