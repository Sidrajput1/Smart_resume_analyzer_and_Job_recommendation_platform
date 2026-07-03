import axios from "axios";
import { headers } from "next/headers";



const aiApi = axios.create({
    baseURL : process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8001",
    headers:{
        "Content-Type":"application/json"
    }
});

type JobMatchItem = {
  jobId: string;
  title: string;
  description: string;
  companyName?: string;
  responsibilities?: string;
  benefits?: string;
  jobType?: string;
  workMode?: string;
  location?: string;
  skills: string[];
};


type CandidateRankItem = {
  candidateId: string;
  name: string;
  headline?: string;
  resumeText: string;
  skills: string[];
  recommendedRoles: string[];
  location?: string;
};

export async function matchJobsForResume(
    resumeText:string,
    jobs:JobMatchItem[]
){

    try {
        const {data} = await aiApi.post("/match-jobs",{
            resumeText,
            jobs
        });

        return data?.result ?? null
    } catch (error) {
        console.error("matchJobsForResume failed",error);
        return null;
    }

};

export async function rankCandidatesForJob(jobText:string, candidates:CandidateRankItem[]){
    try {
        const {data} = await aiApi.post("/rank-candidates",{
            jobText,
            candidates
        });

        return data?.result ?? null
    } catch (error) {
        console.error("rankcandidateforjob failed",error);
        return null;
    }
}