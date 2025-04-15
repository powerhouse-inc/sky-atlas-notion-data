import path from "path";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { existsSync } from "node:fs";

/**
 * Handle environment variables
 * 
 * This function sets the NODE_ENV to 'development' if it is not set.
 * It then loads the environment variables from the appropriate files based on the NODE_ENV.
 */
export function handleEnv() {
  // Default NODE_ENV to 'development' if not set
  process.env.NODE_ENV ||= "development";

  const cwd = process.cwd();
  const { NODE_ENV } = process.env;

  const envFiles = [
    `.env.${NODE_ENV}.local`,
    ...(NODE_ENV === "development" ? [`.env.local`] : []),
    `.env.${NODE_ENV}`,
    `.env`,
  ];

  for (const file of envFiles) {
    const fullPath = path.join(cwd, file);
    if (existsSync(fullPath)) {
      const env = dotenv.config({ path: fullPath });
      dotenvExpand.expand(env);
    }
  }
}
