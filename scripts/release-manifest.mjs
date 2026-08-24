import fs from "node:fs";import crypto from "node:crypto";
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const files=["package.json","prisma/schema.prisma","proxy.ts","next.config.ts"].filter(fs.existsSync);
const hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex")]));
const manifest={service:"alumas",version:pkg.version,channel:process.env.RELEASE_CHANNEL||"rc",buildSha:process.env.BUILD_SHA||process.env.GITHUB_SHA||"local",createdAt:new Date().toISOString(),hashes};
fs.mkdirSync("dist",{recursive:true});fs.writeFileSync("dist/release-manifest.json",JSON.stringify(manifest,null,2));console.log("dist/release-manifest.json");
