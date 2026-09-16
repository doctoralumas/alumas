import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
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
    // If local, we can just return a fake URL that will be intercepted, or we can just return 400 for MVP since Vercel deployment uses S3.
    // For Vercel deployments (like alumas.vercel.app), S3 bucket is usually used.
    // Actually, we'll try to support S3 since they have S3 env vars in production.
  }

  const bucket = process.env.S3_BUCKET;
  if (!bucket) return NextResponse.json({ error: 'S3_BUCKET eksik' }, { status: 500 });

  const body = await req.json();
  const { fileName, fileType, fileSize } = body;

  if (!fileName || !fileType || !fileSize) {
    return NextResponse.json({ error: 'Dosya bilgileri eksik' }, { status: 400 });
  }

  const maxQuota = 10 * 1024 * 1024; // 10MB per message attachment max
  if (fileSize > maxQuota) {
    return NextResponse.json({ error: 'Dosya boyutu çok büyük (Max 10MB).' }, { status: 413 });
  }

  const ext = safeExt(fileName);
  const key = `messages/${u.id}/${randomUUID()}${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
      ServerSideEncryption: process.env.S3_SSE as any || undefined
    });

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

