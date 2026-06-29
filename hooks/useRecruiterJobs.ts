"use client";

import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type JobPayload = {
  title: string;
  description: string;
  responsibilities?: string | null;
  benefits?: string | null;
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "FREELANCE" | "TEMPORARY";
  workMode: "ONSITE" | "REMOTE" | "HYBRID";
  experienceLevel?: "FRESHER" | "JUNIOR" | "MID_LEVEL" | "SENIOR" | "LEAD" | null;
  locationCity?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
  requiredExperienceYears?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  applicationDeadline?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "ARCHIVED";
  skills?: string[];
};


export function useRecruiterJobs(search:string = ""){
    return useQuery({
        queryKey:["recruiter-jobs",search],
        queryFn: async() => {
            const {data} = await api.get("/recruiter/jobs",{
                params:{search},
            });

            return data;
        },
    });

};

export function useCreateRecruiterJobs(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn:async(payload:JobPayload) => {
            const {data} = await api.post("/recruiter/jobs",payload);
            return data;
        },
        onSuccess:(data) => {
            toast.success(data?.message || "Job created succesfully");
            queryClient.invalidateQueries({queryKey :["recruiter-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["candidate-jobs"] });
        },
        onError:(error:any)=>{
            toast.error(
        error?.response?.data?.message || error?.message || "Failed to create job"
      );
        },
    })
};


export function useUpdaterecruiterJobs(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn:async({id,payload}:{id:string,payload:Partial<JobPayload>}) => {
            const {data} = await api.post(`/recruiter/jobs/${id}`,payload);
            return data;
        },
        onSuccess: (data) => {
      toast.success(data?.message || "Job updated successfully");
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-jobs"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to update job"
      );
    },
    })
};


export function useDeleteRecruiterJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/recruiter/jobs/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Job deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-jobs"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to delete job"
      );
    },
  });
};