import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync("node_modules/@capacitor/cli")) {
  console.error("Önce npm install çalıştırın.");
  process.exit(1);
}

if (!existsSync("ios")) run("npx", ["cap", "add", "ios"]);
if (!existsSync("android")) run("npx", ["cap", "add", "android"]);
run("npx", ["cap", "sync"]);
console.log("\nNative projeler hazır. MOBILE_RELEASE.md içindeki HealthKit/Health Connect ve push adımlarını tamamlayın.");
