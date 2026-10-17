import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const MODULAR_MODULES = [
  "locales/shared/common",
  "locales/shared/navigation",
  "locales/shared/components",
  "locales/features/appointments",
  "locales/features/auth",
  "locales/features/search",
  "locales/features/health",
  "locales/features/professional",
  "locales/pages/home",
  "locales/pages/about",
  "locales/pages/contact",
  "locales/pages/maintenance",
  "locales/pages/profile",
  "locales/pages/legal",
  "locales/pages/services",
];

test("i18n dictionaries are valid JSON and have matching root schemas", () => {
  const tr = JSON.parse(fs.readFileSync("messages/tr.json", "utf8"));
  const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));

  assert.ok(tr.common, "tr.common namespace must exist");
  assert.ok(en.common, "en.common namespace must exist");
  assert.ok(tr.header, "tr.header namespace must exist");
  assert.ok(en.header, "en.header namespace must exist");
  assert.ok(tr.home, "tr.home namespace must exist");
  assert.ok(en.home, "en.home namespace must exist");
  assert.ok(tr.appointments, "tr.appointments namespace must exist");
  assert.ok(en.appointments, "en.appointments namespace must exist");
});

test("modular locale dictionaries exist and have 100% intra-module key parity", () => {
  function getKeys(obj, prefix = "") {
    let keys = [];
    for (const k of Object.keys(obj)) {
      const full = prefix ? prefix + "." + k : k;
      if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
        keys.push(...getKeys(obj[k], full));
      } else {
        keys.push(full);
      }
    }
    return keys;
  }

  for (const mod of MODULAR_MODULES) {
    const trPath = path.join(mod, "tr.json");
    const enPath = path.join(mod, "en.json");

    assert.ok(fs.existsSync(trPath), `${trPath} must exist`);
    assert.ok(fs.existsSync(enPath), `${enPath} must exist`);

    const trData = JSON.parse(fs.readFileSync(trPath, "utf8"));
    const enData = JSON.parse(fs.readFileSync(enPath, "utf8"));

    const trKeys = new Set(getKeys(trData));
    const enKeys = new Set(getKeys(enData));

    const missingInEn = [...trKeys].filter((k) => !enKeys.has(k));
    const missingInTr = [...enKeys].filter((k) => !trKeys.has(k));

    assert.equal(missingInEn.length, 0, `Keys missing in ${enPath}: ${missingInEn.join(", ")}`);
    assert.equal(missingInTr.length, 0, `Keys missing in ${trPath}: ${missingInTr.join(", ")}`);
  }
});

test("appointment booking status does not rely on Turkish string matching", () => {
  const bookingCode = fs.readFileSync("components/book-appointment.tsx", "utf8");
  assert.doesNotMatch(
    bookingCode,
    /includes\s*\(\s*["']oluşturuldu["']\s*\)/,
    "book-appointment.tsx must not use Turkish string-matching for success"
  );
  assert.doesNotMatch(
    bookingCode,
    /includes\s*\(\s*["']başarılı["']\s*\)/,
    "book-appointment.tsx must not use Turkish string-matching for success"
  );
  assert.match(
    bookingCode,
    /setStatus\(\s*["']success["']\s*\)/,
    "book-appointment.tsx must use structured status: success"
  );
  assert.match(
    bookingCode,
    /setStatus\(\s*["']auth_required["']\s*\)/,
    "book-appointment.tsx must use structured status: auth_required"
  );
});

test("locale configuration defines default locale as tr and cookie as NEXT_LOCALE", () => {
  const cfg = fs.readFileSync("lib/locale-config.ts", "utf8");
  assert.match(cfg, /defaultLocale:\s*Locale\s*=\s*["']tr["']/);
  assert.match(cfg, /LOCALE_COOKIE\s*=\s*["']NEXT_LOCALE["']/);
});

test("multilingual search aliases map English terms to Turkish canonical specialties", () => {
  const code = fs.readFileSync("lib/search-aliases.ts", "utf8");
  assert.match(code, /Cardiology/);
  assert.match(code, /Dermatology/);
  assert.match(code, /Neurology/);
  assert.match(code, /resolveSearchSpecialties/);
});

test("tr.json and en.json dictionaries have 100% exact key parity", () => {
  const tr = JSON.parse(fs.readFileSync("messages/tr.json", "utf8"));
  const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));

  function getKeys(obj, prefix = "") {
    let keys = [];
    for (const k of Object.keys(obj)) {
      const full = prefix ? prefix + "." + k : k;
      if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
        keys.push(...getKeys(obj[k], full));
      } else {
        keys.push(full);
      }
    }
    return keys;
  }

  const trKeys = new Set(getKeys(tr));
  const enKeys = new Set(getKeys(en));

  const missingInEn = [...trKeys].filter((k) => !enKeys.has(k));
  const missingInTr = [...enKeys].filter((k) => !trKeys.has(k));

  assert.equal(missingInEn.length, 0, `Keys missing in en.json: ${missingInEn.join(", ")}`);
  assert.equal(missingInTr.length, 0, `Keys missing in tr.json: ${missingInTr.join(", ")}`);
});
