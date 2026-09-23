import {NextResponse} from "next/server";import {currentUser} from "@/lib/auth";import {prisma} from "@/lib/prisma";
import { DocumentInputError, documentsFromForm } from "@/lib/verification-documents";
function slugify(v:string){return v.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export async function POST(req:Request){
  const u=await currentUser();
  if(!u)return NextResponse.json({error:"Giriş gerekli"},{status:401});
  if(u.doctorProfile)return NextResponse.json({error:"Doktor profiliniz zaten var"},{status:409});
  const form=await req.formData();
  const b=Object.fromEntries([...form.entries()].filter(([,value])=>typeof value==="string"));
  for(const k of ["title","specialty","city","hospital","licenseNumber","bio"])if(!String(b[k]||"").trim())return NextResponse.json({error:"Zorunlu alanları doldurun"},{status:400});
  try{
    const documents=await documentsFromForm(form,"doctor",null,u.id);
    let base=slugify(`${b.title}-${u.name}`)||`doktor-${u.id.slice(-6)}`,slug=base,i=2;
    while(await prisma.doctor.findUnique({where:{slug}}))slug=`${base}-${i++}`;
    const doctor=await prisma.$transaction(async tx=>{
      const d=await tx.doctor.create({data:{userId:u.id,slug,name:u.name,title:String(b.title).trim(),specialty:String(b.specialty).trim(),hospital:String(b.hospital).trim(),city:String(b.city).trim(),bio:String(b.bio).trim(),price:Math.max(0,Number(b.price||0)),nextSlot:"Doğrulama sonrası",licenseNumber:String(b.licenseNumber).trim(),isVerified:false,isPublished:false,verificationDocuments:{create:documents}}});
      await tx.user.update({where:{id:u.id},data:{role:"DOCTOR"}});
      return d;
    });
    return NextResponse.json({ok:true,data:{id:doctor.id,slug:doctor.slug,status:"PENDING_VERIFICATION"}},{status:201});
  }catch(error){
    if(error instanceof DocumentInputError)return NextResponse.json({error:error.message},{status:400});
    console.error("doctor onboarding failed",error);
    return NextResponse.json({error:"Profil oluşturulamadı."},{status:500});
  }
}