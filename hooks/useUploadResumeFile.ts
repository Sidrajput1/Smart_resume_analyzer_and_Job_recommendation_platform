"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

type UploadPayload = {
  file: File;
  title?: string;
  summary?: string;
};

export function useUploadResumeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, title, summary }: UploadPayload) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || "My Resume");
      formData.append("summary", summary || "");

      const { data } = await api.post("/candidate/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data;
    },

    onSuccess: (data) => {
      toast.success(data?.message || "Resume uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload resume",
      );
    },
  });
}
