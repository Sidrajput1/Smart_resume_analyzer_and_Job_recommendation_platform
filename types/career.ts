export type Intelligence = {
  overallScore: number;
  atsScore: number;
  skillScore: number;
  experienceScore: number;
  educationScore: number;
  projectScore: number;
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  recommendedRoles: string[];
  summary?: string | null;
  suggestions?: string | null;
  generatedAt: string;
  updatedAt?: string;
  modelVersion?: string | null;
};
export type CandidateProfile = {
  id: string;
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  resume?: {
    id: string;
    title: string;
    summary?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    status: string;
    parsedAt?: string | null;
    updatedAt: string;
    extractedText?: string | null;
  } | null;
  intelligence?: Intelligence | null;
  candidateSkills: {
    id: string;
    skill: { name: string; category?: string | null };
    notes?: string | null;
  }[];
  experiences: {
    id: string;
    jobTitle: string;
    companyName: string;
    description?: string | null;
    responsibilities?: string | null;
  }[];
  projects: {
    id: string;
    title: string;
    technologies?: string | null;
    description?: string | null;
  }[];
  educations: {
    id: string;
    degree: string;
    institutionName: string;
    fieldOfStudy?: string | null;
    description?: string | null;
  }[];
  certifications: { id: string; title: string; issuer: string }[];
};
export type Opportunity = {
  id: string;
  title: string;
  description: string;
  jobType: string;
  workMode: string;
  locationCity?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  company: { name: string; industry?: string | null; logo?: string | null };
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
  isApplied: boolean;
  applicationStatus?: string | null;
  applicationDeadline?: string | null;
  publishedAt?: string | null;
};
export type RecruiterJob = {
  id: string;
  title: string;
  description: string;
  status: string;
  workMode: string;
  applicantsCount: number;
  skills: string[];
  createdAt: string;
};
export type TalentApplication = {
  id: string;
  status: string;
  appliedAt: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  job: { id: string; title: string; companyName: string };
  candidate: {
    name: string;
    headline?: string | null;
    skills: string[];
    experienceCount: number;
    educationCount: number;
    projectCount: number;
  };
};
