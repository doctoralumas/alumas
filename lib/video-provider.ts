export async function createVideoRoom(roomName:string){
  const provider=(process.env.VIDEO_PROVIDER||"demo").toLowerCase();
  if(provider==="daily" && process.env.DAILY_API_KEY){
    const res=await fetch("https://api.daily.co/v1/rooms",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.DAILY_API_KEY}`},body:JSON.stringify({name:roomName,privacy:"private",properties:{exp:Math.floor(Date.now()/1000)+7200,enable_chat:true}})});
    if(!res.ok) throw new Error("Video odası oluşturulamadı");
    const data=await res.json(); return {provider:"daily",url:String(data.url||"")};
  }
  return {provider:"demo",url:null};
}
