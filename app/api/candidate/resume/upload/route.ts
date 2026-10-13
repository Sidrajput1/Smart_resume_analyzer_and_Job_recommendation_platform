import authOptions from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "candidate-resumes";

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

// api for uploading file in supabase storage and saving the file metadata in neon postgres database
export async function POST(request: Request) {
  let newStoragePath: string | null = null;

  try {
    // 1. Authenticate candidate before allowing file upload.
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CANDIDATE") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const title = String(formData.get("title") || "My Resume");
    const summary = String(formData.get("summary") || "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Only PDF and DOCX files are allowed" },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File must be between 1 byte and 5MB" },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    const validExtension =
      (file.type === "application/pdf" && extension === "pdf") ||
      (file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
        extension === "docx");

    if (!validExtension) {
      return NextResponse.json(
        { message: "File extension and type do not match" },
        { status: 400 },
      );
    }

    // 2. Find candidate and their existing resume.
    const candidate = await db.candidateProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        resume: {
          select: {
            fileUrl: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 },
      );
    }

    // 3. Generate a unique private storage path.
    const safeName = sanitizeFileName(file.name);

    const storedFileName = `${crypto.randomUUID()}-${safeName}`;

    newStoragePath = `candidates/${candidate.id}/${storedFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    console.log("SUPABASE CONFIG:", {
  url: process.env.SUPABASE_URL,
  bucket: process.env.SUPABASE_STORAGE_BUCKET,
  storagePath: newStoragePath,
});
    // 4. Upload file to Supabase private Storage.
    // const { error: uploadError } = await supabaseAdmin.storage
    //   .from(BUCKET)
    //   .upload(newStoragePath, buffer, {
    //     contentType: file.type,
    //     upsert: false,
    //   });

    // if (uploadError) {
    //   console.error("SUPABASE_UPLOAD_ERROR:", uploadError);

    //   return NextResponse.json(
    //     { message: "Failed to upload resume to storage" },
    //     { status: 500 },
    //   );
    // }
    const { data, error } = await supabaseAdmin.storage
  .from("candidate-resumes")
  .upload(newStoragePath, buffer, {
    contentType: file.type,
    upsert: false,
  });

if (error) {
  console.error("SUPABASE_UPLOAD_ERROR:", {
    message: error.message,
    statusCode: error.statusCode,
  });

  return NextResponse.json(
    { message: "Failed to upload resume" },
    { status: 500 }
  );
}

    // Store the private object path, not a public URL.
    const fileUrl = `supabase:${newStoragePath}`;

    let resume;

    try {
      // 5. Save resume metadata in Neon PostgreSQL.
      resume = await db.resume.upsert({
        where: {
          candidateProfileId: candidate.id,
        },
        create: {
          candidateProfileId: candidate.id,
          title,
          summary: summary || null,
          fileUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          status: "COMPLETED",
          visibility: "PRIVATE",
          parsedAt: null,
        },
        update: {
          title,
          summary: summary || null,
          fileUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          status: "COMPLETED",
          visibility: "PRIVATE",
          parsedAt: null,
          extractedText: null,
        },
      });
    } catch (dbError) {
      // If PostgreSQL fails, remove the newly uploaded file.
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([newStoragePath])
        .catch((cleanupError) => {
          console.error("UPLOAD_ROLLBACK_ERROR:", cleanupError);
        });

      newStoragePath = null;
      throw dbError;
    }

    // 6. Delete old Supabase file after DB update succeeds.
    const oldFileUrl = candidate.resume?.fileUrl;

    if (oldFileUrl?.startsWith("supabase:") && oldFileUrl !== fileUrl) {
      const oldPath = oldFileUrl.slice("supabase:".length);

      const { error: deleteError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([oldPath]);

      if (deleteError) {
        // Cleanup failure must not undo a successful upload.
        console.warn("OLD_RESUME_CLEANUP_ERROR:", deleteError);
      }
    }

    return NextResponse.json(
      {
        message: "Resume uploaded successfully",
        resume,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("UPLOAD_RESUME_ERROR:", error);

    return NextResponse.json(
      { message: "Failed to upload resume" },
      { status: 500 },
    );
  }
}

// export async function POST(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user?.id) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const formData = await request.formData();

//     // validate form data
//     const file = formData.get("file");
//     const title = String(formData.get("title") || "My Resume");
//     const summary = String(formData.get("summary") || "");

//     // check if file is present and is of type File
//     if (!(file instanceof File)) {
//       return NextResponse.json(
//         { message: "File is required" },
//         { status: 400 },
//       );
//     }

//     // only allow PDF and DOCX files
//     if (!ALLOWED_MIME_TYPES.includes(file.type)) {
//       return NextResponse.json(
//         { message: "Only PDF and DOCX files are allowed" },
//         { status: 400 },
//       );
//     }

//     if (file.size > MAX_FILE_SIZE) {
//       return NextResponse.json(
//         { message: "File size must be less than 5MB" },
//         { status: 400 },
//       );
//     }
//     // find candidate profile for the user
//     const candidate = await db.candidateProfile.findUnique({
//       where: { userId: session.user.id },
//       select: {
//         id: true,
//         resume: true,
//       },
//     });

//     if (!candidate) {
//       return NextResponse.json(
//         { message: "Candidate profile not found" },
//         { status: 404 },
//       );
//     }

//     const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
//     await mkdir(uploadDir, { recursive: true });

//     //generate unique file name  and save file
//     const safeName = sanitizeFileName(file.name);
//     const storedFileName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
//     const filePath = path.join(uploadDir, storedFileName);

//     const buffer = Buffer.from(await file.arrayBuffer());
//     await writeFile(filePath, buffer);

//     const fileUrl = `/uploads/resumes/${storedFileName}`;

//     const resume = await db.resume.upsert({
//       where: {
//         candidateProfileId: candidate.id,
//       },
//       create: {
//         candidateProfileId: candidate.id,
//         title,
//         summary: summary || null,
//         fileUrl,
//         fileName: file.name,
//         mimeType: file.type,
//         fileSize: file.size,
//         status: "COMPLETED",
//         visibility: "PRIVATE",
//         parsedAt: null,
//       },
//       update: {
//         title,
//         summary: summary || null,
//         fileUrl,
//         fileName: file.name,
//         mimeType: file.type,
//         fileSize: file.size,
//         status: "COMPLETED",
//         visibility: "PRIVATE",
//         parsedAt: null,
//         extractedText: null,
//       },
//     });

//     return NextResponse.json(
//       {
//         message: "Resume uploaded successfully",
//         resume,
//       },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error("UPLOAD_RESUME_ERROR:", error);
//     return NextResponse.json(
//       { message: "Failed to upload resume" },
//       { status: 500 },
//     );
//   }
// }
