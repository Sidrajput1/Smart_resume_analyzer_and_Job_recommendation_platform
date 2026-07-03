"use client";

import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCandidateApplications(){
    return useQuery({
        queryKey:["candidate-applications"],
        queryFn: async() => {
            const {data} = await api.get("/candidate/applications-track");
            return data;
        }
    })
};

// Hook for withdrawing applications

export function useWithdrawApplications(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id:string) => {
            const {data} = await api.post(`/candidate/applications-track/${id}/withdraw`);
            return data;
        },
        onSuccess:(data) => {
             toast.success(data?.message || "Application withdrawn successfully");
             queryClient.invalidateQueries({queryKey:["candidate-applications"]});
             queryClient.invalidateQueries({queryKey:["candidate-jobs"]});
        },
         onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to withdraw application"
      );
    },
    })
}