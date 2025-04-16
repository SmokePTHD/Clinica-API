import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Schedule {
    @Field()
    dateStart: string;
    
    @Field()
    dateEnd: string;
    
    @Field()
    office: number;

    @Field()
    patient: string;

    @Field()
    dentist: string;
    
    @Field()
    status: string;
}
