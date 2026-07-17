"use server"

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";

export type AuthFormState = { error?: string; success?: string } | null;

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

    // account created — user must verify their email before signing in
    redirect("/verify-email?email=" + encodeURIComponent(email))
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

export async function forgotPasswordAction(
    prevState: AuthFormState,
    formData: FormData
): Promise<AuthFormState> {
    const email = formData.get("email") as string;

    try {
        await auth.api.requestPasswordReset({
            body: {
                email,
                redirectTo: "/reset-password",
            }
        })
    } catch (error) {
        if (error instanceof APIError) {
            return { error: error.message };
        }
        return { error: "Something went wrong. Please try again." };
    }

    // Always show success — don't reveal whether an email is registered
    return { success: "If that email is registered, a reset link is on its way." };
}

export async function resetPasswordAction(
    prevState: AuthFormState,
    formData: FormData
): Promise<AuthFormState> {
    const password = formData.get("password") as string;
    const token = formData.get("token") as string;

    if (!token) {
        return { error: "Invalid or expired reset link. Please request a new one." };
    }

    try {
        await auth.api.resetPassword({
            body: {
                newPassword: password,
                token,
            }
        })
    } catch (error) {
        if (error instanceof APIError) {
            return { error: error.message };
        }
        return { error: "Something went wrong. Please try again." };
    }

    redirect("/signin")
}