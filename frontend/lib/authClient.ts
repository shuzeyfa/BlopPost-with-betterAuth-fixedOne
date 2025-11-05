import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: "https://blop-post-with-better-auth-fixed-on.vercel.app", // ✅ must start with a slash!
  plugins: [inferAdditionalFields<typeof auth>()],
});