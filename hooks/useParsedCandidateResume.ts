"use client";

import { useMutation } from "@tanstack/react-query";
import {toast} from "sonner"

import api from "@/lib/api"
import type { ParsedResumeResponse } from "@/types/resume-parser";

interface ParseResumeApiResponse {
  message: string;
  data: ParsedResumeResponse;
}

async function parseCandidateResume() {
  const response =
    await api.post<ParseResumeApiResponse>(
      "/candidate/resume/parse",
    );

  return response.data;
}

export function useParseCandidateResume() {
  return useMutation({
    mutationFn: parseCandidateResume,

    onSuccess: (response) => {
      toast.success(
        response.message ||
          "Resume parsed successfully",
      );
      console.log("Parsed resume:",response.data)
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ??
        "Failed to parse resume";

      toast.error(message);
    },
  });
}