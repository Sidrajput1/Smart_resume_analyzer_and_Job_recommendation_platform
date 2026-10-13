import {
  candidateUserId,
  ownSession,
  publicSession,
  toErrorResponse,
} from "@/lib/mock-interview";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const userId = await candidateUserId();
    const session = await ownSession((await params).sessionId, userId);
    return Response.json({ session: publicSession(session) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
