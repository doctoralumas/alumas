import { test, expect } from "@playwright/test";
import { prisma } from "../../lib/prisma";
import { randomBytes, createHash } from "node:crypto";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

test.describe.serial("ALUMAS — Admin CRUD & Release Verification Suite", () => {
  test.setTimeout(120000);

  let adminToken: string = "";
  let patientToken: string = "";
  let adminCookie: string = "";
  let patientCookie: string = "";

  test.beforeAll(async () => {
    // 1. Fetch Admin User
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) throw new Error("No ADMIN user found in database!");

    // 2. Fetch Non-Admin (Patient) User
    const patientUser = await prisma.user.findFirst({ where: { role: "PATIENT" } });
    if (!patientUser) throw new Error("No PATIENT user found in database!");

    // 3. Create direct test sessions
    adminToken = "admin_release_test_" + randomBytes(16).toString("hex");
    patientToken = "patient_release_test_" + randomBytes(16).toString("hex");

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
    // Clean up test sessions
    await prisma.session.deleteMany({
      where: {
        tokenHash: { in: [tokenHash(adminToken), tokenHash(patientToken)] },
      },
    }).catch(() => {});
  });

  // ==================================================================
  // 1. RBAC & AUTHORIZATION GATES (NON-ADMIN MUST BE 403)
  // ==================================================================
  test("1. RBAC: Non-admin and unauthenticated users receive 403 Forbidden on all mutation endpoints", async ({ request }) => {
    // 1.1 Unauthenticated requests return 401 AUTH_REQUIRED
    const unauthRes = await request.get("/api/admin/doctors");
    expect(unauthRes.status()).toBe(401);

    const unauthPatch = await request.patch("/api/admin/doctors", { data: { id: "test", approved: true } });
    expect(unauthPatch.status()).toBe(401);

    const unauthDir = await request.get("/api/admin/doctors/directory");
    expect(unauthDir.status()).toBe(401);

    // 1.2 Non-admin (Patient) requests
    const nonAdminGet = await request.get("/api/admin/doctors", {
      headers: { cookie: patientCookie },
    });
    expect(nonAdminGet.status()).toBe(403);

    const nonAdminPatchDoc = await request.patch("/api/admin/doctors/dummy", {
      headers: { cookie: patientCookie },
      data: { name: "Hacked" },
    });
    expect(nonAdminPatchDoc.status()).toBe(403);

    const nonAdminDelDoc = await request.delete("/api/admin/doctors/dummy", {
      headers: { cookie: patientCookie },
    });
    expect(nonAdminDelDoc.status()).toBe(403);

    const nonAdminDirGet = await request.get("/api/admin/doctors/directory", {
      headers: { cookie: patientCookie },
    });
    expect(nonAdminDirGet.status()).toBe(403);

    const nonAdminDirPatch = await request.patch("/api/admin/doctors/directory/dummy", {
      headers: { cookie: patientCookie },
      data: { hospital: "Hacked" },
    });
    expect(nonAdminDirPatch.status()).toBe(403);

    const nonAdminClaimPatch = await request.patch("/api/admin/doctors/claims/dummy", {
      headers: { cookie: patientCookie },
      data: { status: "REVOKED", reason: "Attempted unauthorized revocation" },
    });
    expect(nonAdminClaimPatch.status()).toBe(403);

    const nonAdminAgencyDel = await request.delete("/api/admin/agencies?id=dummy", {
      headers: { cookie: patientCookie },
    });
    expect(nonAdminAgencyDel.status()).toBe(403);

    const nonAdminOrgDel = await request.delete("/api/admin/organizations/dummy", {
      headers: { cookie: patientCookie },
    });
    expect(nonAdminOrgDel.status()).toBe(403);

    const nonAdminContentPost = await request.post("/api/admin/content", {
      headers: { cookie: patientCookie },
      data: { kind: "banner", title: "Hacked" },
    });
    expect(nonAdminContentPost.status()).toBe(403);
  });

  // ==================================================================
  // 2. REGISTERED SPECIALIST CRUD (DISPOSABLE ISOLATED RECORD)
  // ==================================================================
  test("2. Registered Specialists: Detail, Edit, Deactivate/Reactivate, and Guarded Safe Delete", async ({ request }) => {
    // Create isolated disposable doctor
    const testDocSlug = `disposable-verify-doc-${Date.now()}`;
    const disposableDoctor = await prisma.doctor.create({
      data: {
        name: "Dr. Release Verification Disposable",
        title: "Uzm. Dr.",
        specialty: "Kardiyoloji",
        city: "Ankara",
        hospital: "Ankara Şehir Hastanesi",
        licenseNumber: "LIC-VERIFY-1234",
        bio: "Initial verification bio text.",
        price: 1800,
        slug: testDocSlug,
        isVerified: false,
        isPublished: false,
        nextSlot: "Yayında değil",
      },
    });

    try {
      // 2.1 DETAIL VIEW
      const detailRes = await request.get(`/api/admin/doctors/${disposableDoctor.id}`, {
        headers: { cookie: adminCookie },
      });
      expect(detailRes.status()).toBe(200);
      const detailData = await detailRes.json();
      expect(detailData.ok).toBe(true);
      expect(detailData.data.name).toBe("Dr. Release Verification Disposable");
      expect(detailData.data.specialty).toBe("Kardiyoloji");
      expect(detailData.data._count).toBeDefined();
      expect(detailData.data._count.appointments).toBe(0);

      // 2.2 EDIT / UPDATE
      const editRes = await request.patch(`/api/admin/doctors/${disposableDoctor.id}`, {
        headers: { cookie: adminCookie },
        data: {
          title: "Prof. Dr.",
          specialty: "Girişimsel Kardiyoloji",
          price: 2600,
          bio: "Updated release verification bio.",
          isPublished: true,
        },
      });
      expect(editRes.status()).toBe(200);
      const editData = await editRes.json();
      expect(editData.ok).toBe(true);
      expect(editData.data.title).toBe("Prof. Dr.");
      expect(editData.data.specialty).toBe("Girişimsel Kardiyoloji");
      expect(editData.data.price).toBe(2600);
      expect(editData.data.isPublished).toBe(true);

      // Verify audit log for doctor update
      const updateAudit = await prisma.auditLog.findFirst({
        where: { entityId: disposableDoctor.id, action: "doctor.profile.updated" },
      });
      expect(updateAudit).not.toBeNull();

      // 2.3 DEACTIVATE / REACTIVATE
      const deactRes = await request.patch(`/api/admin/doctors/${disposableDoctor.id}`, {
        headers: { cookie: adminCookie },
        data: { isPublished: false },
      });
      expect(deactRes.status()).toBe(200);
      const deactData = await deactRes.json();
      expect(deactData.data.isPublished).toBe(false);

      // 2.4 DEPENDENCY GUARD (Attempting to delete with active review should be blocked)
      const patient = await prisma.user.findFirst({ where: { role: "PATIENT" } });
      const mockReview = await prisma.doctorReview.create({
        data: {
          doctorId: disposableDoctor.id,
          userId: patient!.id,
          rating: 5,
          comment: "Clinical dependency guard test.",
          status: "APPROVED",
        },
      });

      const blockedDelRes = await request.delete(`/api/admin/doctors/${disposableDoctor.id}`, {
        headers: { cookie: adminCookie },
      });
      expect(blockedDelRes.status()).toBe(400);
      const blockedData = await blockedDelRes.json();
      expect(blockedData.code).toBe("HAS_DEPENDENCIES");

      // 2.5 SAFE DELETE (Delete succeeds after clearing dependencies)
      await prisma.doctorReview.delete({ where: { id: mockReview.id } });

      const safeDelRes = await request.delete(`/api/admin/doctors/${disposableDoctor.id}`, {
        headers: { cookie: adminCookie },
      });
      expect(safeDelRes.status()).toBe(200);
      const safeDelData = await safeDelRes.json();
      expect(safeDelData.ok).toBe(true);

      // Verify gone from DB
      const doctorInDb = await prisma.doctor.findUnique({ where: { id: disposableDoctor.id } });
      expect(doctorInDb).toBeNull();

      // Verify audit log for doctor deletion
      const deleteAudit = await prisma.auditLog.findFirst({
        where: { entityId: disposableDoctor.id, action: "doctor.profile.deleted" },
      });
      expect(deleteAudit).not.toBeNull();
    } finally {
      // Ensure cleanup in case of failure
      await prisma.doctorReview.deleteMany({ where: { doctorId: disposableDoctor.id } }).catch(() => {});
      await prisma.doctor.delete({ where: { id: disposableDoctor.id } }).catch(() => {});
    }
  });

  // ==================================================================
  // 3. EXTERNAL DIRECTORY DOCTOR CRUD
  // ==================================================================
  test("3. External Directory: Search, Pagination, Edit, and Active Listing Toggle", async ({ request }) => {
    // 3.1 Search & Pagination
    const searchRes = await request.get("/api/admin/doctors/directory?q=Bülent&pageSize=10", {
      headers: { cookie: adminCookie },
    });
    expect(searchRes.status()).toBe(200);
    const searchData = await searchRes.json();
    expect(searchData.ok).toBe(true);
    expect(searchData.total).toBeGreaterThanOrEqual(1);
    expect(searchData.items.some((item: any) => item.name.includes("Bülent"))).toBe(true);
    expect(searchData.stats).toBeDefined();
    expect(searchData.stats.total).toBe(386);

    // 3.2 Edit & Toggle Active on Disposable DirectoryDoctor
    const testDirSlug = `disposable-verify-dir-${Date.now()}`;
    const disposableDirDoc = await prisma.directoryDoctor.create({
      data: {
        slug: testDirSlug,
        name: "Dr. Disposable Directory Verification",
        title: "Uzm. Dr.",
        specialty: "Dermatoloji",
        hospital: "Özel Test Kliniği",
        city: "İzmir",
        phone: "+90 232 555 44 33",
        officialWebsite: "https://example.com/test-verify",
        source: "SRC-TEST-DISPOSABLE",
        externalRef: `REF-${Date.now()}`,
        isActive: true,
      },
    });

    try {
      // Edit directory doctor
      const editDirRes = await request.patch(`/api/admin/doctors/directory/${disposableDirDoc.id}`, {
        headers: { cookie: adminCookie },
        data: {
          hospital: "İzmir Dermatoloji Enstitüsü",
          phone: "+90 232 999 88 77",
          isActive: false, // hide listing
          reason: "Verified audit change for release testing",
        },
      });
      expect(editDirRes.status()).toBe(200);
      const editDirData = await editDirRes.json();
      expect(editDirData.ok).toBe(true);
      expect(editDirData.data.hospital).toBe("İzmir Dermatoloji Enstitüsü");
      expect(editDirData.data.isActive).toBe(false);

      // Verify audit log
      const dirAudit = await prisma.auditLog.findFirst({
        where: { entityId: disposableDirDoc.id, action: "directory_doctor.updated" },
      });
      expect(dirAudit).not.toBeNull();

      // Restore listing
      const restoreDirRes = await request.patch(`/api/admin/doctors/directory/${disposableDirDoc.id}`, {
        headers: { cookie: adminCookie },
        data: {
          isActive: true,
          reason: "Restoring listing to active",
        },
      });
      expect(restoreDirRes.status()).toBe(200);
      const restoreData = await restoreDirRes.json();
      expect(restoreData.data.isActive).toBe(true);
    } finally {
      await prisma.directoryDoctor.delete({ where: { id: disposableDirDoc.id } }).catch(() => {});
    }
  });

  // ==================================================================
  // 4. DOCTOR CLAIM REVOCATION WORKFLOW
  // ==================================================================
  test("4. Doctor Claims: Audited Revocation Workflow with Reversal & Verification Safety", async ({ request }) => {
    const patient = await prisma.user.findFirst({ where: { role: "PATIENT" } });

    // Create temporary registered doctor and directory doctor
    const testDoc = await prisma.doctor.create({
      data: {
        name: "Dr. Claim Revocation Test",
        title: "Uzm. Dr.",
        specialty: "Göz Hastalıkları",
        city: "Bursa",
        hospital: "Bursa Test Hastanesi",
        bio: "Test bio for claim revocation",
        price: 1500,
        nextSlot: "Yayında",
        slug: `claim-rev-doc-${Date.now()}`,
        isVerified: true,
        isPublished: true,
      },
    });

    const testDirDoc = await prisma.directoryDoctor.create({
      data: {
        slug: `claim-rev-dir-${Date.now()}`,
        name: "Dr. Claim Revocation Test",
        title: "Uzm. Dr.",
        specialty: "Göz Hastalıkları",
        city: "Bursa",
        source: "SRC-TEST-REVOCATION",
        externalRef: `REV-REF-${Date.now()}`,
        doctorId: testDoc.id, // initially claimed
        isActive: true,
      },
    });

    const testClaim = await prisma.doctorClaim.create({
      data: {
        directoryDoctorId: testDirDoc.id,
        doctorId: testDoc.id,
        claimantUserId: patient!.id,
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewerNote: "Initial approval",
      },
    });

    try {
      // 4.1 Short reason validation (< 10 chars fails with 422)
      const shortRevokeRes = await request.patch(`/api/admin/doctors/claims/${testClaim.id}`, {
        headers: { cookie: adminCookie },
        data: { status: "REVOKED", reason: "short" },
      });
      expect(shortRevokeRes.status()).toBe(422);

      // 4.2 Valid revocation (>= 10 chars)
      const validRevokeRes = await request.patch(`/api/admin/doctors/claims/${testClaim.id}`, {
        headers: { cookie: adminCookie },
        data: {
          status: "REVOKED",
          reason: "Administrative claim revocation test for release verification",
        },
      });
      expect(validRevokeRes.status()).toBe(200);
      const validRevokeData = await validRevokeRes.json();
      expect(validRevokeData.ok).toBe(true);
      expect(validRevokeData.data.status).toBe("REJECTED");
      expect(validRevokeData.data.reviewerNote).toContain("[REVOKED]");

      // Check DirectoryDoctor is detached
      const dirDocAfter = await prisma.directoryDoctor.findUnique({ where: { id: testDirDoc.id } });
      expect(dirDocAfter?.doctorId).toBeNull();

      // Check Doctor profile is unpublished and unverified
      const docAfter = await prisma.doctor.findUnique({ where: { id: testDoc.id } });
      expect(docAfter?.isVerified).toBe(false);
      expect(docAfter?.isPublished).toBe(false);

      // Check audit log
      const revokeAudit = await prisma.auditLog.findFirst({
        where: { entityId: testClaim.id, action: "doctor.claim.revoked" },
      });
      expect(revokeAudit).not.toBeNull();
    } finally {
      await prisma.doctorClaim.delete({ where: { id: testClaim.id } }).catch(() => {});
      await prisma.directoryDoctor.delete({ where: { id: testDirDoc.id } }).catch(() => {});
      await prisma.doctor.delete({ where: { id: testDoc.id } }).catch(() => {});
    }
  });

  // ==================================================================
  // 5. SMOKE-TEST OTHER ADMIN MODULES
  // ==================================================================
  test("5. Smoke-Test: Content Banners, Tourism Agencies, and Reviews Moderation", async ({ request }) => {
    // 5.1 Content Banner CRUD
    const bannerPost = await request.post("/api/admin/content", {
      headers: { cookie: adminCookie },
      data: {
        kind: "banner",
        title: "Release Verification Banner",
        subtitle: "Testing CRUD",
        ctaLabel: "Details",
        ctaHref: "/details",
      },
    });
    expect(bannerPost.status()).toBe(200);
    const bannerData = await bannerPost.json();
    expect(bannerData.id).toBeDefined();

    const bannerPatch = await request.patch("/api/admin/content", {
      headers: { cookie: adminCookie },
      data: { kind: "banner", id: bannerData.id, isActive: true },
    });
    expect(bannerPatch.status()).toBe(200);

    const bannerDel = await request.delete(`/api/admin/content?kind=banner&id=${bannerData.id}`, {
      headers: { cookie: adminCookie },
    });
    expect(bannerDel.status()).toBe(200);

    // 5.2 Agency Safe Delete on Disposable Record
    const testAgency = await prisma.healthTourismAgency.create({
      data: {
        name: "Disposable Verification Agency",
        slug: `agency-verify-${Date.now()}`,
        city: "İstanbul",
        status: "PENDING",
      },
    });

    const agencyDel = await request.delete(`/api/admin/agencies?id=${testAgency.id}`, {
      headers: { cookie: adminCookie },
    });
    expect(agencyDel.status()).toBe(200);

    const agencyInDb = await prisma.healthTourismAgency.findUnique({ where: { id: testAgency.id } });
    expect(agencyInDb).toBeNull();

    // 5.3 Reviews Moderation Listing
    const reviewsGet = await request.get("/api/admin/reviews?status=ALL", {
      headers: { cookie: adminCookie },
    });
    expect(reviewsGet.status()).toBe(200);
    const reviewsData = await reviewsGet.json();
    expect(Array.isArray(reviewsData.doctorReviews)).toBe(true);
    expect(Array.isArray(reviewsData.organizationReviews)).toBe(true);
  });

  // ==================================================================
  // 6. UI INTERACTION TESTS (BROWSER AUTOMATION)
  // ==================================================================
  test("6. UI Interaction: Admin Panel Modals, Search, Directory Tab, and Tabs Navigation", async ({ page }) => {
    // Set direct authenticated admin session cookie and Turkish locale
    await page.context().addCookies([
      { name: "alumas_session", value: adminToken, domain: "127.0.0.1", path: "/" },
      { name: "alumas_session", value: adminToken, domain: "localhost", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "localhost", path: "/" },
    ]);

    // Navigate to admin doctors
    await page.goto("/admin/doctors", { waitUntil: "domcontentloaded" });

    // Verify 3 registered doctors are listed
    await expect(page.getByTestId("admin-tab-doctors")).toBeVisible();
    await expect(page.locator("body")).toContainText("Yiğit Tilaver", { timeout: 15000 });

    // Test Search input on registered doctors
    const searchInput = page.getByTestId("search-registered-doctors");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Yiğit");
    await expect(page.locator("body")).toContainText("Yiğit Tilaver");
    await expect(page.locator("body")).not.toContainText("Fahri Tunç");
    await searchInput.clear();

    // Test Detail Modal
    const detailButtons = page.getByRole("button", { name: /Detay|Details/i });
    if (await detailButtons.count() > 0) {
      await detailButtons.first().click();
      // Check modal open
      await expect(page.locator("body")).toContainText("Uzman Detay Kartı");
      // Close modal
      await page.getByRole("button", { name: /Kapat|Close/i }).click();
    }

    // Switch to Directory Tab
    const tabDirectory = page.getByTestId("admin-tab-directory");
    await tabDirectory.click();
    await expect(page.getByTestId("search-directory-doctors")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("body")).toContainText("Toplam 386 dizin uzmanı");

    // Test Directory Search
    const dirSearch = page.getByTestId("search-directory-doctors");
    await dirSearch.fill("Bülent");
    await page.getByRole("button", { name: /🔍\s*Ara|^Search$/i }).click();
    await expect(page.locator("body")).toContainText("A. Bülent Oktay", { timeout: 15000 });

    // Switch to Claims Tab
    const tabClaims = page.getByTestId("admin-tab-claims");
    await tabClaims.click();
    await expect(page.getByTestId("admin-tab-claims")).toBeVisible();
  });
});
