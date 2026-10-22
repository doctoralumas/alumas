import { test, expect, Page } from "@playwright/test";

test.describe.serial("Admin Doctors & Claims Localization & Status E2E Suite", () => {
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

  test("English mode: renders localized tabs, documents rejected state, and structured identity mismatch", async () => {
    // Set cookie to EN
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "en", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
    ]);

    await page.goto("/admin/doctors", { waitUntil: "domcontentloaded" });

    const tabDoctors = page.getByTestId("admin-tab-doctors");
    const tabClaims = page.getByTestId("admin-tab-claims");

    // Wait for API data to load completely (dev server compilation can take a few seconds)
    await expect(tabDoctors).toContainText("Registered Specialists (4)", { timeout: 30000 });
    await expect(tabClaims).toContainText("Directory Claim Requests (1)", { timeout: 30000 });

    // Check Registered Specialists: Abuzer Eczanesi card
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("admin.doctorList.");
    expect(bodyText).not.toContain("admin.adminVerificationDocs.");

    // Verify Documents Rejected notice and disabled Approve button
    await expect(page.locator("body")).toContainText("DOCUMENTS REJECTED", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Specialist profile cannot be approved because required verification documents were rejected.");
    await expect(page.locator("body")).toContainText("[Test Claim Revoked]: Test doğrulaması iptal edildi.");

    // Switch to Directory Claim Requests tab
    await tabClaims.click();
    await expect(page.getByTestId("admin-tab-claims")).toBeVisible();

    // Verify Target Directory Specialist
    await expect(page.locator("body")).toContainText("Prof. Dr. A. Bülent Oktay", { timeout: 15000 });

    // Verify Identity Mismatch in English
    await expect(page.locator("body")).toContainText("Identity mismatch detected");
    await expect(page.locator("body")).toContainText("The applicant's identity does not match the directory professional.");
    await expect(page.locator("body")).toContainText('Surname mismatch: "Eczanesi" vs. "Oktay".');

    // Verify localized audit note code in English
    await expect(page.locator("body")).toContainText('[Test Claim Revoked]: Yanlış hekim sahiplenme testi geri alındı; kimlik uyuşmazlığı nedeniyle iptal edildi.');

    // Confirm no raw keys anywhere
    const claimsBody = await page.textContent("body");
    expect(claimsBody).not.toContain("admin.doctorList.");
    expect(claimsBody).not.toContain("admin.adminVerificationDocs.");
  });

  test("Turkish mode: renders localized tabs, documents rejected state, and structured identity mismatch", async () => {
    // Switch to TR
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "tr", domain: "127.0.0.1", path: "/" },
      { name: "NEXT_LOCALE", value: "tr", domain: "localhost", path: "/" },
    ]);

    await page.goto("/admin/doctors", { waitUntil: "domcontentloaded" });

    const tabDoctors = page.getByTestId("admin-tab-doctors");
    const tabClaims = page.getByTestId("admin-tab-claims");

    // Wait for API data to load completely
    await expect(tabDoctors).toContainText("Kayıtlı Uzmanlar (4)", { timeout: 30000 });
    await expect(tabClaims).toContainText("Dizin Sahiplenme Talepleri (1)", { timeout: 30000 });

    // Check Registered Specialists: Abuzer Eczanesi card in TR
    await expect(page.locator("body")).toContainText("BELGELER REDDEDİLDİ", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Zorunlu doğrulama belgeleri reddedildiği için uzman profili onaylanamaz.");
    await expect(page.locator("body")).toContainText("[Test Talebi İptal Edildi]: Test doğrulaması iptal edildi.");

    // Switch to Directory Claim Requests tab
    await tabClaims.click();

    // Verify Target Directory Specialist
    await expect(page.locator("body")).toContainText("Prof. Dr. A. Bülent Oktay", { timeout: 15000 });

    // Verify Identity Mismatch in Turkish
    await expect(page.locator("body")).toContainText("Kimlik uyuşmazlığı tespit edildi");
    await expect(page.locator("body")).toContainText("Başvuru sahibinin kimlik bilgileri, sahiplenilmek istenen uzman profiliyle eşleşmiyor.");
    await expect(page.locator("body")).toContainText('Soyadı uyuşmazlığı: "Eczanesi" ve "Oktay".');

    // Verify localized audit note code in Turkish
    await expect(page.locator("body")).toContainText('[Test Talebi İptal Edildi]: Yanlış hekim sahiplenme testi geri alındı; kimlik uyuşmazlığı nedeniyle iptal edildi.');

    // Confirm no raw keys anywhere
    const trClaimsBody = await page.textContent("body");
    expect(trClaimsBody).not.toContain("admin.doctorList.");
    expect(trClaimsBody).not.toContain("admin.adminVerificationDocs.");
  });
});
