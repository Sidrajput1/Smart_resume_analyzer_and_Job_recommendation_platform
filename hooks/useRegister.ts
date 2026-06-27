"use client";

import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type RegisterPayload = 
     | {
      role: "CANDIDATE";
      name: string;
      email: string;
      password: string;
    }
  | {
      role: "RECRUITER";
      name: string;
      email: string;
      password: string;
      companyName: string;
      designation?: string;
      phone?: string;
    };

  
    function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const err = error as any;
    return err?.response?.data?.message || "Something went wrong";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}



export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await api.post("/auth/register", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Account created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// async function registerUser(payload:RegisterPayload){
//     const res = await api.post("/auth/register",payload);

//     if (res.data.status != 201) {
//     throw new Error(res?.data?.message || "Registration failed");
//   }
// };

// export function useRegister() {
//     return useMutation({
//         mutationFn:registerUser
//     })
// }