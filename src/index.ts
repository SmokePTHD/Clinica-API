import "reflect-metadata";
import dotenv from "dotenv";
import { ApolloServer } from "apollo-server";
import { buildSchema } from "type-graphql";
import { initializeFirebase } from "./config/firebase";

import { AuthEmailResolver } from "./resolvers/AuthEmailResolver";
import { ResetUsersPassword } from "./resolvers/ResetPasswordResolver";
import { UserResolver } from "./resolvers/GetUserResolver";
import { GetUsersByRoleResolver } from "./resolvers/GetUsersByRoleResolver";
import { AddNewUserResolver } from "./resolvers/AddNewUserResolver";
import { AddNewScheduleResolver } from "./resolvers/AddNewScheduleResolver";
import { GetUserProfilePictureResolver } from "./resolvers/GetUserProfilePictureResolver";
import { UpdateUserProfileImageResolver } from "./resolvers/UpdateUserProfileImageResolver";

dotenv.config();

async function startServer() {
  const schema = await buildSchema({
    resolvers: [
      AuthEmailResolver,
      UserResolver,
      ResetUsersPassword,
      GetUsersByRoleResolver,
      GetUserProfilePictureResolver,
      AddNewUserResolver,
      AddNewScheduleResolver,
      UpdateUserProfileImageResolver,
    ],
  });

  initializeFirebase();

  const server = new ApolloServer({
    schema,
  });

  const { url } = await server.listen(process.env.PORT);
  console.log(`Yup: ${url}`);
}

startServer();
