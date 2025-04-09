import "reflect-metadata";
import dotenv from "dotenv";
import { ApolloServer } from "apollo-server";
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

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req }),
    cors: {
      origin: ["https://api.desenvolvimentoclinicarioeste.pt"],
      credentials: true,
    },
  });

  const { url } = await server.listen(process.env.PORT!);
  console.log(`Yup: ${url}`);
}

startServer();
