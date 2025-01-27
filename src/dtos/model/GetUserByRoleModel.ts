import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class GetUserByRole {
    @Field()
    uid: string;

    @Field()
    email: string;

    @Field()
    name: string;
}