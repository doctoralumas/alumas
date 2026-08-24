import dns from "node:dns/promises";
const host=(process.env.STAGING_DOMAIN||process.argv[2]||"").replace(/^https?:\/\//,"").replace(/\/$/,"");
if(!host){console.error("STAGING_DOMAIN gerekli");process.exit(2)}
try{const [a,aaaa]=await Promise.allSettled([dns.resolve4(host),dns.resolve6(host)]);const ipv4=a.status==="fulfilled"?a.value:[];const ipv6=aaaa.status==="fulfilled"?aaaa.value:[];if(!ipv4.length&&!ipv6.length){console.error(`DNS NO-GO: ${host} A/AAAA kaydı çözülmedi`);process.exit(1)}console.log(JSON.stringify({ok:true,host,ipv4,ipv6},null,2));}catch(e){console.error("DNS NO-GO",e?.message||e);process.exit(1)}
