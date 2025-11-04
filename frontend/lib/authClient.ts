import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // ✅ must start with a slash!
  plugins: [inferAdditionalFields<typeof auth>()],
});