import {NextResponse} from "next/server";import {currentUser} from "@/lib/auth";import {prisma} from "@/lib/prisma";import {audit} from "@/lib/audit";
import { DocumentInputError, documentsFromForm, withdrawExpiredCredentials } from "@/lib/verification-documents";
const TYPES:any={HASTANE:"HOSPITAL",KLINIK:"CLINIC",ECZANE:"PHARMACY",LABORATUVAR:"LABORATORY",HOSPITAL:"HOSPITAL",CLINIC:"CLINIC",PHARMACY:"PHARMACY",IMAGING_CENTER:"IMAGING_CENTER",LABORATORY:"LABORATORY"};
function slugify(v:string){return v.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)}
function distanceKm(a:number,b:number,c:number,d:number){const R=6371,rad=(x:number)=>x*Math.PI/180;const dLat=rad(c-a),dLon=rad(d-b);const h=Math.sin(dLat/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
export async function GET(req:Request){await withdrawExpiredCredentials();const u=new URL(req.url),type=u.searchParams.get("type"),city=u.searchParams.get("city"),q=u.searchParams.get("q"),onDuty=u.searchParams.get("onDuty")==='1',lat=Number(u.searchParams.get('lat')),lng=Number(u.searchParams.get('lng'));const where:any={status:"APPROVED",isPublished:true,verificationDocuments:{none:{status:"APPROVED",expiresAt:{lt:new Date()}}}};if(type&&TYPES[type.toUpperCase()])where.type=TYPES[type.toUpperCase()];if(city)where.city={equals:city,mode:"insensitive"};if(onDuty){where.type='PHARMACY';where.isOnDuty=true;where.OR=[{onDutyUntil:null},{onDutyUntil:{gte:new Date()}}]}if(q){const contains={contains:q,mode:"insensitive"};const search=[{name:contains},{description:contains},{city:contains},{services:{some:{isActive:true,name:contains}}},{imagingExams:{some:{isActive:true,name:contains}}},{laboratoryTests:{some:{isActive:true,name:contains}}}];where.AND=[...(where.AND||[]),{OR:search}]}const rows=await prisma.organization.findMany({where,include:{services:{where:{isActive:true},take:4,select:{id:true,name:true}},imagingExams:{where:{isActive:true},take:4,select:{id:true,name:true}},laboratoryTests:{where:{isActive:true},take:4,select:{id:true,name:true}},reviews:{where:{status:'APPROVED'},select:{rating:true}},_count:{select:{doctors:true,reviews:{where:{status:'APPROVED'}}}}},orderBy:[{verifiedAt:"desc"},{name:"asc"}]});let data=rows.map(({reviews,...o})=>{const rating=reviews.length?reviews.reduce((a,b)=>a+b.rating,0)/reviews.length:null;const distance=Number.isFinite(lat)&&Number.isFinite(lng)&&o.latitude!=null&&o.longitude!=null?distanceKm(lat,lng,o.latitude,o.longitude):null;return {...o,rating:rating?Number(rating.toFixed(1)):null,distanceKm:distance!=null?Number(distance.toFixed(1)):null}});if(Number.isFinite(lat)&&Number.isFinite(lng))data=data.sort((a,b)=>(a.distanceKm??99999)-(b.distanceKm??99999));return NextResponse.json(data)}
export async function POST(req:Request){
  const user=await currentUser();
  if(!user)return NextResponse.json({error:"Giriş gerekli"},{status:401});
  const form=await req.formData();
  const type=TYPES[String(form.get("type")||"").toUpperCase()];
  const name=String(form.get("name")||"").trim(),city=String(form.get("city")||"").trim(),address=String(form.get("address")||"").trim(),phone=String(form.get("phone")||"").trim(),email=String(form.get("email")||"").trim();
  if(!type||!name||!city||!address||!phone||!email)return NextResponse.json({error:"Zorunlu alanları doldurun"},{status:400});
  try{
    const documents=await documentsFromForm(form,"organization",type,user.id);
    const license=documents.find((document)=>document.documentType==="FACILITY_LICENSE");
    const base=slugify(name)||"kurum";
    let slug=base;
    for(let i=0;await prisma.organization.findUnique({where:{slug}});i++)slug=`${base}-${i+2}`;
    const org=await prisma.organization.create({data:{ownerUserId:user.id,type,name,slug,city,address,phone,email,district:String(form.get("district")||"")||null,website:String(form.get("website")||"")||null,description:String(form.get("description")||"")||null,licenseStoragePath:license?.fileStoragePath,licenseFileName:license?.fileName,verificationDocuments:{create:documents}}});
    await audit({actorUserId:user.id,action:"organization.apply",entityType:"Organization",entityId:org.id,metadata:{type:org.type},req});
    return NextResponse.json(org,{status:201});
  }catch(error){
    if(error instanceof DocumentInputError)return NextResponse.json({error:error.message},{status:400});
    console.error("organization apply failed",error);
    return NextResponse.json({error:"Başvuru kaydedilemedi."},{status:500});
  }
}
