"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export function useGenerateCandidateIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/candidate/intelligence/generate");
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Candidate intelligence generated successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to generate candidate intelligence"
      );
    },
  });
}