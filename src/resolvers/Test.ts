import { Query, Resolver } from "type-graphql";

@Resolver()
class Test {
  @Query(() => String)
  ping(): string {
    return "Estou a ouvir oh burro.";
  }
}

export default Test;
