import { ApplicationEventType, Prisma } from "@prisma/client";

interface CreateApplicationEventInput {
  applicationId: string;
  actorUserId?: string | null;
  type: ApplicationEventType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createApplicationEvent(
  tx: Prisma.TransactionClient,
  input: CreateApplicationEventInput,
) {
  return tx.applicationEvent.create({
    data: {
      applicationId: input.applicationId,

      actorUserId: input.actorUserId ?? null,

      type: input.type,

      title: input.title,

      message: input.message,

      metadata: input.metadata ?? undefined,
    },
  });
}
