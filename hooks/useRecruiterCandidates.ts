"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export function useRecruiterCandidates(search: string = "", status: string = "") {
  return useQuery({
    queryKey: ["recruiter-candidates", search, status],
    queryFn: async () => {
      const { data } = await api.get("/recruiter/candidates", {
        params: {
          search,
          status,
        },
      });
      return data;
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status:
        | "APPLIED"
        | "SHORTLISTED"
        | "INTERVIEW_SCHEDULED"
        | "OFFERED"
        | "HIRED"
        | "REJECTED"
        | "WITHDRAWN";
    }) => {
      const { data } = await api.patch(`/recruiter/candidates/${id}`, {
        status,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Application updated successfully");
      queryClient.invalidateQueries({ queryKey: ["recruiter-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-jobs"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update application"
      );
    },
  });
}