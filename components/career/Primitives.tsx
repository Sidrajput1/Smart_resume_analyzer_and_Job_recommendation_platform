import Link from "next/link";
import { ArrowUpRight, ArrowRight, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
export function Brand() {
  return (
    <span className="brand">
      <span className="signal-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        smart resume
        <span className="brand-subtitle">HUMAN POTENTIAL, CONNECTED.</span>
      </span>
    </span>
  );
}
export function SectionHeading({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="index">{number} /</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </header>
  );
}
export function ActionLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`action ${secondary ? "action-secondary" : ""}`}
    >
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-link">
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-cross" aria-hidden="true">
        +
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function QueryError({
  onRetry,
  children,
}: {
  onRetry: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="query-error" role="alert">
      <AlertCircle size={19} />
      <div>
        <strong>We couldn’t load this information.</strong>
        <p>{children || "Please try again in a moment."}</p>
      </div>
      <button className="action action-secondary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
export function LoadingBriefing() {
  return (
    <div
      className="briefing-skeleton"
      role="status"
      aria-label="Loading your workspace"
    >
      <div />
      <div />
      <div />
      <span className="eyebrow">Loading your workspace…</span>
    </div>
  );
}
