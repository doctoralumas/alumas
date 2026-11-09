import fs from "node:fs";

const config = fs.readFileSync("next.config.ts", "utf8");
const proxy = fs.readFileSync("proxy.ts", "utf8");
const auth = fs.readFileSync("lib/auth.ts", "utf8");

const checks = {
  csp: config.includes("Content-Security-Policy"),
  hsts: config.includes("Strict-Transport-Security"),
  originGuard: proxy.includes("Geçersiz istek kaynağı"),
  httpOnly: /\bhttpOnly\s*:\s*true\b/.test(auth),
  sameSite: /\bsameSite\s*:\s*["']lax["']/.test(auth),
  secureCookie: /\bsecure\s*:\s*process\.env\.NODE_ENV\s*===\s*["']production["']/.test(auth),
};

console.log(checks);
if (Object.values(checks).some((value) => !value)) process.exit(1);
