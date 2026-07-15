
import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { PassThrough } from "stream";

export const runtime = "nodejs";

function toSafeRelative(p: string) {
  const noLeadingSlash = p.replace(/^\/+/, "");
  return noLeadingSlash;
}

function resolveAbsPath(file_path: string, file_name: string) {
  const rel = toSafeRelative(file_path);
  const absBase = path.join(process.cwd(), "public");
  const candidateDirPlusName = path.join(absBase, rel, file_name);
  const candidatePathOnly = path.join(absBase, rel);
  if (
    rel.toLowerCase().endsWith(file_name.toLowerCase()) ||
    (fs.existsSync(candidatePathOnly) && fs.statSync(candidatePathOnly).isFile())
  ) {
    return candidatePathOnly;
  }

  return candidateDirPlusName;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestIdRaw = searchParams.get("requestId");
    const requestId = Number(requestIdRaw);

    if (!requestIdRaw || Number.isNaN(requestId)) {
      return NextResponse.json({ message: "missing/invalid requestId" }, { status: 400 });
    }

    const files = await prisma.repair_attachment.findMany({
      where: { request_id: requestId },
      orderBy: { id: "asc" },
    });

    if (files.length === 0) {
      return NextResponse.json({ message: "file not found" }, { status: 404 });
    }

    if (files.length === 1) {
      const f = files[0];
      const filePath = resolveAbsPath(f.file_path, f.file_name);

      if (!fs.existsSync(filePath)) {
        console.warn("missing file:", filePath);
        return NextResponse.json({ message: "file missing on server" }, { status: 404 });
      }

      const buf = fs.readFileSync(filePath);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": f.mime_type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${f.file_name}"`,
        },
      });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("zip error:", err);
    });

    const nodeStream = new PassThrough();
    archive.pipe(nodeStream);

    for (const f of files) {
      const filePath = resolveAbsPath(f.file_path, f.file_name);

      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: f.file_name });
      } else {
        console.warn("missing file:", filePath);
      }
    }

    archive.finalize();

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
    });

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const dateTimeStr = `${yyyy}-${mm}-${dd}_${hh}${mi}${ss}`;

    const zipName = `attachment_${dateTimeStr}.zip`;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
      },
    });
  } catch (err) {
    console.error("download error:", err);
    return NextResponse.json({ message: "download failed" }, { status: 500 });
  }
}


