"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

type ExperiencePayload = {
  companyName: string;
  jobTitle: string;
  employmentType?: string | null;
  location?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
};

export function useCandidateExperiences() {
  return useQuery({
    queryKey: ["candidate-experiences"],
    queryFn: async () => {
      const { data } = await api.get("/candidate/experience");
      return data;
    },
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExperiencePayload) => {
      const { data } = await api.post("/candidate/experience", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Experience added successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Failed to add experience",
      );
    },
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ExperiencePayload }) => {
      const { data } = await api.patch(`/candidate/experience/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Experience updated successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Failed to update experience",
      );
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/candidate/experience/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Experience deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Unable to delete experience",
      );
    },
  });
}
