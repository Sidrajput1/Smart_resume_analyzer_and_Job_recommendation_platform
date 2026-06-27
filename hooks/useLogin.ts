"use client";

import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

type LoginPayload = {
  email: string;
  password: string;
};

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const result = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Signed in successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed");
    },
  });
}
