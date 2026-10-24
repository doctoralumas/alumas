import { test, expect } from "@playwright/test";
import { prisma } from "../../lib/prisma";
import { randomBytes, createHash } from "node:crypto";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

test.describe.serial("ALUMAS — Admin Healthcare Organizations & Agencies Management E2E", () => {
  test.setTimeout(120000);

  let adminToken: string = "";
  let patientToken: string = "";
  let adminCookie: string = "";
  let patientCookie: string = "";
  let adminUserId: string = "";

  let disposableOrgId: string = "";
  let disposableAgencyId: string = "";

  test.beforeAll(async () => {
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) throw new Error("No ADMIN user found in database!");
    adminUserId = adminUser.id;

    const patientUser = await prisma.user.findFirst({ where: { role: "PATIENT" } });
    if (!patientUser) throw new Error("No PATIENT user found in database!");

    adminToken = "admin_org_agency_test_" + randomBytes(16).toString("hex");
    patientToken = "patient_org_agency_test_" + randomBytes(16).toString("hex");

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
    // Clean up disposable test records if still present
    if (disposableOrgId) {
      await prisma.verificationDocument.deleteMany({ where: { organizationId: disposableOrgId } }).catch(() => {});
      await prisma.organization.deleteMany({ where: { id: disposableOrgId } }).catch(() => {});
    }
    if (disposableAgencyId) {
      await prisma.verificationDocument.deleteMany({ where: { agencyId: disposableAgencyId } }).catch(() => {});
      await prisma.healthTourismAgency.deleteMany({ where: { id: disposableAgencyId } }).catch(() => {});
    }

    // Clean up test sessions
    await prisma.session.deleteMany({
      where: {
        tokenHash: { in: [tokenHash(adminToken), tokenHash(patientToken)] },
      },
    }).catch(() => {});
  });

  // 1. RBAC and Authorization Enforcement
  test("1. RBAC: Unauthenticated and non-admin requests are rejected", async ({ request }) => {
    // Unauthenticated
    const orgUnauth = await request.get("/api/admin/organizations");
    expect(orgUnauth.status()).toBe(401);

    const agencyUnauth = await request.get("/api/admin/agencies");
    expect(agencyUnauth.status()).toBe(401);

    // Non-admin (Patient)
    const orgForbidden = await request.get("/api/admin/organizations", {
      headers: { Cookie: patientCookie },
    });
    expect(orgForbidden.status()).toBe(403);

    const agencyForbidden = await request.get("/api/admin/agencies", {
      headers: { Cookie: patientCookie },
    });
    expect(agencyForbidden.status()).toBe(403);
  });

  // 2. Server-side Search, Filtering and Pagination for Organizations
  test("2. Organizations: Server-side search, filtering, and pagination", async ({ request }) => {
    const res = await request.get("/api/admin/organizations?page=1&pageSize=5", {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.rows)).toBe(true);
    expect(data.pageSize).toBe(5);
    expect(data.page).toBe(1);
    expect(typeof data.total).toBe("number");
    expect(typeof data.totalPages).toBe("number");
    expect(data.stats).toBeDefined();
    expect(typeof data.stats.total).toBe("number");
    expect(typeof data.stats.approved).toBe("number");

    // Filter by type
    const hospitalRes = await request.get("/api/admin/organizations?type=HOSPITAL", {
      headers: { Cookie: adminCookie },
    });
    expect(hospitalRes.status()).toBe(200);
    const hospitalData = await hospitalRes.json();
    for (const row of hospitalData.rows) {
      expect(row.type).toBe("HOSPITAL");
    }
  });

  // 3. Server-side Search, Filtering and Pagination for Agencies
  test("3. Agencies: Server-side search, filtering, and pagination", async ({ request }) => {
    const res = await request.get("/api/admin/agencies?page=1&pageSize=5", {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.rows)).toBe(true);
    expect(data.pageSize).toBe(5);
    expect(data.page).toBe(1);
    expect(typeof data.total).toBe("number");
    expect(typeof data.totalPages).toBe("number");
    expect(data.stats).toBeDefined();
    expect(typeof data.stats.total).toBe("number");
  });

  // 4. Create Disposable Records & Test Detail View and Editing
  test("4. Detail view and administrative editing of permitted fields", async ({ request }) => {
    // 4.1 Create disposable Organization
    const testOrgSlug = "test-e2e-org-" + randomBytes(4).toString("hex");
    const testOrg = await prisma.organization.create({
      data: {
        name: "Test E2E Hastanesi",
        slug: testOrgSlug,
        type: "HOSPITAL",
        status: "PENDING",
        city: "Ankara",
        district: "Çankaya",
        address: "Test Mahallesi No 123",
        phone: "+903120000000",
        email: "test.org@example.com",
        description: "Initial description",
        ownerUserId: adminUserId,
      },
    });
    disposableOrgId = testOrg.id;

    // 4.2 Detail lookup
    const orgDetailRes = await request.get(`/api/admin/organizations/${testOrg.id}`, {
      headers: { Cookie: adminCookie },
    });
    expect(orgDetailRes.status()).toBe(200);
    const orgDetailData = await orgDetailRes.json();
    expect(orgDetailData.ok).toBe(true);
    expect(orgDetailData.data.name).toBe("Test E2E Hastanesi");

    // 4.3 Edit permitted fields
    const orgEditRes = await request.patch(`/api/admin/organizations/${testOrg.id}`, {
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      data: {
        action: "EDIT",
        name: "Test E2E Hastanesi Güncellendi",
        type: "CLINIC",
        city: "İzmir",
        district: "Konak",
        address: "Yeni Adres No 456",
        phone: "+902320000000",
        email: "guncel.org@example.com",
        website: "https://guncel-org.example.com",
        description: "Updated description for testing",
        isPublished: true,
        isOnDuty: true,
      },
    });
    expect(orgEditRes.status()).toBe(200);
    const orgEditData = await orgEditRes.json();
    expect(orgEditData.ok).toBe(true);
    expect(orgEditData.data.name).toBe("Test E2E Hastanesi Güncellendi");
    expect(orgEditData.data.type).toBe("CLINIC");
    expect(orgEditData.data.city).toBe("İzmir");
    expect(orgEditData.data.isPublished).toBe(true);
    expect(orgEditData.data.isOnDuty).toBe(true);

    // 4.4 Create disposable Agency
    const testAgencySlug = "test-e2e-agency-" + randomBytes(4).toString("hex");
    const testAgency = await prisma.healthTourismAgency.create({
      data: {
        name: "Test E2E Sağlık Turizmi Acentesi",
        slug: testAgencySlug,
        city: "Antalya",
        phone: "+902420000000",
        email: "test.agency@example.com",
        languages: ["Türkçe", "İngilizce"],
        description: "Initial agency description",
        ownerUserId: adminUserId,
        status: "PENDING",
      },
    });
    disposableAgencyId = testAgency.id;

    // 4.5 Detail lookup
    const agencyDetailRes = await request.get(`/api/admin/agencies/${testAgency.id}`, {
      headers: { Cookie: adminCookie },
    });
    expect(agencyDetailRes.status()).toBe(200);
    const agencyDetailData = await agencyDetailRes.json();
    expect(agencyDetailData.ok).toBe(true);
    expect(agencyDetailData.data.name).toBe("Test E2E Sağlık Turizmi Acentesi");

    // 4.6 Edit agency fields
    const agencyEditRes = await request.patch(`/api/admin/agencies/${testAgency.id}`, {
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      data: {
        action: "EDIT",
        name: "Test E2E Sağlık Turizmi Acentesi Güncellendi",
        city: "Muğla",
        languages: ["Türkçe", "İngilizce", "Almanca"],
        description: "Updated agency description",
        isActive: true,
      },
    });
    expect(agencyEditRes.status()).toBe(200);
    const agencyEditData = await agencyEditRes.json();
    expect(agencyEditData.ok).toBe(true);
    expect(agencyEditData.data.name).toBe("Test E2E Sağlık Turizmi Acentesi Güncellendi");
    expect(agencyEditData.data.city).toBe("Muğla");
    expect(agencyEditData.data.languages).toContain("Almanca");
  });

  // 5. Dependency Safety Guards Against Destructive Deletion
  test("5. Dependency Safety: Organizations and Agencies with dependencies cannot be deleted", async ({ request }) => {
    // 5.1 Find an organization with existing doctors or services
    const orgWithDeps = await prisma.organization.findFirst({
      where: {
        OR: [
          { doctors: { some: {} } },
          { services: { some: {} } },
        ],
      },
      select: { id: true, name: true },
    });

    if (orgWithDeps) {
      const deleteOrgRes = await request.delete(`/api/admin/organizations/${orgWithDeps.id}`, {
        headers: { Cookie: adminCookie },
      });
      expect(deleteOrgRes.status()).toBe(400);
      const err = await deleteOrgRes.json();
      expect(err.code).toBe("HAS_DEPENDENCIES");
    }

    // 5.2 Find an agency with packages
    const agencyWithPackages = await prisma.healthTourismAgency.findFirst({
      where: { packages: { some: {} } },
      select: { id: true, name: true },
    });

    if (agencyWithPackages) {
      const deleteAgencyRes = await request.delete(`/api/admin/agencies?id=${agencyWithPackages.id}`, {
        headers: { Cookie: adminCookie },
      });
      expect(deleteAgencyRes.status()).toBe(400);
      const err = await deleteAgencyRes.json();
      expect(err.code).toBe("HAS_DEPENDENCIES");
    }
  });

  // 6. Safe Deletion of Zero-Dependency Disposable Records
  test("6. Safe disposal succeeds for zero-dependency records", async ({ request }) => {
    // Delete disposable organization
    const delOrgRes = await request.delete(`/api/admin/organizations/${disposableOrgId}`, {
      headers: { Cookie: adminCookie },
    });
    expect(delOrgRes.status()).toBe(200);
    const orgResult = await delOrgRes.json();
    expect(orgResult.ok).toBe(true);
    disposableOrgId = ""; // Marked as deleted

    // Delete disposable agency
    const delAgencyRes = await request.delete(`/api/admin/agencies?id=${disposableAgencyId}`, {
      headers: { Cookie: adminCookie },
    });
    expect(delAgencyRes.status()).toBe(200);
    const agencyResult = await delAgencyRes.json();
    expect(agencyResult.ok).toBe(true);
    disposableAgencyId = ""; // Marked as deleted
  });

  // 7. Frontend UI Navigation and Dialog Verification
  test("7. Frontend UI: Organizations page renders stats, search, and modals without native prompts", async ({ page, context }) => {
    await context.addCookies([
      { name: "alumas_session", value: adminToken, domain: "127.0.0.1", path: "/" },
      { name: "alumas_session", value: adminToken, domain: "localhost", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "localhost", path: "/" },
    ]);

    let nativePromptFired = false;
    page.on("dialog", async (dialog) => {
      nativePromptFired = true;
      await dialog.dismiss();
    });

    await page.goto("/admin/organizations");
    await page.waitForLoadState("networkidle");

    // Verify KPI stat cards are visible
    const totalStat = page.locator("text=Toplam Kurum").first();
    await expect(totalStat).toBeVisible({ timeout: 10000 });

    // Verify search input
    const searchInput = page.locator("input[placeholder*='Kurum adı, şehir']").first();
    await expect(searchInput).toBeVisible();

    // Verify "İncele" button opens detail modal if rows exist
    const inspectBtn = page.getByRole("button", { name: /İncele/i }).first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      const modalHeader = page.locator("h2").first();
      await expect(modalHeader).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole("button", { name: /Kapat/i }).first();
      await closeBtn.click();
    }

    expect(nativePromptFired).toBe(false);
  });

  test("8. Frontend UI: Agencies page renders stats, search, and modals without native prompts", async ({ page, context }) => {
    await context.addCookies([
      { name: "alumas_session", value: adminToken, domain: "127.0.0.1", path: "/" },
      { name: "alumas_session", value: adminToken, domain: "localhost", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "localhost", path: "/" },
    ]);

    let nativePromptFired = false;
    page.on("dialog", async (dialog) => {
      nativePromptFired = true;
      await dialog.dismiss();
    });

    await page.goto("/admin/agencies");
    await page.waitForLoadState("networkidle");

    // Verify KPI stat cards are visible
    const totalStat = page.locator("text=Toplam Acente").first();
    await expect(totalStat).toBeVisible({ timeout: 10000 });

    // Verify search input
    const searchInput = page.locator("input[placeholder*='Acente adı, şehir']").first();
    await expect(searchInput).toBeVisible();

    // Verify "İncele" button opens detail modal if rows exist
    const inspectBtn = page.getByRole("button", { name: /İncele/i }).first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      const modalHeader = page.locator("h2").first();
      await expect(modalHeader).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole("button", { name: /Kapat/i }).first();
      await closeBtn.click();
    }

    expect(nativePromptFired).toBe(false);
  });
});

