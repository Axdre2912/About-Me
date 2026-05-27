"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type LoginState = { error?: string } | undefined;

export async function loginWithCredentials(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/",
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password" };
      }
      return { error: "Sign in failed. Please try again." };
    }
    console.error("[login]", error);
    return { error: "Sign in failed. Please try again." };
  }

  return undefined;
}
