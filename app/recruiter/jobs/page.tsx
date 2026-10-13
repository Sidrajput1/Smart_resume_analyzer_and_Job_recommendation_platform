import RecruiterJobsClient from '@/components/recruiter/RecruiterJobsClient'
import React from 'react'

export default async function RecruiterJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  return <RecruiterJobsClient initialCreate={params.create === "1"} />;
}
