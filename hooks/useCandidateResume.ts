"use client";

import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type CandidateResumePayload = {
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  experienceLevel?: "FRESHER" | "JUNIOR" | "MID_LEVEL" | "SENIOR" | "LEAD";
  resumeTitle?: string | null;
  resumeSummary?: string | null;
};

export function useCandidateResume(){
    return useQuery({
        queryKey:["candidate-resume"],
        queryFn:async() => {
            const {data} = await api.get("/candidate/resume");
            return data;
        },
    });
};


export function useUpdateCandidateResume(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn:async(payload:CandidateResumePayload) => {
            const {data} = await api.patch("/candidate/resume",payload);
            return data;
        },

        onSuccess:(data) => {
            toast.success(data?.message || "resume update successfully")
            queryClient.invalidateQueries({queryKey:["candidate-resume"]});
        },
        onError:(error:any) => {
            toast.error(
        error?.response?.data?.message || error?.message || "Something went wrong"
      );
        }
    })
}
