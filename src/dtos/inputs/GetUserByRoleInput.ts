import { Field, InputType } from "type-graphql";

@InputType()
export class GetUserByRoleInput {
    @Field()
    role: string;
}