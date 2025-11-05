

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db, client } from "@/app/db" // your mongodb client
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
    database: mongodbAdapter(db, {
        client
    }),
    emailAndPassword: { 
        enabled: true, 
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
    trustedOrigins: ["https://blop-post-with-better-auth-fixed-on.vercel.app"],
});