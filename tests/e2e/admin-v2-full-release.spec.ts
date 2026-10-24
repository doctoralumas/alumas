import { test, expect } from "@playwright/test";
import { prisma } from "../../lib/prisma";
import { randomBytes, createHash } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

const SCREENSHOT_DIR = "C:/Users/Yiğit/.gemini/antigravity/brain/0a110192-18a8-439f-9149-46521d2c6f29/release_screenshots";

test.describe.serial("ALUMAS Admin v2 — Full Release E2E Verification", () => {
  test.setTimeout(120000);

  let adminToken = "";
  let patientToken = "";

  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) throw new Error("No ADMIN user found in database!");

    const patientUser = await prisma.user.findFirst({ where: { role: "PATIENT" } });
    if (!patientUser) throw new Error("No PATIENT user found in database!");

    adminToken = "admin_v2_full_" + randomBytes(16).toString("hex");
    patientToken = "patient_v2_full_" + randomBytes(16).toString("hex");

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
  });

  test.afterAll(async () => {
    await prisma.session.deleteMany({
      where: {
        tokenHash: { in: [tokenHash(adminToken), tokenHash(patientToken)] },
      },
    });
  });

  async function setAdminCookies(context: any) {
    await context.addCookies([
      { name: "alumas_session", value: adminToken, domain: "127.0.0.1", path: "/" },
      { name: "alumas_session", value: adminToken, domain: "localhost", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "localhost", path: "/" },
    ]);
  }

  async function setPatientCookies(context: any) {
    await context.addCookies([
      { name: "alumas_session", value: patientToken, domain: "127.0.0.1", path: "/" },
      { name: "alumas_session", value: patientToken, domain: "localhost", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "localhost", path: "/" },
    ]);
  }

  test("1. Hub 1: Executive Dashboard (/admin) renders attention queues and scale metrics", async ({ page, context }) => {
    await setAdminCookies(context);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
    await page.waitForLoadState("networkidle");

    // Check header and status
    await expect(page.locator("text=Operasyonel Genel Bakış")).toBeVisible();
    await expect(page.locator("text=Sistem Aktif & Sağlıklı")).toBeVisible();

    // Check queues & metrics
    await expect(page.locator("text=İnceleme ve Onay Bekleyen Kuyruklar")).toBeVisible();
    await expect(page.locator("text=Platform Sağlık Ağı ve Büyüklük")).toBeVisible();
    await expect(page.locator("text=Hızlı İşlem Hub'ları")).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v2_desktop_overview.png"), fullPage: true });
  });

  test("2. Hub 2: Users Management (/admin/users) renders list, metrics, and inspection modal", async ({ page, context }) => {
    await setAdminCookies(context);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/admin/users");
    await expect(page).toHaveURL("/admin/users");

    await expect(page.locator("text=Kullanıcı Yönetimi")).toBeVisible();
    await expect(page.locator("text=Toplam Kullanıcı")).toBeVisible();
    await expect(page.locator("text=Hasta").first()).toBeVisible();

    // Click first "İncele" button to verify modal opens
    const inspectBtn = page.locator("button:has-text('İncele')").first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      await expect(page.locator("div[role='dialog']")).toBeVisible();
      await expect(page.locator("text=Kullanıcı Detayları")).toBeVisible();
      // Close modal
      await page.keyboard.press("Escape");
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v2_desktop_users.png"), fullPage: true });
  });

  test("3. Hub 3: Appointments Operations (/admin/appointments) renders operational list & filter metrics", async ({ page, context }) => {
    await setAdminCookies(context);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/admin/appointments");
    await expect(page).toHaveURL("/admin/appointments");

    await expect(page.locator("text=Randevu Yönetimi")).toBeVisible();
    await expect(page.locator("text=Toplam Randevu")).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v2_desktop_appointments.png"), fullPage: true });
  });

  test("4. Hub 3: Support Inquiries (/admin/inquiries) renders customer requests", async ({ page, context }) => {
    await setAdminCookies(context);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/admin/inquiries");
    await expect(page).toHaveURL("/admin/inquiries");

    await expect(page.locator("text=İletişim ve Destek Talepleri")).toBeVisible();
    await expect(page.locator("text=Toplam Talep")).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v2_desktop_inquiries.png"), fullPage: true });
  });

  test("5. Hub 3: Reviews & Moderation (/admin/reviews) renders moderation cards & KPI filters", async ({ page, context }) => {
    await setAdminCookies(context);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/admin/reviews");
    await expect(page).toHaveURL("/admin/reviews");

    await expect(page.locator("text=Yorum moderasyonu")).toBeVisible();
    await expect(page.locator("text=Bekleyen Moderasyon")).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v2_desktop_reviews.png"), fullPage: true });
  });

  test("6. Hub 4: System Health & Audit (/admin/system) renders health pulse and audit stream", async ({ page, context }) => {
    await setAdminCookies(context);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/admin/system");
    await expect(page).toHaveURL("/admin/system");

    await expect(page.locator("text=Sistem Durumu & Güvenlik Kayıtları")).toBeVisible();
    await expect(page.locator("text=Platform Denetim (Audit) Akışı")).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v2_desktop_system.png"), fullPage: true });
  });

  test("7. Mobile UX (375x812): Sticky top bar and slide-out navigation drawer work seamlessly", async ({ page, context }) => {
    await setAdminCookies(context);
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
    await page.waitForLoadState("networkidle");

    // Mobile sticky bar must be visible
    const mobileBar = page.locator(".admin-mobile-topbar");
    await expect(mobileBar).toBeVisible();

    // Desktop sidebar must be hidden
    const desktopSidebar = page.locator(".admin-desktop-sidebar");
    await expect(desktopSidebar).toBeHidden();

    // Click hamburger button to open drawer
    const hamburgerBtn = page.locator("button[aria-label='Menüyü Aç']");
    await expect(hamburgerBtn).toBeVisible();
    await hamburgerBtn.click();

    // Drawer must be visible
    const drawer = page.locator("div[role='dialog']");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("ALUMAS v2 ADMIN")).toBeVisible();
    await expect(drawer.locator("text=Sağlık Ağı & Dizin")).toBeVisible();
    await expect(drawer.locator("text=Operasyon & Moderasyon")).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v2_mobile_drawer_open.png") });

    // Close drawer via close button
    const closeBtn = page.locator("button[aria-label='Menüyü Kapat']");
    await closeBtn.click();
    await expect(drawer).toBeHidden();

    // Take full page mobile screenshot of dashboard
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v2_mobile_dashboard.png"), fullPage: true });
  });

  test("8. Security & RBAC: Non-admin users are strictly blocked from /admin routes and administrative APIs", async ({ page, context, request }) => {
    await setPatientCookies(context);

    // Non-admin attempting to access /admin pages must be redirected to /profile
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/profile|\/login/);

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/profile|\/login/);

    await page.goto("/admin/appointments");
    await expect(page).toHaveURL(/\/profile|\/login/);

    await page.goto("/admin/system");
    await expect(page).toHaveURL(/\/profile|\/login/);

    // API protection test: PATIENT trying to access admin APIs directly
    const apiRes = await request.get("/api/admin/users", {
      headers: { Cookie: `alumas_session=${patientToken}` },
    });
    expect([401, 403]).toContain(apiRes.status());

    const aptRes = await request.get("/api/admin/appointments", {
      headers: { Cookie: `alumas_session=${patientToken}` },
    });
    expect([401, 403]).toContain(aptRes.status());

    const inqRes = await request.get("/api/admin/inquiries", {
      headers: { Cookie: `alumas_session=${patientToken}` },
    });
    expect([401, 403]).toContain(inqRes.status());
  });
});
