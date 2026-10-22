import { test, expect, Page } from "@playwright/test";

test.describe.serial("Admin Doctors & Management E2E Suite", () => {
  test.setTimeout(90000);
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Login as Admin
    await page.goto("/login");
    await page.getByTestId("auth-email").fill("admin@alumas.app");
    await page.getByTestId("auth-password").fill("Admin123!");
    await page.getByTestId("auth-submit").click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/(profile|admin)/, { timeout: 25000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("English mode: renders 3 registered specialists, directory specialists tab, search, and full localization", async () => {
    // Set cookie to EN
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "en", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
    ]);

    await page.goto("/admin/doctors", { waitUntil: "domcontentloaded" });

    const tabDoctors = page.getByTestId("admin-tab-doctors");
    const tabDirectory = page.getByTestId("admin-tab-directory");
    const tabClaims = page.getByTestId("admin-tab-claims");

    // Wait for API data to load completely
    await expect(tabDoctors).toContainText("Registered Specialists (3)", { timeout: 30000 });
    await expect(tabDirectory).toContainText("Directory Specialists", { timeout: 30000 });
    await expect(tabClaims).toContainText("Directory Claim Requests", { timeout: 30000 });

    // Check Registered Specialists: Yiğit Tilaver & Ali Can Aydın exist
    await expect(page.locator("body")).toContainText("Yiğit Tilaver", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Ali Can Aydın");
    await expect(page.locator("body")).toContainText("Fahri Tunç");

    // Check action buttons exist
    await expect(page.locator("body")).toContainText("Edit");
    await expect(page.locator("body")).toContainText("Details");

    // Confirm no raw keys anywhere
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("admin.doctorList.");
    expect(bodyText).not.toContain("admin.adminVerificationDocs.");

    // Switch to Directory Specialists tab
    await tabDirectory.click();
    await expect(page.getByTestId("admin-tab-directory")).toBeVisible();
    await expect(page.getByTestId("search-directory-doctors")).toBeVisible({ timeout: 15000 });

    // Check directory doctor search input and pagination
    await expect(page.locator("body")).toContainText("Total 386 directory specialists");
    const dirBody = await page.textContent("body");
    expect(dirBody).not.toContain("admin.doctorList.");
  });

  test("Turkish mode: renders 3 registered specialists, directory tab, and full localization", async () => {
    // Switch to TR
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "tr", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "localhost", path: "/" },
    ]);

    await page.goto("/admin/doctors", { waitUntil: "domcontentloaded" });

    const tabDoctors = page.getByTestId("admin-tab-doctors");
    const tabDirectory = page.getByTestId("admin-tab-directory");
    const tabClaims = page.getByTestId("admin-tab-claims");

    // Wait for API data to load completely
    await expect(tabDoctors).toContainText("Kayıtlı Uzmanlar (3)", { timeout: 30000 });
    await expect(tabDirectory).toContainText("Dizin Uzmanları", { timeout: 30000 });
    await expect(tabClaims).toContainText("Dizin Sahiplenme Talepleri", { timeout: 30000 });

    // Check Registered Specialists in Turkish
    await expect(page.locator("body")).toContainText("Yiğit Tilaver", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Ali Can Aydın");
    await expect(page.locator("body")).toContainText("Fahri Tunç");

    // Verify Turkish actions
    await expect(page.locator("body")).toContainText("Düzenle");
    await expect(page.locator("body")).toContainText("Detay");

    // Confirm no raw keys anywhere
    const trBody = await page.textContent("body");
    expect(trBody).not.toContain("admin.doctorList.");
    expect(trBody).not.toContain("admin.adminVerificationDocs.");

    // Switch to Directory Specialists tab
    await tabDirectory.click();
    await expect(page.getByTestId("search-directory-doctors")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("body")).toContainText("Toplam 386 dizin uzmanı");

    const trDirBody = await page.textContent("body");
    expect(trDirBody).not.toContain("admin.doctorList.");
  });
});
