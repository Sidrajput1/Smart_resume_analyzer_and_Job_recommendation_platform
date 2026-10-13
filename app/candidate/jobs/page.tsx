import CandidateJobsClient from '@/components/candidate/CandidateJobsClient'
import { LoadingBriefing } from '@/components/career/Primitives'
import React, { Suspense } from 'react'

function CandidateJobsPage() {
  return (
    <Suspense fallback={<LoadingBriefing/>}>
    <CandidateJobsClient/>
    </Suspense>
  )
}

export default CandidateJobsPage