import { createSign } from "node:crypto";
import { prisma } from "./prisma";

const b64=(v:string|Buffer)=>Buffer.from(v).toString("base64url");
async function accessToken(){
  const project=process.env.FIREBASE_PROJECT_ID, email=process.env.FIREBASE_CLIENT_EMAIL, key=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
  if(!project||!email||!key) return null;
  const now=Math.floor(Date.now()/1000); const head=b64(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const payload=b64(JSON.stringify({iss:email,scope:"https://www.googleapis.com/auth/firebase.messaging",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600}));
  const signing=`${head}.${payload}`; const signer=createSign("RSA-SHA256"); signer.update(signing); signer.end();
  const assertion=`${signing}.${signer.sign(key).toString("base64url")}`;
  const res=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion})});
  const data=await res.json(); if(!res.ok) throw new Error(data?.error_description || "FCM OAuth başarısız"); return {token:data.access_token as string,project};
}
export async function sendPushToUser(userId:string,title:string,body:string,data:Record<string,string>={}){
  const auth=await accessToken(); if(!auth) return {sent:0,skipped:true};
  const devices=await prisma.pushDevice.findMany({where:{userId,enabled:true}}); let sent=0;
  for(const d of devices){
    const res=await fetch(`https://fcm.googleapis.com/v1/projects/${auth.project}/messages:send`,{method:"POST",headers:{Authorization:`Bearer ${auth.token}`,"Content-Type":"application/json"},body:JSON.stringify({message:{token:d.token,notification:{title,body},data,android:{priority:"high"},apns:{headers:{"apns-priority":"10"},payload:{aps:{sound:"default"}}}}})});
    if(res.ok) sent++; else { const text=await res.text(); console.error("FCM_SEND_FAILED",text); if(/UNREGISTERED|registration-token-not-registered/i.test(text)) await prisma.pushDevice.update({where:{id:d.id},data:{enabled:false}}).catch(()=>{}); }
  }
  return {sent,skipped:false};
}
export async function notifyUser(userId:string,title:string,body:string,kind="system",data:Record<string,string>={}){
  const row=await prisma.notification.create({data:{userId,title,body,kind}});
  await sendPushToUser(userId,title,body,{kind,notificationId:row.id,...data}).catch(e=>console.error(e));
  return row;
}
