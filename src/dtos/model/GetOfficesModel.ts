import { Field, ObjectType } from "type-graphql";

@ObjectType()
class DentistSchedule {
  @Field()
  dentist: string;

  @Field()
  days: string;
}

@ObjectType()
export class GetOffices {
  @Field()
  id: string;

  @Field(() => [DentistSchedule])
  schedule: DentistSchedule[];
}
