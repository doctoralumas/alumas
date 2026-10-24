import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(rel) {
  return fs.readFileSync(path.resolve(rel), "utf8");
}

function isAdminUser(user) {
  return user?.role === "ADMIN";
}

test("Admin v2 Phase 2.1 — Centralized Admin Authorization", async (t) => {
  await t.test("isAdminUser correctly classifies roles", () => {
    assert.equal(isAdminUser({ role: "ADMIN" }), true);
    assert.equal(isAdminUser({ role: "DOCTOR" }), false);
    assert.equal(isAdminUser({ role: "PATIENT" }), false);
    assert.equal(isAdminUser({ role: "INSTITUTION_STAFF" }), false);
    assert.equal(isAdminUser(null), false);
    assert.equal(isAdminUser(undefined), false);
    assert.equal(isAdminUser({}), false);
  });

  await t.test("All 21 admin API routes import requireAdmin from lib/admin-auth", () => {
    const adminRoutes = [
      "app/api/admin/agencies/route.ts",
      "app/api/admin/agencies/[id]/route.ts",
      "app/api/admin/appointments/route.ts",
      "app/api/admin/appointments/[id]/route.ts",
      "app/api/admin/audit/route.ts",
      "app/api/admin/content/route.ts",
      "app/api/admin/doctors/route.ts",
      "app/api/admin/doctors/[id]/route.ts",
      "app/api/admin/doctors/claims/route.ts",
      "app/api/admin/doctors/claims/[id]/route.ts",
      "app/api/admin/doctors/directory/route.ts",
      "app/api/admin/doctors/directory/[id]/route.ts",
      "app/api/admin/ops/route.ts",
      "app/api/admin/organizations/route.ts",
      "app/api/admin/organizations/[id]/route.ts",
      "app/api/admin/organizations/[id]/file/route.ts",
      "app/api/admin/release-status/route.ts",
      "app/api/admin/reviews/route.ts",
      "app/api/admin/users/route.ts",
      "app/api/admin/users/[id]/route.ts",
      "app/api/admin/verification-documents/[id]/route.ts",
    ];

    for (const routePath of adminRoutes) {
      const code = read(routePath);
      assert.match(
        code,
        /from\s+["']@\/lib\/admin-auth["']/,
        `${routePath} must import from @/lib/admin-auth`
      );
      assert.match(
        code,
        /requireAdmin\(\)/,
        `${routePath} must invoke requireAdmin()`
      );
      // Ensure no obsolete ad-hoc helpers remain
      assert.doesNotMatch(
        code,
        /async\s+function\s+ok\(\)/,
        `${routePath} must not have ad-hoc ok() helper`
      );
      assert.doesNotMatch(
        code,
        /async\s+function\s+adminUser\(\)/,
        `${routePath} must not have ad-hoc adminUser() helper`
      );
    }
  });
});

test("Admin v2 Phase 2.1 — Standardized Action Dialogs & Zero Native Prompts", async (t) => {
  await t.test("Reusable Admin UI foundation components exist", () => {
    assert.ok(fs.existsSync("components/admin/admin-confirm-dialog.tsx"), "AdminConfirmDialog exists");
    assert.ok(fs.existsSync("components/admin/admin-status-badge.tsx"), "AdminStatusBadge exists");
    assert.ok(fs.existsSync("components/admin/admin-callout.tsx"), "AdminCallout exists");
  });

  await t.test("Zero prompt() or confirm() in active admin components", () => {
    const adminComponents = [
      "components/admin-review-moderation.tsx",
      "components/admin-organizations.tsx",
      "components/admin-verification-documents.tsx",
      "components/admin-doctor-list.tsx",
      "components/admin-agency-list.tsx",
    ];

    for (const compPath of adminComponents) {
      const code = read(compPath);
      assert.doesNotMatch(
        code,
        /\bprompt\s*\(/,
        `${compPath} must not use window.prompt()`
      );
      assert.doesNotMatch(
        code,
        /\bconfirm\s*\(/,
        `${compPath} must not use window.confirm()`
      );
    }
  });

  await t.test("AdminConfirmDialog handles keyboard accessibility and ARIA semantics", () => {
    const dialogCode = read("components/admin/admin-confirm-dialog.tsx");
    assert.match(dialogCode, /role="dialog"/);
    assert.match(dialogCode, /aria-modal="true"/);
    assert.match(dialogCode, /aria-labelledby/);
    assert.match(dialogCode, /Escape/);
    assert.match(dialogCode, /adminDialogIn/);
  });
});

test("Admin v2 Phase 2.1 — Destructive-Action Dependency Safety", async (t) => {
  await t.test("Content Category deletion protects system categories and checks dependencies", () => {
    const contentRoute = read("app/api/admin/content/route.ts");
    // System category guard
    assert.match(contentRoute, /saglik-hizmetleri/);
    assert.match(contentRoute, /PROTECTED_SYSTEM_CATEGORY/);

    // Dependency check for packages and lab tests
    assert.match(contentRoute, /prisma\.healthTourismPackage\.count/);
    assert.match(contentRoute, /prisma\.laboratoryTest\.count/);
    assert.match(contentRoute, /HAS_DEPENDENCIES/);

    // Banner existence check
    assert.match(contentRoute, /prisma\.homeBanner\.findUnique/);
  });

  await t.test("Doctors, Organizations, and Agencies preserve dependency guards", () => {
    const doctorRoute = read("app/api/admin/doctors/[id]/route.ts");
    assert.match(doctorRoute, /HAS_DEPENDENCIES/);
    assert.match(doctorRoute, /clinicalDependencyCount/);

    const orgRoute = read("app/api/admin/organizations/[id]/route.ts");
    assert.match(orgRoute, /HAS_DEPENDENCIES/);
    assert.match(orgRoute, /depCount/);

    const agencyRoute = read("app/api/admin/agencies/route.ts");
    assert.match(agencyRoute, /HAS_DEPENDENCIES/);
    assert.match(agencyRoute, /_count\.packages\s*>\s*0/);
  });
});
