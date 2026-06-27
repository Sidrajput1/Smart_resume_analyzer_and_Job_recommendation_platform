"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

type EducationPayload = {
  institutionName: string;
  degree: string;
  fieldOfStudy?: string | null;
  grade?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrentlyStudying?: boolean;
};

export function useCandidateEducations(){
    return useQuery({
        queryKey:["candidate-educations"],
        queryFn: async () => {
            const {data} = await api.get("/candidate/education")
            return data;
        }
    })
};

export function useCreateEducation(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async(payload:EducationPayload) => {
            const {data} = await api.post("/candidate/education",payload);
            return data;
        },
        onSuccess:(data) => {
            toast.success(data?.message || "Education creation done!")
            queryClient.invalidateQueries({
                queryKey:["candidate-educations"],
            });
            queryClient.invalidateQueries({
                queryKey:["candidate-resume"]
            })
        },
        onError:(error:any) => {
             toast.error(
            error?.response?.data?.message || error?.message || "Something went wrong"
        );
        }
    })
};


// custom hooks for updation

export function useUpdateEducation(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async({id,payload,}:{id:string,payload:EducationPayload}) => {
            const {data} = await api.patch(`/candidat/education/${id}`,payload);
            return data;
        },
        onSuccess:(data) => {
            toast.success(data?.message || "Education Updation done!");
            queryClient.invalidateQueries({
                queryKey:["candidate-educations"]
            });
             queryClient.invalidateQueries({
                queryKey:["candidate-resume"]
            })
        },

        onError:(error:any) => {
             toast.error(
        error?.response?.data?.message || error?.message || "Something went wrong"
      );
        }
    })
};


// and this is for deletion

export function useDeleteEducation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/candidate/education/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Education deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["candidate-educations"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-resume"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Something went wrong"
      );
    },
  });
}