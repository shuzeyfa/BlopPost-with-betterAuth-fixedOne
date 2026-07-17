import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db, client } from "@/app/db"; // your mongodb client
import { nextCookies } from "better-auth/next-js";
import { sendVerificationEmail, sendResetPasswordEmail } from "./email";

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 hour
  },
  plugins: [nextCookies()], // make sure this is the last plugin in the array
  user: {
    additionalFields: {
      bio: {
        type: "string",
        default: "",
      },
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://blop-post-with-better-auth-fixed-on.vercel.app",
  ],
});
