import { headers } from "next/headers";

type Level="debug"|"info"|"warn"|"error";
type Fields=Record<string,unknown>;
function clean(v:unknown){if(v instanceof Error)return {name:v.name,message:v.message,stack:process.env.NODE_ENV==="production"?undefined:v.stack};return v;}
export async function requestId(){try{return (await headers()).get("x-request-id")||undefined}catch{return undefined}}
export function log(level:Level,event:string,fields:Fields={}){
  const row={ts:new Date().toISOString(),level,event,service:"alumas",environment:process.env.APP_ENV||process.env.NODE_ENV||"development",...Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,clean(v)]))};
  const line=JSON.stringify(row); if(level==="error")console.error(line);else if(level==="warn")console.warn(line);else console.log(line);
}
export async function captureException(error:unknown,context:Fields={}){
  const id=await requestId(); log("error","exception",{requestId:id,error,...context});
  try{const Sentry=await import("@sentry/nextjs");Sentry.captureException(error,{extra:{requestId:id,...context}})}catch{}
}
export async function timed<T>(event:string,fn:()=>Promise<T>,fields:Fields={}){const start=performance.now();try{const result=await fn();log("info",event,{...fields,durationMs:Math.round(performance.now()-start),outcome:"success"});return result}catch(error){log("error",event,{...fields,durationMs:Math.round(performance.now()-start),outcome:"error",error});throw error}}
