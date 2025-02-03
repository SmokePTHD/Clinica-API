import { Field, InputType } from "type-graphql";

@InputType()
export class AddUserInputs {

    @Field()
    address: string;

    @Field()
    birthDate: Date;

    @Field()
    nif: number;

    @Field()
    note: string;

    @Field()
    phone: string;

    @Field()
    name: string;

    @Field()
    email: string;

    @Field()
    role: string;

    @Field()
    sex: string;

    
}