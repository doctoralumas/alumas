import { test, expect } from "@playwright/test";
import { prisma } from "../../lib/prisma";
import { randomBytes, createHash } from "node:crypto";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

test.describe.serial("ALUMAS Admin v2 — Phase 2.1 Security & Dialog Verification", () => {
  test.setTimeout(90000);

  let adminToken = "";
  let patientToken = "";
  let adminCookie = "";
  let patientCookie = "";

  test.beforeAll(async () => {
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) throw new Error("No ADMIN user found in database!");

    const patientUser = await prisma.user.findFirst({ where: { role: "PATIENT" } });
    if (!patientUser) throw new Error("No PATIENT user found in database!");

    adminToken = "admin_phase21_test_" + randomBytes(16).toString("hex");
    patientToken = "patient_phase21_test_" + randomBytes(16).toString("hex");

    await prisma.session.createMany({
      data: [
        {
          userId: adminUser.id,
          tokenHash: tokenHash(adminToken),
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId: patientUser.id,
          tokenHash: tokenHash(patientToken),
          expiresAt: new Date(Date.now() + 3600000),
        },
      ],
    });

    adminCookie = `alumas_session=${adminToken}`;
    patientCookie = `alumas_session=${patientToken}`;
  });

  test.afterAll(async () => {
    await prisma.session.deleteMany({
      where: {
        tokenHash: { in: [tokenHash(adminToken), tokenHash(patientToken)] },
      },
    });
  });

  test("1. Unauthenticated requests are rejected with 401 AUTH_REQUIRED", async ({ request }) => {
    const endpoints = [
      "/api/admin/agencies",
      "/api/admin/content",
      "/api/admin/doctors",
      "/api/admin/organizations",
      "/api/admin/reviews",
      "/api/admin/ops",
      "/api/admin/audit",
    ];

    for (const url of endpoints) {
      const res = await request.get(url);
      expect(res.status(), `GET ${url} must return 401`).toBe(401);
      const json = await res.json().catch(() => ({}));
      expect(json.code).toBe("AUTH_REQUIRED");
      expect(json.ok).toBe(false);
    }
  });

  test("2. Non-admin authenticated users are rejected with 403 FORBIDDEN", async ({ request }) => {
    const endpoints = [
      "/api/admin/agencies",
      "/api/admin/content",
      "/api/admin/doctors",
      "/api/admin/organizations",
      "/api/admin/reviews",
      "/api/admin/ops",
      "/api/admin/audit",
    ];

    for (const url of endpoints) {
      const res = await request.get(url, {
        headers: { Cookie: patientCookie },
      });
      expect(res.status(), `GET ${url} with PATIENT role must return 403`).toBe(403);
      const json = await res.json().catch(() => ({}));
      expect(json.code).toBe("FORBIDDEN");
      expect(json.ok).toBe(false);
    }
  });

  test("3. Authenticated administrators access endpoints successfully", async ({ request }) => {
    const endpoints = [
      "/api/admin/agencies",
      "/api/admin/content",
      "/api/admin/doctors",
      "/api/admin/organizations",
      "/api/admin/reviews",
      "/api/admin/ops",
      "/api/admin/audit",
    ];

    for (const url of endpoints) {
      const res = await request.get(url, {
        headers: { Cookie: adminCookie },
      });
      expect(res.status(), `GET ${url} with ADMIN role must return 200`).toBe(200);
    }
  });

  test("4. Content Category deletion security: system categories are protected", async ({ request }) => {
    // Find system category
    const systemCat = await prisma.contentCategory.findFirst({
      where: { slug: "saglik-hizmetleri" },
    });

    if (systemCat) {
      const res = await request.delete(`/api/admin/content?kind=category&id=${systemCat.id}`, {
        headers: { Cookie: adminCookie },
      });
      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("PROTECTED_SYSTEM_CATEGORY");
    }
  });

  test("5. Content Category deletion security: active dependencies block deletion", async ({ request }) => {
    const disposableSlug = "test-cat-" + randomBytes(4).toString("hex");

    // Create temporary category
    const tempCat = await prisma.contentCategory.create({
      data: {
        name: "Test Destructive Guard " + disposableSlug,
        slug: disposableSlug,
        kind: "service",
        templateKey: "test",
      },
    });

    // Create a temporary health tourism package referencing this category
    const tempPackage = await prisma.healthTourismPackage.create({
      data: {
        title: "Test Guard Package " + disposableSlug,
        slug: "pkg-" + disposableSlug,
        category: disposableSlug,
        city: "Istanbul",
        providerName: "Test Provider",
        description: "Dependency check package",
      },
    });

    try {
      // 1. Attempt to delete category when dependency exists
      const resBlocked = await request.delete(`/api/admin/content?kind=category&id=${tempCat.id}`, {
        headers: { Cookie: adminCookie },
      });
      expect(resBlocked.status()).toBe(400);
      const jsonBlocked = await resBlocked.json();
      expect(jsonBlocked.code).toBe("HAS_DEPENDENCIES");
      expect(jsonBlocked.dependencies.packages).toBe(1);

      // 2. Remove the dependency
      await prisma.healthTourismPackage.delete({ where: { id: tempPackage.id } });

      // 3. Now category deletion succeeds safely
      const resSuccess = await request.delete(`/api/admin/content?kind=category&id=${tempCat.id}`, {
        headers: { Cookie: adminCookie },
      });
      expect(resSuccess.status()).toBe(200);
      const jsonSuccess = await resSuccess.json();
      expect(jsonSuccess.ok).toBe(true);

      // Confirm category is gone from database
      const recheck = await prisma.contentCategory.findUnique({ where: { id: tempCat.id } });
      expect(recheck).toBeNull();
    } finally {
      // Cleanup safety
      await prisma.healthTourismPackage.deleteMany({ where: { slug: "pkg-" + disposableSlug } });
      await prisma.contentCategory.deleteMany({ where: { slug: disposableSlug } });
    }
  });

  test("6. Browser dialog interaction and accessibility on Admin Review Moderation", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "alumas_session",
        value: adminToken,
        domain: "127.0.0.1",
        path: "/",
        httpOnly: true,
      },
    ]);

    await page.goto("http://127.0.0.1:3000/admin/reviews");
    await page.waitForLoadState("networkidle");

    // Check if any reviews exist
    const rejectButtons = page.locator(".review-moderation-row button.secondary");
    const count = await rejectButtons.count();

    if (count > 0) {
      // Click first reject button
      await rejectButtons.first().click();

      // Ensure AdminConfirmDialog opened
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("aria-modal", "true");

      // Verify reason textarea is present and interactive
      const reasonInput = dialog.locator("textarea#admin-dialog-reason");
      await expect(reasonInput).toBeVisible();
      await reasonInput.fill("Automated Phase 2.1 Dialog Verification");

      // Test Escape key cancels cleanly
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
  });
});
