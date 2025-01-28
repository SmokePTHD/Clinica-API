import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class AddUserModel {
    @Field()
    success: boolean;

    @Field()
    message: string;
}