import fs from "node:fs";
import {execFileSync} from "node:child_process";
const required=["proxy.ts","lib/release-config.ts","app/maintenance/page.tsx","app/api/version/route.ts","app/api/app-config/route.ts","RELEASE_CHECKLIST.md","RELEASE_PROMOTION.md"];
let ok=true;for(const f of required){if(!fs.existsSync(f)){console.error("missing",f);ok=false}}
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));if(!/^0\.(3[1-9]|[4-9][0-9])\./.test(pkg.version)){console.error("version must be v31 or newer");ok=false}
const proxy=fs.readFileSync("proxy.ts","utf8");for(const x of ["MAINTENANCE_MODE","x-maintenance-bypass","retry-after"]){if(!proxy.includes(x)){console.error("maintenance control missing",x);ok=false}}
const config=fs.readFileSync("lib/release-config.ts","utf8");for(const x of ["FEATURE_VIDEO_CONSULTATION","FEATURE_HEALTH_TOURISM","RELEASE_CHANNEL","BUILD_SHA"]){if(!config.includes(x)){console.error("release config missing",x);ok=false}}
if(!ok)process.exit(1);console.log("v31 RC check OK");
