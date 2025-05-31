import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { initializeFirebase } from "./config/firebase";
import { loadResolvers } from "./utils/loadResolvers";
import { AuthFirebase } from "./middleware/AuthFirebase";

import Test from "./resolvers/Test";
import AuthResolver from "./resolvers/AuthResolver";

dotenv.config();

const isDev = process.env.NODE_ENV !== "production";

const publicOperations = [
  "login",
  "loginWithGoogle",
  "loginWithFacebook",
  "getGoogleAuthUrl",
  "linkGoogleAccount",
  "linkFacebookAccount",
];

async function startServer() {
  const schema = await buildSchema({
    resolvers: [Test, AuthResolver, ...loadResolvers()],
    globalMiddlewares: isDev
      ? []
      : [
          async (resolverData, next) => {
            const { info } = resolverData;
            if (publicOperations.includes(info.fieldName)) {
              return next();
            }
            return AuthFirebase(resolverData, next);
          },
        ],
    validate: false,
  });

  initializeFirebase();

  const app = express();

  app.use("/images", express.static(path.join(__dirname, "..", "uploads/app")));

  app.use((req, res, next) => {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://api.desenvolvimentoclinicarioeste.pt"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req }),
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  const PORT = process.env.PORT!;
  app.listen(PORT, () => {
    console.log(`Yup: https://api.desenvolvimentoclinicarioeste.pt/graphql`);
  });
}

startServer();
