import "reflect-metadata";
import dotenv from "dotenv";
import requireAll from "require-all";
import path from "path";
import { ApolloServer } from "apollo-server";
import { buildSchema } from "type-graphql";

import { initializeFirebase } from "./config/firebase";

dotenv.config();

async function startServer() {
  const resolvers = Object.values(
    requireAll({
      dirname: path.join(__dirname, "resolvers"),
      filter: /(.+Resolver)\.(ts)$/, // Suporte para TS e JS (caso uses build)
      resolve: (resolver) => resolver.default || resolver,
    })
  );

  const schema = await buildSchema({ resolvers });

  initializeFirebase();

  const server = new ApolloServer({ schema });

  const { url } = await server.listen(process.env.PORT);
  console.log(`Yup: ${url}`);
}

startServer();
