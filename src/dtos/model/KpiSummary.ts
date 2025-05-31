import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
export class KpiSummary {
  @Field(() => Int)
  pacientes: number;

  @Field(() => Int)
  consultas: number;

  @Field(() => Int)
  faltas: number;

  @Field(() => Int)
  dentistas: number;

  @Field(() => Int)
  faturacao: number;
}
