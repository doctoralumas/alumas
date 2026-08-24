import {prisma} from "@/lib/prisma";
const avg=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const glucoseMg=(x:{value:number,unit:string})=>x.unit.toLowerCase()==="mmol/l"?x.value*18.0182:x.value;
export function resolveRange(url:URL){
  const period=url.searchParams.get("period")==="month"?"month":"week";
  const rawFrom=url.searchParams.get("from"),rawTo=url.searchParams.get("to");
  const to=rawTo?new Date(`${rawTo}T23:59:59.999`):new Date();
  const fallbackDays=period==="month"?30:7;
  const from=rawFrom?new Date(`${rawFrom}T00:00:00.000`):new Date(to.getTime()-fallbackDays*86400000);
  if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||from>to)throw new Error("Geçersiz tarih aralığı");
  if(to.getTime()-from.getTime()>366*86400000)throw new Error("Tarih aralığı en fazla 366 gün olabilir");
  return {period,from,to};
}
export async function buildHealthReport(userId:string,from:Date,to:Date,period="custom"){
  const [bp,glucose,sleep,logs,targets,labs]=await Promise.all([
    prisma.bloodPressureReading.findMany({where:{userId,measuredAt:{gte:from,lte:to}},orderBy:{measuredAt:"asc"}}),
    prisma.glucoseReading.findMany({where:{userId,measuredAt:{gte:from,lte:to}},orderBy:{measuredAt:"asc"}}),
    prisma.sleepRecord.findMany({where:{userId,startedAt:{gte:from,lte:to}},orderBy:{startedAt:"asc"}}),
    prisma.medicationDoseLog.findMany({where:{userId,scheduledFor:{gte:from,lte:to}},include:{medication:{select:{name:true,dose:true}}},orderBy:{scheduledFor:"asc"}}),
    prisma.healthTarget.findMany({where:{userId,enabled:true}}),
    prisma.labResult.findMany({where:{userId,measuredAt:{gte:from,lte:to}},orderBy:{measuredAt:"asc"}})
  ]);
  const sleepHours=sleep.map(x=>(x.endedAt.getTime()-x.startedAt.getTime())/3600000);
  const taken=logs.filter(x=>x.status==="TAKEN").length,skipped=logs.filter(x=>x.status==="SKIPPED").length;
  return {period,from:from.toISOString(),to:to.toISOString(),summary:{bp:{count:bp.length,systolicAvg:avg(bp.map(x=>x.systolic)),diastolicAvg:avg(bp.map(x=>x.diastolic))},glucose:{count:glucose.length,avg:avg(glucose.map(glucoseMg)),unit:"mg/dL"},sleep:{count:sleep.length,hoursAvg:avg(sleepHours),qualityAvg:avg(sleep.filter(x=>x.quality!=null).map(x=>x.quality as number))},medication:{logged:taken+skipped,taken,skipped,adherence:taken+skipped?Math.round(taken/(taken+skipped)*100):null}},series:{bp:bp.map(x=>({at:x.measuredAt,systolic:x.systolic,diastolic:x.diastolic,pulse:x.pulse})),glucose:glucose.map(x=>({at:x.measuredAt,value:Number(glucoseMg(x).toFixed(1)),context:x.context})),sleep:sleep.map((x,i)=>({at:x.startedAt,hours:Number(sleepHours[i].toFixed(2)),quality:x.quality}))},medicationLogs:logs.map(x=>({at:x.scheduledFor,status:x.status,name:x.medication.name,dose:x.medication.dose})),labs:labs.map(x=>({id:x.id,testName:x.testName,panel:x.panel,value:x.value,numericValue:x.numericValue,unit:x.unit,reference:x.reference,referenceLow:x.referenceLow,referenceHigh:x.referenceHigh,status:x.status,at:x.measuredAt})),targets};
}
