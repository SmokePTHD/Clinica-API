import { Field, InputType } from "type-graphql";

@InputType()
export class SchedulesChangeStatusInput {
  @Field()
  scheduleId: string;

  @Field()
  newStatus: number;
}

@InputType()
export class FinalizeScheduleInput {
  @Field()
  scheduleId: string;

  @Field()
  price: number;

  @Field()
  paymentMethod: number;

  @Field(() => Number, { nullable: true })
  installments?: number;
}
