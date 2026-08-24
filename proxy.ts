import { NextRequest, NextResponse } from "next/server";
const MUTATING = new Set(["POST","PUT","PATCH","DELETE"]);
const MAINTENANCE_ALLOW = ["/maintenance","/api/healthcheck","/api/readiness","/api/version","/api/app-config","/api/ops/"];
function allowedOrigins(req:NextRequest){
  const configured=(process.env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);
  const own=req.nextUrl.origin;
  return new Set([own,"capacitor://localhost","http://localhost","https://localhost",...configured]);
}
function maintenanceOn(){return ["1","true","yes","on","enabled"].includes((process.env.MAINTENANCE_MODE||"").toLowerCase())}
export function proxy(req:NextRequest){
  const requestId=req.headers.get("x-request-id") || crypto.randomUUID();
  const headers=new Headers(req.headers);headers.set("x-request-id",requestId);
  if(maintenanceOn() && !MAINTENANCE_ALLOW.some(x=>req.nextUrl.pathname===x||req.nextUrl.pathname.startsWith(x))){
    const bypass=process.env.MAINTENANCE_BYPASS_SECRET;
    const supplied=req.headers.get("x-maintenance-bypass");
    if(!bypass || supplied!==bypass){
      if(req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ok:false,error:"Bakım modu aktif",code:"MAINTENANCE"},{status:503,headers:{"x-request-id":requestId,"retry-after":"300"}});
      const url=req.nextUrl.clone();url.pathname="/maintenance";url.search="";
      const res=NextResponse.rewrite(url,{request:{headers}});res.headers.set("x-request-id",requestId);res.headers.set("retry-after","300");return res;
    }
  }
  if(req.nextUrl.pathname.startsWith("/api/") && MUTATING.has(req.method) && !req.nextUrl.pathname.startsWith("/api/cron/")){
    const origin=req.headers.get("origin");
    if(origin && !allowedOrigins(req).has(origin)) return NextResponse.json({ok:false,error:"Geçersiz istek kaynağı",code:"FORBIDDEN"},{status:403,headers:{"x-request-id":requestId}});
  }
  const response=NextResponse.next({request:{headers}});
  response.headers.set("x-request-id",requestId);
  return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};
