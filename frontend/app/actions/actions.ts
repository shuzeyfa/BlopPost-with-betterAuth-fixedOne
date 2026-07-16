"use server"

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";

export type AuthFormState = { error: string } | null;

export async function signUpAction(
    prevState: AuthFormState,
    formData: FormData
): Promise<AuthFormState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
                bio: "",
            }
        })
    } catch (error) {
        if (error instanceof APIError) {
            return { error: error.message };
        }
        return { error: "Something went wrong. Please try again." };
    }

    redirect("/")
}

export async function signInAction(
    prevState: AuthFormState,
    formData: FormData
): Promise<AuthFormState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await auth.api.signInEmail({
            body: {
                email,
                password,
            }
        })
    } catch (error) {
        if (error instanceof APIError) {
            return { error: error.message };
        }
        return { error: "Something went wrong. Please try again." };
    }

    redirect("/")
}

export async function signOutAction() {
    await auth.api.signOut({
        headers: await headers()
    })
    
    redirect("/signin")
}