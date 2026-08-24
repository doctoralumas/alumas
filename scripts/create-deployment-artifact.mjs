import fs from "node:fs";import crypto from "node:crypto";
if(!fs.existsSync("dist/release-manifest.json")){console.error("Önce npm run release:manifest");process.exit(2)}
const r=JSON.parse(fs.readFileSync("dist/release-manifest.json","utf8"));
const image=process.env.ALUMAS_IMAGE||`ghcr.io/alumas/app:${r.version}-${String(r.buildSha).slice(0,12)}`;
const digest=process.env.ALUMAS_IMAGE_DIGEST||null;
const a={service:"alumas",version:r.version,buildSha:r.buildSha,image,imageDigest:digest,immutableRef:digest?`${image.split("@")[0]}@${digest}`:image,releaseManifestSha256:crypto.createHash("sha256").update(fs.readFileSync("dist/release-manifest.json")).digest("hex"),createdAt:new Date().toISOString()};
fs.mkdirSync("dist",{recursive:true});fs.writeFileSync("dist/deployment-artifact.json",JSON.stringify(a,null,2));console.log("dist/deployment-artifact.json");
