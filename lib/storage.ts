import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function safeExt(name:string){ return path.extname(name).replace(/[^.a-zA-Z0-9]/g,"").slice(0,8); }
function s3(){ return new S3Client({region:process.env.S3_REGION || "auto",endpoint:process.env.S3_ENDPOINT || undefined,forcePathStyle:process.env.S3_FORCE_PATH_STYLE==="true",credentials:process.env.S3_ACCESS_KEY_ID&&process.env.S3_SECRET_ACCESS_KEY?{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}:undefined}); }
export async function storePrivateFile(file:File,userId:string){
  const key=`health/${userId}/${randomUUID()}${safeExt(file.name)}`; const bytes=Buffer.from(await file.arrayBuffer());
  if((process.env.STORAGE_DRIVER||"local")==="s3") { const bucket=process.env.S3_BUCKET; if(!bucket) throw new Error("S3_BUCKET eksik"); await s3().send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:file.type,ServerSideEncryption:process.env.S3_SSE as any || undefined})); return `s3:${key}`; }
  const filePath=path.join(process.cwd(),"data","uploads",key); await mkdir(path.dirname(filePath),{recursive:true}); await writeFile(filePath,bytes); return `local:${key}`;
}
export async function readPrivateFile(storagePath:string){
  if(storagePath.startsWith("s3:")){ const bucket=process.env.S3_BUCKET!; const out=await s3().send(new GetObjectCommand({Bucket:bucket,Key:storagePath.slice(3)})); return Buffer.from(await out.Body!.transformToByteArray()); }
  const key=storagePath.replace(/^local:/,"").replace(/^data\/uploads\//,""); return readFile(path.join(process.cwd(),"data","uploads",key));
}
export async function deletePrivateFile(storagePath:string){
  if(storagePath.startsWith("s3:")){ if(process.env.S3_BUCKET) await s3().send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key:storagePath.slice(3)})); return; }
  const key=storagePath.replace(/^local:/,"").replace(/^data\/uploads\//,""); await unlink(path.join(process.cwd(),"data","uploads",key)).catch(()=>{});
}
