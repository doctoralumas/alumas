import { test, expect, Page } from "@playwright/test";

function uniqueEmail() {
  return `e2e-business-${Date.now()}-${Math.random().toString(36).slice(2)}@alumas.test`;
}

const VIEWPORTS = [
  { width: 320, height: 640, name: "320px (iPhone SE 1st)" },
  { width: 360, height: 740, name: "360px (Galaxy Small)" },
  { width: 375, height: 667, name: "375px (iPhone SE 2nd/3rd)" },
  { width: 390, height: 844, name: "390px (iPhone 12/13/14)" },
  { width: 414, height: 896, name: "414px (iPhone XR/Plus)" },
  { width: 440, height: 956, name: "440px (iPhone 16 Pro Max)" },
  { width: 1280, height: 800, name: "1280px (Desktop)" },
];

test.describe.serial("Business Application Premium UI/UX & Responsive Suite", () => {
  test.setTimeout(90000);
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const userEmail = uniqueEmail();

    // Register a test user
    await page.goto("/register");
    await page.getByTestId("register-name").fill("Kurum Yetkilisi Test");
    await page.getByTestId("auth-email").fill(userEmail);
    await page.getByTestId("auth-password").fill("AlumasE2E123!");
    await page.getByTestId("privacy-notice").check();
    await page.getByTestId("auth-submit").click();

    // Wait for registration redirect to profile
    await expect(page).toHaveURL(/\/profile/, { timeout: 25000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("Business application page has ZERO horizontal overflow across all mobile & desktop viewports (320px–1280px)", async () => {
    await page.goto("/business/apply?claimDirectoryId=dir-tr-ist-acibadem-maslak", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("[data-testid='business-application-form']", { timeout: 20000 });
    await page.waitForSelector("[data-testid='claim-form-submit-btn']", { timeout: 20000 });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Verify no horizontal overflow
      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const innerWidth = window.innerWidth;
        return {
          scrollWidth,
          innerWidth,
          hasHorizontalScroll: scrollWidth > innerWidth,
        };
      });

      expect(
        overflow.hasHorizontalScroll,
        `Horizontal overflow detected on viewport ${vp.name}: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
      ).toBe(false);
    }
  });

  test("Segmented mode switching, directory institution claim card, locking and reset behavior", async () => {
    await page.setViewportSize({ width: 440, height: 956 });
    await page.goto("/business/apply?claimDirectoryId=dir-tr-ist-acibadem-maslak", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("[data-testid='business-application-form']", { timeout: 20000 });

    // Verify claim card is visible
    const claimSummary = page.getByTestId("claimed-branch-summary");
    await expect(claimSummary).toBeVisible();
    await expect(claimSummary).toContainText("Acıbadem Maslak Hastanesi");

    // Verify name & city inputs are locked/readOnly
    const nameInput = page.getByTestId("claim-form-name-input");
    const cityInput = page.getByTestId("claim-form-city-input");
    await expect(nameInput).toHaveValue("Acıbadem Maslak Hastanesi");
    await expect(nameInput).toHaveAttribute("readonly", "");
    await expect(cityInput).toHaveValue("İstanbul");
    await expect(cityInput).toHaveAttribute("readonly", "");

    // Test changing institution
    const changeBtn = claimSummary.getByRole("button", { name: /Farklı Kurum Seç|Select Different Institution/i });
    await changeBtn.click();

    // Verify summary is cleared and inputs become unlocked
    await expect(claimSummary).not.toBeVisible();
    await expect(nameInput).not.toHaveAttribute("readonly", "");

    // Test switching to New Institution mode
    const newModeBtn = page.getByTestId("mode-new-institution-btn");
    await newModeBtn.click();
    await expect(page.getByTestId("claim-directory-select")).not.toBeVisible();

    // Test switching back to Claim Directory mode
    const claimModeBtn = page.getByTestId("mode-claim-directory-btn");
    await claimModeBtn.click();
    await expect(page.getByTestId("claim-directory-select")).toBeVisible();
  });

  test("Verification documents render localized badges and dropzones correctly", async () => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Check TR locale
    await page.context().addCookies([{ name: "NEXT_LOCALE", value: "tr", domain: "127.0.0.1", path: "/" }]);
    await page.goto("/business/apply", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-testid='business-application-form']", { timeout: 20000 });

    // In Turkish, required badge should contain "Zorunlu"
    const trBadges = page.locator("text=* Zorunlu");
    await expect(trBadges.first()).toBeVisible();

    // Check dropzone prompt
    await expect(page.locator("text=Dosya seçin veya buraya sürükleyin").first()).toBeVisible();

    // 2. Check EN locale
    await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", domain: "127.0.0.1", path: "/" }]);
    await page.goto("/business/apply", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-testid='business-application-form']", { timeout: 20000 });

    // In English, required badge MUST be "* Required" and MUST NOT say "* Zorunlu"
    const enBadges = page.locator("text=* Required");
    await expect(enBadges.first()).toBeVisible();
    await expect(page.locator("text=* Zorunlu")).not.toBeVisible();

    // Check dropzone prompt in English
    await expect(page.locator("text=Choose file or drag and drop here").first()).toBeVisible();

    // Verify submit button is visible and active
    const submitBtn = page.getByTestId("claim-form-submit-btn");
    await expect(submitBtn).toBeVisible();
  });
});

