import "reflect-metadata";

import dotenv from "dotenv";

import { ApolloServer } from "apollo-server";
import { buildSchema } from "type-graphql";
import { initializeFirebase } from "./config/firebase";

import { AuthEmailResolver } from "./resolvers/AuthEmailResolver";
import { ResetUsersPassword } from "./resolvers/ResetPasswordResolver";
import { UserResolver } from "./resolvers/GetUserResolver";

dotenv.config();

async function startServer() {
  const schema = await buildSchema({
    resolvers: [AuthEmailResolver, UserResolver, ResetUsersPassword],
  });

  initializeFirebase();

  const server = new ApolloServer({
    schema,
  });

  const { url } = await server.listen(4000);
  console.log(`Yup: ${url}`);
}

startServer();
