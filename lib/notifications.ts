import { NotificationType, Prisma } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createNotification(
  tx: Prisma.TransactionClient,
  input: CreateNotificationInput,
) {
  return tx.notification.create({
    data: {
      userId: input.userId,

      type: input.type,

      title: input.title,

      message: input.message,

      link: input.link,

      metadata: input.metadata ?? undefined,
    },
  });
}
