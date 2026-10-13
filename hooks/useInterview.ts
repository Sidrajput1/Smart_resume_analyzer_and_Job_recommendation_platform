"use client";

import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type InterviewMode = "VIDEO" | "PHONE" | "ONSITE";
export type InterviewStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export type ScheduleInterviewInput = {
  applicationId: string;
  scheduledAt: string; // ISO 8601 with an explicit timezone, typically .toISOString()
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl?: string;
  location?: string;
  notes?: string;
};

export type CandidateInterview = {
  id: string;
  applicationId: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl: string | null;
  location: string | null;
  notes: string | null;
  status: InterviewStatus;
  createdAt: string;
  job: { id: string; title: string; companyName: string };
};

async function readJson(response: Response): Promise<any> {
  try { return await response.json(); } catch { return null; }
}

// async function scheduleInterview(input: ScheduleInterviewInput) {
//   const response = await fetch("/api/recruiter/interviews", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     credentials: "same-origin",
//     body: JSON.stringify(input),
//   });
//   const data = await readJson(response);
//   if (!response.ok) throw new Error(data?.message || "Unable to schedule interview.");
//   return data as { message: string; interview: { id: string; scheduledAt: string } };
// }

async function scheduleInterview(input: ScheduleInterviewInput) {
    const response = await api.post("/recruiter/interviews", input);
   const data = await readJson(response as any);
    // if (!response) throw new Error(data?.message || "Unable to schedule interview.");
   return data as { message: string; interview: { id: string; scheduledAt: string } };
}


export function useScheduleInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scheduleInterview,
    onSuccess: () => {
      // Recruiter candidate query keys vary by app; parent also calls refetch().
      void queryClient.invalidateQueries({ queryKey: ["candidate-interviews"] });
    },
  });
}

export function useCandidateInterviews() {
  return useQuery({
    queryKey: ["candidate-interviews"],
    queryFn: async (): Promise<CandidateInterview[]> => {
      const response = await fetch("/api/candidate/interviews", { credentials: "same-origin", cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to load interviews.");
      return data.interviews as CandidateInterview[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
