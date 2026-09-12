import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

function safeExt(name:string){ return path.extname(name).replace(/[^.a-zA-Z0-9]/g,"").slice(0,8); }
function s3(){ return new S3Client({region:process.env.S3_REGION || "auto",endpoint:process.env.S3_ENDPOINT || undefined,forcePathStyle:process.env.S3_FORCE_PATH_STYLE==="true",credentials:process.env.S3_ACCESS_KEY_ID&&process.env.S3_SECRET_ACCESS_KEY?{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}:undefined}); }

export async function storePrivateFile(file:File,userId:string){
  let bytes = Buffer.from(await file.arrayBuffer());
  let contentType = file.type;
  let ext = safeExt(file.name);

  // 1. Resim Sıkıştırma (WebP)
  if (contentType.startsWith("image/") && contentType !== "image/svg+xml") {
    try {
      bytes = await sharp(bytes)
        .resize({ width: 1920, withoutEnlargement: true }) // Maksimum HD çözünürlük
        .webp({ quality: 80, effort: 4 }) // Yüksek verimlilikli sıkıştırma
        .toBuffer();
      contentType = "image/webp";
      ext = ".webp";
    } catch(e) {
      console.warn("Görsel sıkıştırma hatası, orijinali kaydediliyor:", e);
    }
  } 
  
  // 2. PDF Optimizasyonu ve Güvenlik Limitleri
  else if (contentType === "application/pdf") {
    if (bytes.length > 10 * 1024 * 1024) {
      throw new Error("PDF dosyası çok büyük (Maksimum 10 MB kabul edilir). Lütfen dosyayı küçültün.");
    }
    
    try {
      // PDF metadata temizliği ve object-stream bazlı dosya sıkıştırma (Garbage collection dahil)
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdfDoc.setTitle('Alumas Health Document');
      pdfDoc.setAuthor('Alumas Health');
      pdfDoc.setSubject('');
      pdfDoc.setCreator('Alumas Health');
      pdfDoc.setProducer('Alumas Health');
      bytes = Buffer.from(await pdfDoc.save({ useObjectStreams: true })); // useObjectStreams: true ile PDF nesnelerini ziple
    } catch (e) {
      console.warn("PDF optimizasyon uyarısı, şifreli/bozuk olabilir, atlanıyor:", e);
    }
  }

  const key=`health/${userId}/${randomUUID()}${ext}`;
  if((process.env.STORAGE_DRIVER||"local")==="s3") { 
    const bucket=process.env.S3_BUCKET; 
    if(!bucket) throw new Error("S3_BUCKET eksik"); 
    await s3().send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:contentType,ServerSideEncryption:process.env.S3_SSE as any || undefined})); 
    return `s3:${key}`; 
  }
  const filePath=path.join(process.cwd(),"data","uploads",key); 
  await mkdir(path.dirname(filePath),{recursive:true}); 
  await writeFile(filePath,bytes); 
  return `local:${key}`;
}
export async function readPrivateFile(storagePath:string){
  if(storagePath.startsWith("s3:")){ const bucket=process.env.S3_BUCKET!; const out=await s3().send(new GetObjectCommand({Bucket:bucket,Key:storagePath.slice(3)})); return Buffer.from(await out.Body!.transformToByteArray()); }
  const key=storagePath.replace(/^local:/,"").replace(/^data\/uploads\//,""); return readFile(path.join(process.cwd(),"data","uploads",key));
}
export async function deletePrivateFile(storagePath:string){
  if(storagePath.startsWith("s3:")){ if(process.env.S3_BUCKET) await s3().send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key:storagePath.slice(3)})); return; }
  const key=storagePath.replace(/^local:/,"").replace(/^data\/uploads\//,""); await unlink(path.join(process.cwd(),"data","uploads",key)).catch(()=>{});
}
