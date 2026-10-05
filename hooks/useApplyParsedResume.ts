"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/api";
import type { ParsedResumeData } from "@/types/resume-parser";

interface ApplyParsedResumeResponse {
  message: string;
  candidate: {
    id: string;
    headline: string | null;
    bio: string | null;
  };
}

interface ApplyParsedResumeInput {
  data: ParsedResumeData;
}

async function applyParsedResume(
  input: ApplyParsedResumeInput,
) {
  const response =
    await api.post<ApplyParsedResumeResponse>(
      "/candidate/resume/apply-extracted-data",
      input,
    );

  return response.data;
}

export function useApplyParsedResume() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: applyParsedResume,

    onSuccess: async (response) => {
      toast.success(
        response.message ||
          "Profile updated successfully",
      );

      /*
       * Refetch the candidate profile/resume
       * after the database transaction succeeds.
       *
       * We are using a broad invalidation for now
       * because the existing useCandidateResume query
       * key is not part of this component.
       */
      await queryClient.invalidateQueries();
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ??
        "Failed to save extracted information";

      toast.error(message);
    },
  });
}