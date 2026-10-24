import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(rel) {
  return fs.readFileSync(path.resolve(rel), "utf8");
}

test("Admin Organizations & Agencies Management Contract", async (t) => {
  await t.test("Backend routes require centralized admin authorization", () => {
    const orgRoutes = [
      "app/api/admin/organizations/route.ts",
      "app/api/admin/organizations/[id]/route.ts",
      "app/api/admin/agencies/route.ts",
      "app/api/admin/agencies/[id]/route.ts",
    ];

    for (const route of orgRoutes) {
      const code = read(route);
      assert.match(code, /from\s+["']@\/lib\/admin-auth["']/);
      assert.match(code, /requireAdmin\(\)/);
    }
  });

  await t.test("Organizations backend implements server-side search, multi-criteria filtering, and pagination", () => {
    const orgRoute = read("app/api/admin/organizations/route.ts");
    assert.match(orgRoute, /url\.searchParams\.get\(["']q["']\)/);
    assert.match(orgRoute, /url\.searchParams\.get\(["']status["']\)/);
    assert.match(orgRoute, /url\.searchParams\.get\(["']type["']\)/);
    assert.match(orgRoute, /url\.searchParams\.get\(["']city["']\)/);
    assert.match(orgRoute, /url\.searchParams\.get\(["']page["']\)/);
    assert.match(orgRoute, /url\.searchParams\.get\(["']pageSize["']\)/);
    assert.match(orgRoute, /totalPages/);
    assert.match(orgRoute, /stats:/);
    assert.match(orgRoute, /pending:/);
    assert.match(orgRoute, /approved:/);
    assert.match(orgRoute, /suspended:/);
    assert.match(orgRoute, /rejected:/);
  });

  await t.test("Agencies backend implements server-side search, filtering, and pagination", () => {
    const agencyRoute = read("app/api/admin/agencies/route.ts");
    assert.match(agencyRoute, /url\.searchParams\.get\(["']q["']\)/);
    assert.match(agencyRoute, /url\.searchParams\.get\(["']status["']\)/);
    assert.match(agencyRoute, /url\.searchParams\.get\(["']city["']\)/);
    assert.match(agencyRoute, /url\.searchParams\.get\(["']page["']\)/);
    assert.match(agencyRoute, /totalPages/);
    assert.match(agencyRoute, /stats:/);
    assert.match(agencyRoute, /approved:/);
    assert.match(agencyRoute, /pending:/);
    assert.match(agencyRoute, /rejected:/);
  });

  await t.test("Organizations and Agencies detail endpoints provide full relation inspection", () => {
    const orgDetailRoute = read("app/api/admin/organizations/[id]/route.ts");
    assert.match(orgDetailRoute, /export async function GET/);
    assert.match(orgDetailRoute, /verificationDocuments/);
    assert.match(orgDetailRoute, /doctors/);
    assert.match(orgDetailRoute, /services/);
    assert.match(orgDetailRoute, /_count/);

    const agencyDetailRoute = read("app/api/admin/agencies/[id]/route.ts");
    assert.match(agencyDetailRoute, /export async function GET/);
    assert.match(agencyDetailRoute, /verificationDocuments/);
    assert.match(agencyDetailRoute, /packages/);
  });

  await t.test("Administrative field editing is audited and validated", () => {
    const orgIdRoute = read("app/api/admin/organizations/[id]/route.ts");
    assert.match(orgIdRoute, /action === ["']EDIT["']/);
    assert.match(orgIdRoute, /organization\.updated/);

    const agencyRoute = read("app/api/admin/agencies/route.ts");
    assert.match(agencyRoute, /action === ["']EDIT["']/);
    assert.match(agencyRoute, /agency\.updated/);

    const agencyIdRoute = read("app/api/admin/agencies/[id]/route.ts");
    assert.match(agencyIdRoute, /action === ["']EDIT["']/);
    assert.match(agencyIdRoute, /agency\.updated/);
  });

  await t.test("Guarded deletion blocks entities with active clinical or package dependencies", () => {
    const orgIdRoute = read("app/api/admin/organizations/[id]/route.ts");
    assert.match(orgIdRoute, /HAS_DEPENDENCIES/);
    assert.match(orgIdRoute, /depCount/);
    assert.match(orgIdRoute, /organization\.deleted/);

    const agencyRoute = read("app/api/admin/agencies/route.ts");
    assert.match(agencyRoute, /HAS_DEPENDENCIES/);
    assert.match(agencyRoute, /_count\.packages\s*>\s*0/);
    assert.match(agencyRoute, /agency\.deleted/);

    const agencyIdRoute = read("app/api/admin/agencies/[id]/route.ts");
    assert.match(agencyIdRoute, /HAS_DEPENDENCIES/);
    assert.match(agencyIdRoute, /_count\.packages\s*>\s*0/);
    assert.match(agencyIdRoute, /agency\.deleted/);
  });

  await t.test("Frontend components use AdminConfirmDialog and zero native prompts or alerts", () => {
    const orgComp = read("components/admin-organizations.tsx");
    assert.match(orgComp, /AdminConfirmDialog/);
    assert.match(orgComp, /AdminStatusBadge/);
    assert.doesNotMatch(orgComp, /\bprompt\s*\(/);
    assert.doesNotMatch(orgComp, /\bconfirm\s*\(/);
    assert.doesNotMatch(orgComp, /\balert\s*\(/);

    const agencyComp = read("components/admin-agency-list.tsx");
    assert.match(agencyComp, /AdminConfirmDialog/);
    assert.match(agencyComp, /AdminStatusBadge/);
    assert.doesNotMatch(agencyComp, /\bprompt\s*\(/);
    assert.doesNotMatch(agencyComp, /\bconfirm\s*\(/);
    assert.doesNotMatch(agencyComp, /\balert\s*\(/);
  });
});

