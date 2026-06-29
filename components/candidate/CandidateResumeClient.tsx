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

function CandidateResumeClient() {
  const { data, isLoading } = useCandidateResume();
  const updateMutation = useUpdateCandidateResume();

  const candidate = data?.candidate;
  const resume = candidate?.resume;

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

    setResumeFile(null);
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
          value="--"
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
        <TabsList className="grid w-full grid-cols-4 bg-white/5">
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

        <TabsContent value="resume">
          {/* <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Resume Details</CardTitle>
              <CardDescription className="text-slate-300">
                Manage your one main resume for job applications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Resume Title"
                  value={resumeTitle}
                  onChange={setResumeTitle}
                  placeholder="My Professional Resume"
                />
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge className="w-fit bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20">
                    {resume?.status ?? "DRAFT"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resume Summary</Label>
                <Textarea
                  value={resumeSummary}
                  onChange={(e) => setResumeSummary(e.target.value)}
                  placeholder="A short summary that introduces your profile..."
                  className="min-h-32 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                />
              </div>

              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
                <FileText className="mx-auto mb-3 h-8 w-8 text-indigo-300" />
                <p className="font-medium">Resume upload will come next</p>
                <p className="mt-1 text-sm text-slate-400">
                  In the next step, we will add PDF upload, parsing, and AI analysis.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() =>
                    updateMutation.mutate({
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
                    })
                  }
                  className="bg-cyan-500 text-white transition-all duration-300 hover:bg-cyan-400"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Resume"}
                </Button>
              </div>
            </CardContent>
          </Card> */}
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
              {resume?.fileUrl ? (
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
              )}
            </div>
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
          <EducationCandidate />
        </TabsContent>

        <TabsContent value="preview">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Candidate Intelligence Preview</CardTitle>
              <CardDescription className="text-slate-300">
                This will become your AI-powered profile after parsing and
                analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PreviewStat label="Overall Score" value="--" />
                <PreviewStat label="ATS Score" value="--" />
                <PreviewStat label="Skill Gaps" value="--" />
                <PreviewStat label="Recommended Roles" value="--" />
              </div>

              <Separator className="bg-white/10" />

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-sm text-slate-400">Strengths</p>
                  <p className="text-sm text-slate-200">
                    Will be populated by the AI engine after resume parsing.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-sm text-slate-400">Suggestions</p>
                  <p className="text-sm text-slate-200">
                    Add measurable achievements, keywords, and stronger project
                    details.
                  </p>
                </div>
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

export default CandidateResumeClient;
