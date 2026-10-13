"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

type UploadPayload = {
  file: File;
  title?: string;
  summary?: string;
  onProgress?: (progress: number) => void;
};

export function useUploadResumeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      title,
      summary,
      onProgress,
    }: UploadPayload) => {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("title", title || "My Resume");
      formData.append("summary", summary || "");

      const { data } = await api.post(
        "/candidate/resume/upload",
        formData,
        {
          // Axios tracks browser-to-Next.js upload progress.
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;

            const progress = Math.min(
              100,
              Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              )
            );

            onProgress?.(progress);
          },
        }
      );

      return data;
    },

    onSuccess: (data) => {
      toast.success(
        data?.message || "Resume uploaded successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["candidate-resume"],
      });
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload resume"
      );
    },
  });
}

// export function useUploadResumeFile() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ file, title, summary }: UploadPayload) => {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("title", title || "My Resume");
//       formData.append("summary", summary || "");

//       const { data } = await api.post("/candidate/resume/upload", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       return data;
//     },

//     onSuccess: (data) => {
//       toast.success(data?.message || "Resume uploaded successfully");
//       queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
//     },
//     onError: (error: any) => {
//       toast.error(
//         error?.response?.data?.message ||
//           error?.message ||
//           "Failed to upload resume",
//       );
//     },
//   });
// }
