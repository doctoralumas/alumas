type CounterKey="http_requests"|"http_errors"|"login_success"|"login_failure"|"appointments_created";
type Store={startedAt:number,counters:Record<string,number>,durations:number[]};
const g=globalThis as typeof globalThis & {__alumasMetrics?:Store};
const store=g.__alumasMetrics??(g.__alumasMetrics={startedAt:Date.now(),counters:{},durations:[]});
export function inc(key:CounterKey,by=1){store.counters[key]=(store.counters[key]||0)+by}
export function observeHttp(ms:number){store.durations.push(ms);if(store.durations.length>1000)store.durations.splice(0,store.durations.length-1000)}
function quantile(values:number[],q:number){if(!values.length)return 0;const a=[...values].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor((a.length-1)*q))]}
export function snapshot(){return {uptimeSeconds:Math.floor((Date.now()-store.startedAt)/1000),counters:{...store.counters},httpDurationMs:{count:store.durations.length,p50:quantile(store.durations,.5),p95:quantile(store.durations,.95),p99:quantile(store.durations,.99)}}}
export function prometheus(){const s=snapshot();const lines=[`alumas_uptime_seconds ${s.uptimeSeconds}`];for(const [k,v] of Object.entries(s.counters))lines.push(`alumas_${k}_total ${v}`);lines.push(`alumas_http_duration_ms_p50 ${s.httpDurationMs.p50}`,`alumas_http_duration_ms_p95 ${s.httpDurationMs.p95}`,`alumas_http_duration_ms_p99 ${s.httpDurationMs.p99}`);return lines.join("\\n")+"\\n"}
