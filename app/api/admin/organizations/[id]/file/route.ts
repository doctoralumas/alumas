import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readPrivateFile } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u || u.role !== "ADMIN") return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
  
  const { id } = await params;
  const org = await prisma.organization.findUnique({ where: { id } });
  
  if (!org || !org.licenseStoragePath) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
  }

  try {
    const body = await readPrivateFile(org.licenseStoragePath);
    // Determine content type based on extension
    const ext = org.licenseFileName ? org.licenseFileName.split('.').pop()?.toLowerCase() : '';
    let mimeType = 'application/octet-stream';
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (['jpg', 'jpeg'].includes(ext as string)) mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';

    return new Response(body, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(org.licenseFileName || 'belge')}`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Dosya okunamadı" }, { status: 500 });
  }
}
