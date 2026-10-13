-- CreateEnum
CREATE TYPE "MockInterviewStatus" AS ENUM ('IN_PROGRESS', 'EVALUATING', 'EVALUATION_FAILED', 'COMPLETED');

-- CreateTable
CREATE TABLE "MockInterviewSession" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "MockInterviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "questionSource" TEXT NOT NULL,
    "currentQuestion" INTEGER NOT NULL DEFAULT 0,
    "questionCount" INTEGER NOT NULL,
    "report" JSONB,
    "totalScore" DOUBLE PRECISION,
    "evaluationMethod" TEXT,
    "evaluationStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockInterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "focusSkills" TEXT[],

    CONSTRAINT "MockInterviewQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "evaluation" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockInterviewAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MockInterviewSession_interviewId_status_idx" ON "MockInterviewSession"("interviewId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MockInterviewSession_interviewId_attemptNumber_key" ON "MockInterviewSession"("interviewId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MockInterviewQuestion_sessionId_position_key" ON "MockInterviewQuestion"("sessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MockInterviewAnswer_questionId_key" ON "MockInterviewAnswer"("questionId");

-- AddForeignKey
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewQuestion" ADD CONSTRAINT "MockInterviewQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewAnswer" ADD CONSTRAINT "MockInterviewAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MockInterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
