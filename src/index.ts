import "reflect-metadata";

import { ApolloServer } from "apollo-server";
import { buildSchema } from "type-graphql";
import { initializeFirebase } from "./config/firebase";

import { AuthEmailResolver } from "./resolvers/AuthEmailResolver";
import dotenv from "dotenv";
import { UserResolver } from "./resolvers/GetUserResolver";

dotenv.config();

async function startServer() {
  const schema = await buildSchema({
    resolvers: [AuthEmailResolver, UserResolver],
  });

  initializeFirebase();

  const server = new ApolloServer({
    schema,
  });

  const { url } = await server.listen(4000);
  console.log(`Yup: ${url}`);
}

startServer();
