"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

type CertificationPayload = {
  title: string;
  issuer: string;
  credentialId?: string | null;
  credentialUrl?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
};

export function useCandidateCertifications() {
  return useQuery({
    queryKey: ["candidate-certifications"],
    queryFn: async () => {
      const { data } = await api.get("/candidate/certifications");
      return data;
    },
  });
}

export function useCreateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CertificationPayload) => {
      const { data } = await api.post("/candidate/certifications", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Certification added successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-certifications"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Failed to add certification",
      );
    },
  });
}

export function useUpdateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CertificationPayload }) => {
      const { data } = await api.patch(`/candidate/certifications/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Certification updated successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-certifications"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Failed to update certification",
      );
    },
  });
}

export function useDeleteCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/candidate/certifications/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Certification deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-certifications"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || apiError?.message || "Unable to delete certification",
      );
    },
  });
}
