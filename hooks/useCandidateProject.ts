"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

type ProjectPayload = {
  title: string;
  description?: string | null;
  technologies?: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export function useCandidateProjects() {
  return useQuery({
    queryKey: ["candidate-projects"],
    queryFn: async () => {
      const { data } = await api.get("/candidate/projects");
      return data;
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectPayload) => {
      const { data } = await api.post("/candidate/projects", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Project added successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-projects"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Failed to add project",
      );
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProjectPayload }) => {
      const { data } = await api.patch(`/candidate/projects/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Project updated successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-projects"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Failed to update project",
      );
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/candidate/projects/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-projects"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Unable to delete project",
      );
    },
  });
}
