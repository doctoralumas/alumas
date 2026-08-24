export async function sendSms(phone:string, body:string) {
  const provider=(process.env.SMS_PROVIDER || "console").toLowerCase();
  if(provider==="console") { console.log(`[Alumas SMS] ${phone}: ${body}`); return {provider:"console",id:"dev"}; }
  if(provider==="twilio") {
    const sid=process.env.TWILIO_ACCOUNT_SID, token=process.env.TWILIO_AUTH_TOKEN, from=process.env.TWILIO_FROM;
    if(!sid||!token||!from) throw new Error("Twilio ortam değişkenleri eksik");
    const form=new URLSearchParams({To:phone,From:from,Body:body});
    const res=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body:form});
    const data=await res.json(); if(!res.ok) throw new Error(data?.message || "SMS gönderilemedi"); return {provider:"twilio",id:data.sid};
  }
  throw new Error(`Desteklenmeyen SMS_PROVIDER: ${provider}`);
}
