"use client";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCandidateResume,
  useUpdateCandidateResume,
} from "@/hooks/useCandidateResume";
import {
  BrainCircuit,
  FileText,
  GraduationCap,
  BriefcaseBusiness,
  Rocket,
  Sparkles,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import { Upload, FileUp, Download } from "lucide-react";
import EducationCandidate from "./EducationCandidate";
import { useUploadResumeFile } from "@/hooks/useUploadResumeFile";
import { useGenerateCandidateIntelligence } from "@/hooks/useGeneralCandidateIntelligence";
import { useParseCandidateResume } from "@/hooks/useParsedCandidateResume";
import type { ParsedResumeData } from "@/types/resume-parser";
import { ResumeExtractedData } from "./ResumeExtractedData";
import { useApplyParsedResume } from "@/hooks/useApplyParsedResume";
import { EditableExtractedResume } from "./EditableExtractedResume";
import ProfileSections from "./ProfileSections";

function CandidateResumeClient() {
  const { data, isLoading } = useCandidateResume();
  const updateMutation = useUpdateCandidateResume();
  const generalIntelligenceMutation = useGenerateCandidateIntelligence();

  const candidate = data?.candidate;
  const resume = candidate?.resume;

  const intelligence = candidate?.intelligence;

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeTitle, setResumeTitle] = useState("");
  const [resumeSummary, setResumeSummary] = useState("");

  // state for resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const uploadMutation = useUploadResumeFile();

  const parseMutation = useParseCandidateResume();

  const applyParsedResumeMutation = useApplyParsedResume();

  const [parsedResume, setParsedResume] = useState<ParsedResumeData | null>(
    null,
  );

  console.log("Parsed resume here:", parsedResume);

  useEffect(() => {
    if (!candidate) return;

    setHeadline(candidate.headline ?? "");
    setBio(candidate.bio ?? "");
    setPhone(candidate.phone ?? "");
    setCity(candidate.city ?? "");
    setState(candidate.state ?? "");
    setCountry(candidate.country ?? "");
    setLinkedinUrl(candidate.linkedinUrl ?? "");
    setGithubUrl(candidate.githubUrl ?? "");
    setPortfolioUrl(candidate.portfolioUrl ?? "");
    setResumeTitle(resume?.title ?? "");
    setResumeSummary(resume?.summary ?? "");
  }, [candidate, resume]);

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await updateMutation.mutateAsync({
      headline,
      bio,
      phone,
      city,
      state,
      country,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      resumeTitle,
      resumeSummary,
    });
  }

  async function handleUploadResume() {
    if (!resumeFile) return;

    await uploadMutation.mutateAsync({
      file: resumeFile,
      title: resumeTitle || "My Resume",
      summary: resumeSummary || "",
    });
    setParsedResume(null);
    setResumeFile(null);
  }

  async function handleApplyParsedResume(extractedData: ParsedResumeData) {
    await applyParsedResumeMutation.mutateAsync({
      data: extractedData,
    });

    setParsedResume(null);
  }

  if (isLoading) {
    return <ResumeSkeleton />;
  }
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<FileText className="h-5 w-5 text-indigo-300" />}
          title="Resume Status"
          value={resume?.status ?? "DRAFT"}
          desc="Current resume state"
        />
        <MetricCard
          icon={<Sparkles className="h-5 w-5 text-indigo-300" />}
          title="Candidate Score"
          value={intelligence?.atsScore}
          desc="AI profile will come next"
        />
        <MetricCard
          icon={<BrainCircuit className="h-5 w-5 text-indigo-300" />}
          title="AI Profile"
          value="Pending"
          desc="Candidate Intelligence Profile"
        />
      </section>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-cyan-700 ">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Candidate Profile</CardTitle>
              <CardDescription className="text-slate-300">
                Update your basic information and professional identity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Headline"
                    value={headline}
                    onChange={setHeadline}
                    placeholder="Full Stack Developer"
                  />
                  <Field
                    label="Phone"
                    value={phone}
                    onChange={setPhone}
                    placeholder="9876543210"
                  />
                  <Field
                    label="City"
                    value={city}
                    onChange={setCity}
                    placeholder="Patna"
                  />
                  <Field
                    label="State"
                    value={state}
                    onChange={setState}
                    placeholder="Bihar"
                  />
                  <Field
                    label="Country"
                    value={country}
                    onChange={setCountry}
                    placeholder="India"
                  />
                  <Field
                    label="LinkedIn URL"
                    value={linkedinUrl}
                    onChange={setLinkedinUrl}
                    placeholder="https://linkedin.com/in/..."
                  />
                  <Field
                    label="GitHub URL"
                    value={githubUrl}
                    onChange={setGithubUrl}
                    placeholder="https://github.com/..."
                  />
                  <Field
                    label="Portfolio URL"
                    value={portfolioUrl}
                    onChange={setPortfolioUrl}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a short professional summary..."
                    className="min-h-32 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-indigo-500 text-white transition-all duration-300 hover:bg-indigo-400"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resume" className="">
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-lg font-semibold">Resume File Upload</p>
                <p className="text-sm text-slate-300">
                  Upload your main resume in PDF or DOCX format. Max size: 5MB.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="border-white/10 bg-white/10 text-white file:border-0 file:bg-indigo-500 file:text-white"
                />

                <Button
                  type="button"
                  onClick={handleUploadResume}
                  disabled={!resumeFile || uploadMutation.isPending}
                  className="bg-indigo-500 text-white hover:bg-indigo-400"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload Resume"}
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4">
              {/* {resume?.fileUrl ? (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {resume.fileName || "Uploaded Resume"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {resume.mimeType || "Unknown type"} •{" "}
                      {resume.fileSize
                        ? `${Math.round(resume.fileSize / 1024)} KB`
                        : "Size unknown"}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <a href={resume.fileUrl} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Open File
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  No resume uploaded yet. Upload your file to begin AI parsing
                  later.
                </div>
              )} */}
              {resume?.fileUrl && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">Resume Information</p>

                    <p className="text-sm text-slate-400">
                      Extract education, experience, skills and other
                      information from your uploaded resume.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() =>
                      parseMutation.mutate(undefined, {
                        onSuccess: (response) => {
                          setParsedResume(response.data.structuredData);
                        },
                      })
                    }
                    disabled={parseMutation.isPending}
                    className="bg-indigo-500 text-white hover:bg-indigo-400"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />

                    {parseMutation.isPending
                      ? "Parsing Resume..."
                      : "Parse Resume"}
                  </Button>
                </div>
              )}
            </div>

            {/* {parsedResume && (
              <div className="mt-6">
                <ResumeExtractedData data={parsedResume} />
              </div>
            )} */}
            {parsedResume && (
              <div className="mt-6">
                <EditableExtractedResume
                  data={parsedResume}
                  onSave={handleApplyParsedResume}
                  isSaving={applyParsedResumeMutation.isPending}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sections">
          {/* <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Resume Sections</CardTitle>
              <CardDescription className="text-slate-300">
                We will add full CRUD for these sections next.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SectionCard icon={<GraduationCap />} title="Education" desc="College, degree, marks, dates" />
              <SectionCard icon={<BriefcaseBusiness />} title="Experience" desc="Company, role, dates, responsibilities" />
              <SectionCard icon={<Rocket />} title="Projects" desc="GitHub, live link, technologies" />
              <SectionCard icon={<Sparkles />} title="Certifications" desc="Issuer, issue date, credential" />
              <SectionCard icon={<BrainCircuit />} title="Skills" desc="Skill master and proficiency" />
            </CardContent>
          </Card> */}
          {/* <EducationCandidate /> */}
          <ProfileSections />
        </TabsContent>

        <TabsContent value="preview">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Candidate Intelligence Profile</CardTitle>
                <CardDescription className="text-slate-300">
                  AI-generated analysis of your resume and career profile.
                </CardDescription>
              </div>

              <Button
                type="button"
                onClick={() => generalIntelligenceMutation.mutate()}
                disabled={
                  !resume?.fileUrl || generalIntelligenceMutation.isPending
                }
                className="bg-indigo-500 text-white hover:bg-indigo-400"
              >
                {generalIntelligenceMutation.isPending
                  ? "Generating..."
                  : intelligence
                    ? "Regenerate Intelligence"
                    : "Generate Intelligence"}
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PreviewStat
                  label="Overall Score"
                  value={
                    intelligence ? String(intelligence.overallScore) : "--"
                  }
                />
                <PreviewStat
                  label="ATS Score"
                  value={intelligence ? String(intelligence.atsScore) : "--"}
                />
                <PreviewStat
                  label="Skill Score"
                  value={intelligence ? String(intelligence.skillScore) : "--"}
                />
                <PreviewStat
                  label="Experience Score"
                  value={
                    intelligence ? String(intelligence.experienceScore) : "--"
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PreviewStat
                  label="Education Score"
                  value={
                    intelligence ? String(intelligence.educationScore) : "--"
                  }
                />
                <PreviewStat
                  label="Project Score"
                  value={
                    intelligence ? String(intelligence.projectScore) : "--"
                  }
                />
              </div>

              <Separator className="bg-white/10" />

              <div className="grid gap-4 lg:grid-cols-2">
                <ListPanel
                  title="Strengths"
                  items={intelligence?.strengths ?? []}
                  emptyText="Generate the profile to see strengths."
                  variant="green"
                />
                <ListPanel
                  title="Weaknesses"
                  items={intelligence?.weaknesses ?? []}
                  emptyText="Generate the profile to see weaknesses."
                  variant="red"
                />
                <ListPanel
                  title="Recommended Roles"
                  items={intelligence?.recommendedRoles ?? []}
                  emptyText="Generate the profile to see recommended roles."
                  variant="blue"
                />
                <ListPanel
                  title="Skill Gaps"
                  items={intelligence?.skillGaps ?? []}
                  emptyText="This will become more accurate after job matching."
                  variant="amber"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-sm font-medium text-slate-200">
                  AI Summary
                </p>
                <p className="text-sm text-slate-300">
                  {intelligence?.summary ||
                    "Generate the Candidate Intelligence Profile to see your AI summary."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-sm font-medium text-slate-200">
                  Suggestions
                </p>
                <p className="whitespace-pre-line text-sm text-slate-300">
                  {intelligence?.suggestions ||
                    "Add resume data and generate the profile to get improvement suggestions."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
      />
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-white backdrop-blur transition duration-300 hover:-translate-y-1">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-2xl bg-white/10 p-3">{icon}</div>
        <div>
          <p className="text-sm text-slate-300">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-slate-400">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
      <div className="mb-3 text-indigo-300">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ResumeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-3xl bg-white/10" />
      <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
      <Skeleton className="h-80 w-full rounded-3xl bg-white/10" />
    </div>
  );
}

function ListPanel({
  title,
  items,
  emptyText,
  variant,
}: {
  title: string;
  items: string[];
  emptyText: string;
  variant: "green" | "red" | "blue" | "amber";
}) {
  const styles = {
    green: "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20",
    red: "bg-rose-500/20 text-rose-200 hover:bg-rose-500/20",
    blue: "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/20",
    amber: "bg-amber-500/20 text-amber-200 hover:bg-amber-500/20",
  } as const;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-sm font-medium text-slate-200">{title}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} className={styles[variant]}>
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">{emptyText}</p>
      )}
    </div>
  );
}

export default CandidateResumeClient;
