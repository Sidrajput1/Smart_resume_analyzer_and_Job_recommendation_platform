"use client";

import * as React from "react";
import { CalendarClock, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useScheduleInterview,type InterviewMode } from "@/hooks/useInterview";


type ApplicationToSchedule = {
  id: string;
  candidateName: string;
  jobTitle: string;
};

type Props = {
  application: ApplicationToSchedule | null;
  onOpenChange: (open: boolean) => void;
  onScheduled: () => void;
};

export default function ScheduleInterviewDialog({ application, onOpenChange, onScheduled }: Props) {
  const mutation = useScheduleInterview();
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [mode, setMode] = React.useState<InterviewMode>("VIDEO");
  const [durationMinutes, setDurationMinutes] = React.useState(30);
  const [meetingUrl, setMeetingUrl] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const recruiterTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";

  React.useEffect(() => {
    if (!application) return;
    setDate("");
    setTime("");
    setMode("VIDEO");
    setDurationMinutes(30);
    setMeetingUrl("");
    setLocation("");
    setNotes("");
    setValidationError(null);
    mutation.reset();
    // mutation.reset is stable for TanStack Query, and resets only when a new applicant opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    if (!application) return;

    // datetime-local has no timezone. Interpret it in the recruiter browser timezone,
    // then send an absolute UTC timestamp; Prisma stores DateTime in UTC.
    const localDatetime = new Date(`${date}T${time}`);
    if (!date || !time || Number.isNaN(localDatetime.getTime()) || localDatetime.getTime() <= Date.now()) {
      setValidationError("Choose a future date and time.");
      return;
    }

    try {
      await mutation.mutateAsync({
        applicationId: application.id,
        scheduledAt: localDatetime.toISOString(),
        durationMinutes,
        mode,
        meetingUrl: mode === "VIDEO" ? meetingUrl.trim() : undefined,
        location: mode === "ONSITE" ? location.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
      onScheduled();
    } catch {
      // Display mutation.error.message below. Leave the dialog open for correction.
    }
  }

  const errorMessage = validationError ?? (mutation.error instanceof Error ? mutation.error.message : null);

  return (
    <Dialog open={Boolean(application)} onOpenChange={(open) => { if (!mutation.isPending) onOpenChange(open); }}>
      <DialogContent className="max-h-[94dvh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto border-white/10 bg-slate-950 text-white sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarClock className="h-5 w-5 text-indigo-300" /> Schedule interview
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {application ? `${application.candidateName} · ${application.jobTitle}` : "Select a candidate."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div className="rounded-lg border border-indigo-400/20 bg-indigo-400/5 p-3 text-xs leading-5 text-indigo-100">
            Enter the date and time in <strong>{recruiterTimeZone}</strong>. The candidate will see the same instant in their own local timezone.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-200">
              <span>Interview date *</span>
              <Input aria-label="Interview date" required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="border-white/15 bg-slate-900 text-white [color-scheme:dark]" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-200">
              <span>Start time *</span>
              <Input aria-label="Interview time" required type="time" value={time} onChange={(event) => setTime(event.target.value)} className="border-white/15 bg-slate-900 text-white [color-scheme:dark]" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-200">
              <span>Interview mode *</span>
              <select value={mode} onChange={(event) => setMode(event.target.value as InterviewMode)} className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white">
                <option value="VIDEO">Video call</option>
                <option value="PHONE">Phone call</option>
                <option value="ONSITE">Onsite</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-200">
              <span>Duration *</span>
              <select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white">
                {[15, 30, 45, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>{minutes} minutes</option>
                ))}
              </select>
            </label>
          </div>

          {mode === "VIDEO" && (
            <label className="block space-y-1.5 text-sm font-medium text-slate-200">
              <span>Meeting URL (optional)</span>
              <Input type="url" placeholder="https://meet.google.com/..." value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} className="border-white/15 bg-slate-900 text-white placeholder:text-slate-500" />
              <span className="flex items-center gap-1 text-xs font-normal text-slate-400"><ExternalLink className="h-3 w-3" /> You can add an existing HTTPS meeting link now, or arrange it later. Automatic meeting creation is not enabled.</span>
            </label>
          )}
          {mode === "ONSITE" && (
            <label className="block space-y-1.5 text-sm font-medium text-slate-200">
              <span>Interview location *</span>
              <Input required maxLength={300} placeholder="Office address, floor, city..." value={location} onChange={(event) => setLocation(event.target.value)} className="border-white/15 bg-slate-900 text-white placeholder:text-slate-500" />
            </label>
          )}
          {mode === "PHONE" && <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-400">The candidate will see that this is a phone interview. Coordinate the phone number separately.</p>}

          <label className="block space-y-1.5 text-sm font-medium text-slate-200">
            <span>Instructions (optional)</span>
            <textarea rows={3} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Interview preparation, what to bring, joining instructions..." className="w-full resize-y rounded-md border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-400" />
          </label>

          {errorMessage && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{errorMessage}</p>}

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-white/10 pt-4 sm:flex-row">
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)} className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">Cancel</Button>
            <Button type="submit" disabled={!application || mutation.isPending} className="bg-indigo-500 text-white hover:bg-indigo-400">
              {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</> : <><CalendarClock className="mr-2 h-4 w-4" /> Confirm interview</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
