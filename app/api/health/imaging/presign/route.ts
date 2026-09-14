import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getS3Client } from '@/lib/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

function safeExt(name: string) { return path.extname(name).replace(/[^.a-zA-Z0-9]/g, "").slice(0, 8); }

export async function POST(req: Request) {
  const u = await currentUser();
  if(!u) return NextResponse.json({error:"Giriş gerekli"},{status:401});
if ((process.env.STORAGE_DRIVER || "local") !== "s3") {
    return NextResponse.json({ error: 'Depolama mimarisi S3/R2 olarak ayarlanmamış' }, { status: 400 });
  }

  const bucket = process.env.S3_BUCKET;
  if (!bucket) return NextResponse.json({ error: 'S3_BUCKET eksik' }, { status: 500 });

  const { fileName, fileType, fileSize } = await req.json();

  if (!fileName || !fileType || !fileSize) {
    return NextResponse.json({ error: 'Dosya bilgileri eksik' }, { status: 400 });
  }

  // Quota Check: Max 2GB total per patient for Imaging
  const maxQuota = 2 * 1024 * 1024 * 1024; 
  if (fileSize > maxQuota) {
    return NextResponse.json({ error: 'Dosya tek başına kotadan büyük.' }, { status: 413 });
  }

  const existingRecords = await prisma.imagingResult.findMany({
    where: { userId: u.id },
    select: { sizeBytes: true }
  });

  const currentUsage = existingRecords.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  
  if (currentUsage + fileSize > maxQuota) {
    return NextResponse.json({ error: `Depolama alanınız doldu (Kota: 2GB). Mevcut kullanım: ${(currentUsage/1024/1024).toFixed(1)} MB` }, { status: 413 });
  }

  const ext = safeExt(fileName);
  const key = `health/${u.id}/${randomUUID()}${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
      ServerSideEncryption: process.env.S3_SSE as any || undefined
    });

    // 15 dakikalık yükleme izni
    const presignedUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });

    return NextResponse.json({ 
      presignedUrl, 
      storagePath: `s3:${key}`
    }, { status: 200 });

  } catch (error: any) {
    console.error("Presign hatası:", error);
    return NextResponse.json({ error: 'Yükleme adresi oluşturulamadı.' }, { status: 500 });
  }
}

