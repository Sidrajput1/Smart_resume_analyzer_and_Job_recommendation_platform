"use client";
import { useRef, useState } from "react";
import { ArrowUpRight, FileText, Check, Upload, X } from "lucide-react";
import { useUploadResumeFile } from "@/hooks/useUploadResumeFile";
import { useParseCandidateResume } from "@/hooks/useParsedCandidateResume";
import { useApplyParsedResume } from "@/hooks/useApplyParsedResume";
import { EditableExtractedResume } from "./EditableExtractedResume";
import type { ParsedResumeData } from "@/types/resume-parser";
import type { CandidateProfile } from "@/types/career";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryError, TextLink } from "@/components/career/Primitives";
const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export default function ResumeUpload({
  resume,
}: {
  resume?: CandidateProfile["resume"];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<ParsedResumeData | null>(null);
  const [applied, setApplied] = useState(false);
  const upload = useUploadResumeFile();
  const parse = useParseCandidateResume();
  const apply = useApplyParsedResume();
  function selectFile(selected?: File) {
    if (!selected) return;
    if (!allowedTypes.includes(selected.type)) {
      setError("Please choose a PDF or DOCX document.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024 || selected.size === 0) {
      setError("Choose a non-empty document up to 5 MB.");
      return;
    }
    setFile(selected);
    setError("");
    setProgress(0);
    upload.reset();
    setApplied(false);
  }
  function sendFile() {
    if (!file) return;
    setConfirm(false);
    upload.mutate(
      {
        file,
        title: resume?.title || "My Resume",
        summary: resume?.summary || "",
        onProgress: setProgress,
      },
      {
        onSuccess: () => {
          setParsed(null);
          setFile(null);
          setApplied(false);
          if (input.current) input.current.value = "";
        },
      },
    );
  }
  return (
    <div className="upload-workflow">
      <section
        className={`document-intake ${dragging ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!upload.isPending) selectFile(event.dataTransfer.files[0]);
        }}
      >
        <div className="intake-copy">
          <span className="eyebrow">DOCUMENT IN / POSSIBILITY OUT</span>
          <h2>
            From document to
            <br />
            <em>career intelligence.</em>
          </h2>
          <p>
            Your resume is the starting point. You decide what makes it into
            your profile.
          </p>
          <div className="upload-sequence">
            <span>
              01 <strong>Upload</strong>
            </span>
            <span>
              02 <strong>Review extraction</strong>
            </span>
            <span>
              03 <strong>Explore intelligence</strong>
            </span>
          </div>
          <span className="eyebrow">PDF OR DOCX / UP TO 5 MB</span>
        </div>
        <div className="intake-frame">
          <div className="intake-frame-top">
            <span className="eyebrow">RESUME / SOURCE DOCUMENT</span>
            <span aria-hidden="true">+</span>
          </div>
          <div className="intake-paper" aria-hidden="true">
            <FileText size={28} strokeWidth={1.1} />
            <span />
            <span />
            <span />
            <div>
              <i />
              <i />
              <i />
            </div>
          </div>
          <input
            ref={input}
            id="resume-file"
            type="file"
            className="sr-only"
            accept=".pdf,.docx"
            disabled={upload.isPending}
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          <label htmlFor="resume-file" className="intake-browse">
            {file ? file.name : resume?.fileName || "Drop your story here"}
            <span>
              {file
                ? `${Math.ceil(file.size / 1024)} KB · Click to replace selection`
                : "Drag a document here, or browse files"}
            </span>
            <span className="action action-secondary">
              Choose document
              <ArrowUpRight size={16} />
            </span>
          </label>
          {file && (
            <div className="selected-file-actions">
              <button
                className="action"
                disabled={upload.isPending}
                onClick={() =>
                  resume?.fileUrl ? setConfirm(true) : sendFile()
                }
              >
                <Upload size={16} />
                {upload.isPending
                  ? "Uploading…"
                  : resume?.fileUrl
                    ? "Replace document"
                    : "Upload document"}
              </button>
              <button
                className="icon-button"
                aria-label="Remove selected file"
                disabled={upload.isPending}
                onClick={() => {
                  setFile(null);
                  if (input.current) input.current.value = "";
                }}
              >
                <X size={17} />
              </button>
            </div>
          )}
        </div>
      </section>
      {error && (
        <p className="validation-error" role="alert">
          {error}
        </p>
      )}
      {upload.isPending && (
        <div className="upload-progress" role="status">
          <div>
            <span>Uploading document</span>
            <span>{progress}%</span>
          </div>
          <progress
            value={progress}
            max="100"
            aria-label="Document upload progress"
          />
          {progress === 100 && (
            <p>
              Upload transferred. Waiting for the server to save your document.
            </p>
          )}
        </div>
      )}
      {upload.isError && (
        <QueryError onRetry={sendFile}>
          Upload failed. Your selected file is ready to try again.
        </QueryError>
      )}
      {resume?.fileUrl && (
        <div className="received-document">
          <span className="received-check">
            <Check size={18} />
          </span>
          <div>
            <span className="eyebrow">DOCUMENT RECEIVED</span>
            <h3>{resume.fileName || resume.title}</h3>
            <p>
              {resume.parsedAt
                ? "Text has been extracted. You can parse again to review the details."
                : "Ready for extraction. Review the results before adding them to your profile."}
            </p>
          </div>
          <div className="document-actions">
            <a
              className="text-link"
              //href={resume.fileUrl}
              href={`/api/resumes/${resume.id}/view`}
              target="_blank"
              rel="noreferrer"
            >
              Open file
              <ArrowUpRight size={16} />
            </a>
            <button
              className="action"
              disabled={parse.isPending || upload.isPending}
              onClick={() => {
                setApplied(false);
                parse.mutate(undefined, {
                  onSuccess: (response) =>
                    setParsed(response.data.structuredData),
                });
              }}
            >
              {parse.isPending
                ? "Extracting information…"
                : parsed
                  ? "Extract again ↗"
                  : "Extract information ↗"}
            </button>
          </div>
        </div>
      )}
      {parse.isPending && (
        <p className="inline-status" role="status">
          Processing your document. Extracted information will appear when the
          parser completes.
        </p>
      )}
      {parse.isError && (
        <QueryError
          onRetry={() =>
            parse.mutate(undefined, {
              onSuccess: (response) => setParsed(response.data.structuredData),
            })
          }
        >
          Extraction failed. You can retry or replace the document.
        </QueryError>
      )}
      {parsed && (
        <section className="extracted-review">
          <span className="eyebrow">02 / YOUR REVIEW MATTERS</span>
          <h2>Check the details. Keep your story yours.</h2>
          <p>
            Confirm or edit the extraction before saving it to your profile.
          </p>
          <EditableExtractedResume
            data={parsed}
            isSaving={apply.isPending}
            onSave={async (data) => {
              try {
                await apply.mutateAsync({ data });
                setParsed(null);
                setApplied(true);
              } catch {
                /* The mutation displays the server error. Keep extracted data for retry. */
              }
            }}
          />
        </section>
      )}
      {applied && (
        <div className="saved-extraction" role="status">
          <Check size={20} />
          <div>
            <h3>Details reviewed. Profile updated.</h3>
            <p>Your document and profile are ready for the next step.</p>
          </div>
          <TextLink href="/candidate/intelligence">
            Explore your intelligence
          </TextLink>
        </div>
      )}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace your current document?</DialogTitle>
            <DialogDescription>
              The new document replaces your stored resume file and clears its
              extracted text. Your profile sections remain available. Review and
              regenerate intelligence after replacement.
            </DialogDescription>
          </DialogHeader>
          <div className="confirmation-actions">
            <button
              className="action action-secondary"
              onClick={() => setConfirm(false)}
            >
              Keep current file
            </button>
            <button className="action" onClick={sendFile}>
              Replace document
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
