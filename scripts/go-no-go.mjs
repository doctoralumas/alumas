import fs from "node:fs";
const checks=[
 ["releaseManifest",fs.existsSync("dist/release-manifest.json")],
 ["deploymentArtifact",fs.existsSync("dist/deployment-artifact.json")],
 ["releaseChecklist",fs.existsSync("RELEASE_CHECKLIST.md")],
 ["incidentRunbook",fs.existsSync("INCIDENT_RUNBOOK.md")],
 ["backupPolicy",fs.existsSync("BACKUP_POLICY.md")],
 ["prodCompose",fs.existsSync("deploy/production.compose.yml")],
 ["stagingCompose",fs.existsSync("deploy/staging.compose.yml")]
];
let immutable=false;if(fs.existsSync("dist/deployment-artifact.json")){const a=JSON.parse(fs.readFileSync("dist/deployment-artifact.json","utf8"));immutable=String(a.immutableRef||"").includes("@sha256:");}
checks.push(["immutableImageDigest",immutable]);
const blockers=checks.filter(([,ok])=>!ok).map(([name])=>name);
console.log(JSON.stringify({decision:blockers.length?"NO-GO":"GO",checks:Object.fromEntries(checks),blockers},null,2));if(blockers.length)process.exit(1);
