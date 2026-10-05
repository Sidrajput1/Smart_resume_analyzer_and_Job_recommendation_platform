"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

type CandidateSkillPayload = {
  name: string;
  proficiencyLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  yearsOfExperience?: number | null;
  isPrimary?: boolean;
  notes?: string | null;
};

export function useCandidateSkills() {
  return useQuery({
    queryKey: ["candidate-skills"],
    queryFn: async () => {
      const { data } = await api.get("/candidate/skills");
      return data;
    },
  });
}

export function useAddCandidateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CandidateSkillPayload) => {
      const { data } = await api.post("/candidate/skills", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Skill added successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-skills"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Unable to add skill",
      );
    },
  });
}

export function useUpdateCandidateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Omit<CandidateSkillPayload, "name"> }) => {
      const { data } = await api.patch(`/candidate/skills/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Skill updated successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-skills"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Failed to update skill",
      );
    },
  });
}

export function useDeleteCandidateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/candidate/skills/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Skill removed successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-skills"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Unable to remove skill",
      );
    },
  });
}
