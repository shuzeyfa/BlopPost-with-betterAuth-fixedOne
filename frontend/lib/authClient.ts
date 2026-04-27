import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const authClient = createAuthClient({
  // Use same-origin auth route in both local and deployed environments.
  baseURL: "/api/auth",
  plugins: [inferAdditionalFields<typeof auth>()],
});
