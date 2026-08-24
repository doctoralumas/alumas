import fs from "node:fs";
const prev=process.env.PREVIOUS_IMAGE_REF;const current=process.env.CURRENT_IMAGE_REF;if(!prev||!prev.includes("@sha256:")){console.error("PREVIOUS_IMAGE_REF immutable digest olmalı (@sha256:)");process.exit(2)}
if(!current||!current.includes("@sha256:")){console.error("CURRENT_IMAGE_REF immutable digest olmalı (@sha256:)");process.exit(2)}
const a={service:"alumas",from:current,to:prev,createdAt:new Date().toISOString(),requiresDatabaseCompatibilityReview:true,command:`ALUMAS_IMAGE='${prev}' docker compose -f deploy/production.compose.yml up -d app`};
fs.mkdirSync("dist",{recursive:true});fs.writeFileSync("dist/rollback-artifact.json",JSON.stringify(a,null,2));console.log("dist/rollback-artifact.json");
