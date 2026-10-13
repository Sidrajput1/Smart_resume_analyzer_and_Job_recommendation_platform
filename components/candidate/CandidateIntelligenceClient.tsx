"use client";
import { useCandidateResume } from "@/hooks/useCandidateResume";
import { useGenerateCandidateIntelligence } from "@/hooks/useGeneralCandidateIntelligence";
import {
  LoadingBriefing,
  PageHeading,
  QueryError,
  ActionLink,
} from "@/components/career/Primitives";
import IntelligenceReport from "@/components/career/IntelligenceReport";
import type { CandidateProfile } from "@/types/career";
export default function CandidateIntelligenceClient() {
  const query = useCandidateResume();
  const generate = useGenerateCandidateIntelligence();
  if (query.isLoading) return <LoadingBriefing />;
  if (query.isError) return <QueryError onRetry={() => query.refetch()} />;
  const profile: CandidateProfile | undefined = query.data?.candidate;
  if (!profile)
    return (
      <QueryError onRetry={() => query.refetch()}>
        Your profile was not returned.
      </QueryError>
    );
  return (
    <div>
      <PageHeading
        eyebrow="03 / CAREER INTELLIGENCE"
        title="There’s a story in your experience."
        description="Look at what your resume communicates, the evidence behind it, and what you could make clearer."
      >
        <button
          className="action"
          disabled={!profile.resume?.fileUrl || generate.isPending}
          onClick={() => generate.mutate()}
        >
          {generate.isPending
            ? "Generating your report…"
            : profile.intelligence
              ? "Refresh intelligence ↗"
              : "Generate intelligence ↗"}
        </button>
        {!profile.resume?.fileUrl && (
          <ActionLink href="/candidate/resume" secondary>
            Add your resume
          </ActionLink>
        )}
      </PageHeading>
      {generate.isError && (
        <QueryError onRetry={() => generate.mutate()}>
          The analysis could not complete. Check that your resume is uploaded
          and the analysis service is available.
        </QueryError>
      )}
      {generate.isPending && (
        <p className="inline-status" role="status">
          Analyzing your profile. Your report will appear when processing
          completes.
        </p>
      )}
      <IntelligenceReport profile={profile} />
    </div>
  );
}
