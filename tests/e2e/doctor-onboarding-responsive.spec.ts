import { test, expect, Page } from "@playwright/test";

function uniqueEmail() {
  return `e2e-doctor-${Date.now()}-${Math.random().toString(36).slice(2)}@alumas.test`;
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

test.describe.serial("Doctor Onboarding Premium UI/UX & Responsive Suite", () => {
  test.setTimeout(90000);
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const userEmail = uniqueEmail();

    // Register a test user
    await page.goto("/register");
    await page.getByTestId("register-name").fill("Dr. Test User");
    await page.getByTestId("auth-email").fill(userEmail);
    await page.getByTestId("auth-password").fill("AlumasE2E123!");
    await page.getByTestId("privacy-notice").check();
    await page.getByTestId("auth-submit").click();

    // Wait for registration redirect
    await expect(page).toHaveURL(/\/profile/, { timeout: 25000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("Doctor onboarding has ZERO horizontal overflow across all mobile & desktop viewports (320px–1280px)", async () => {
    await page.goto("/onboarding/doctor?claimDoctorId=dr-a-bulent-oktay-uroloji-bursa", {
      waitUntil: "domcontentloaded",
    });

    // Wait for onboarding submit button to appear
    await page.waitForSelector("[data-testid='doctor-onboarding-submit-button']", { timeout: 20000 });

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
          hasOverflow: scrollWidth > innerWidth,
        };
      });

      expect(
        overflow.hasOverflow,
        `Horizontal overflow detected at ${vp.name}: scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth}`
      ).toBe(false);
      expect(overflow.scrollWidth).toBeLessThanOrEqual(vp.width);
    }
  });

  test("Selected claim banner renders localized content without raw keys and handles cancellation", async () => {
    await page.setViewportSize({ width: 440, height: 956 });
    await page.goto("/onboarding/doctor?claimDoctorId=dr-a-bulent-oktay-uroloji-bursa", {
      waitUntil: "domcontentloaded",
    });

    const claimCard = page.locator("[data-testid='selected-claim-card']");
    await expect(claimCard).toBeVisible({ timeout: 15000 });

    // Check localized text (MUST NOT contain raw translation keys)
    const textContent = await claimCard.innerText();
    expect(textContent).not.toContain("professional.onboarding.claimSelectedNotice");
    expect(textContent).not.toContain("professional.onboarding.claimSelectedHint");
    expect(textContent).not.toContain("professional.onboarding.cancelClaim");

    // Must display real Turkish localized text
    expect(textContent.toLocaleLowerCase("tr-TR")).toContain("dizin profili seçildi");
    expect(textContent).toContain("A. Bülent Oktay");
    expect(textContent).toContain("Seçimi Kaldır");

    // Click cancel claim button
    const cancelBtn = page.locator("[data-testid='cancel-claim-button']");
    await cancelBtn.click();

    // Claim card should be dismissed
    await expect(claimCard).not.toBeVisible();
  });

  test("Document upload area displays modern dropzone and file inputs properly", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/onboarding/doctor", { waitUntil: "domcontentloaded" });

    // Verify all document file inputs are present
    const docInputs = page.locator("input[type='file']");
    const count = await docInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Verify submit button is visible and has adequate touch target (>= 44px)
    const submitBtn = page.locator("[data-testid='doctor-onboarding-submit-button']");
    await expect(submitBtn).toBeVisible({ timeout: 15000 });
    const box = await submitBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

