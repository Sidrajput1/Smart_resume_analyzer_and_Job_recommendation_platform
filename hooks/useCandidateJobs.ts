"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export function useCandidateJobs(search: string = "") {
  return useQuery({
    queryKey: ["candidate-jobs", search],
    queryFn: async () => {
      const { data } = await api.get("/candidate/jobs", {
        params: { search },
      });
      return data;
    },
  });
}

export function useApplyJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await api.post(`/candidate/jobs/${jobId}/apply`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Applied successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-jobs"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to apply for job"
      );
    },
  });
}