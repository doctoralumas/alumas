export function isOrganizationOpenNow(
  hours:{weekday:number;isClosed:boolean;opensAt:string|null;closesAt:string|null}[],
  now=new Date()
){
  const weekday=now.getDay();
  const row=hours.find(h=>h.weekday===weekday);
  if(!row) return null;
  if(row.isClosed) return false;
  if(!row.opensAt||!row.closesAt) return null;
  const hm=(s:string)=>{const [h,m]=s.split(":").map(Number);return h*60+m};
  const cur=now.getHours()*60+now.getMinutes();
  return cur>=hm(row.opensAt)&&cur<=hm(row.closesAt);
}

export function hoursUntil(date:Date,now=new Date()){
  return Math.max(0,(date.getTime()-now.getTime())/36e5);
}

export function isSameLocalDay(a:Date,b:Date){
  return a.getFullYear()===b.getFullYear() &&
    a.getMonth()===b.getMonth() &&
    a.getDate()===b.getDate();
}
