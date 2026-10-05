export interface ParsedPersonalInfo {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  location: string | null;
}

export interface ParsedEducation {
  institution: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
}

export interface ParsedExperience {
  company: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  responsibilities: string[];
}

export interface ParsedProject {
  title: string;
  description: string | null;
  technologies: string[];
}

export interface ParsedCertification {
  title: string;
  issuer: string | null;
  date: string | null;
}

export interface ParsedResumeData {
  personal: ParsedPersonalInfo;
  summary: string | null;
  education: ParsedEducation[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
  skills: string[];
  certifications: ParsedCertification[];
  achievements: string[];
}

export interface ParsedResumeResponse {
  fileName: string;
  fileType: string;
  rawText: string;
  cleanedText: string;
  wordCount: number;
  lineCount: number;
  sectionsFound: string[];
  sectionData: Record<string, string[]>;
  structuredData: ParsedResumeData;
  hasEmail: boolean;
  hasPhone: boolean;
}