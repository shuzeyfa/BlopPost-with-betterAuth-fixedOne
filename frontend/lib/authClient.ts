import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const authClient = createAuthClient({
  // No baseURL: defaults to the current origin, so it works on
  // localhost in dev and on Vercel in production.
  plugins: [inferAdditionalFields<typeof auth>()],
});
