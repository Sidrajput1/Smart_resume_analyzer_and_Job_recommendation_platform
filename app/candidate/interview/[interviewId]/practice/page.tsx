import MockInterviewClient from "@/components/mock-interview/MockInterviewClient";


export default async function PracticeInterviewPage({ params }: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;
  return (
  <MockInterviewClient interviewId={interviewId} />
  );
}
