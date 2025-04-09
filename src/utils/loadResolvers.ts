import path from "path";
import { readdirSync } from "fs";

export function loadResolvers(): Function[] {
  const resolvers: Function[] = [];

  const dir = __dirname.includes("dist")
    ? path.join(__dirname, "../resolvers")
    : path.join(__dirname, "./../resolvers");
     

  for (const file of readdirSync(dir)) {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      const resolver = require(path.join(dir, file));
      const values = Object.values(resolver);

      values.forEach((v) => {
        if (typeof v === "function") {
          resolvers.push(v);
        }
      });
    }
  }

  return resolvers;
}
