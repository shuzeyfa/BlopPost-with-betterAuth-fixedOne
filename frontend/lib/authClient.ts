import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

const authBaseUrl =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [inferAdditionalFields<typeof auth>()],
});
