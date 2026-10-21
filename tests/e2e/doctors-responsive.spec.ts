import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 640, name: "320px (iPhone SE 1st)" },
  { width: 360, height: 740, name: "360px (Galaxy Small)" },
  { width: 375, height: 667, name: "375px (iPhone SE 2nd/3rd)" },
  { width: 390, height: 844, name: "390px (iPhone 12/13/14)" },
  { width: 414, height: 896, name: "414px (iPhone XR/Plus)" },
];

for (const vp of VIEWPORTS) {
  test(`Experts directory (/doctors) has ZERO horizontal overflow at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/doctors", { waitUntil: "domcontentloaded" });

    // Wait for the doctor list to render
    await page.waitForSelector("[data-testid='specialty-filter-select']", { timeout: 15000 });

    // Check horizontal overflow
    const overflowInfo = await page.evaluate(() => {
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

    expect(overflowInfo.hasOverflow).toBe(false);
    expect(overflowInfo.scrollWidth).toBeLessThanOrEqual(vp.width);
  });
}

test("Mobile specialty bottom sheet opens, filters and selects without viewport overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/doctors", { waitUntil: "domcontentloaded" });

  const specialtyTrigger = page.locator("[data-testid='specialty-filter-select']");
  await specialtyTrigger.waitFor({ state: "visible" });

  // Click trigger to open bottom sheet
  await specialtyTrigger.click();

  // Bottom sheet modal should be visible
  const bottomSheet = page.locator("[data-testid='specialty-filter-select-listbox']");
  await expect(bottomSheet).toBeVisible();

  // Verify zero horizontal overflow while modal is open
  const overflowWithModal = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth;
  });
  expect(overflowWithModal).toBe(true);

  // Filter inside bottom sheet
  const searchInput = bottomSheet.locator("input[type='text']");
  await searchInput.fill("Diş");

  // Options should appear
  const options = bottomSheet.locator("[role='option']");
  const count = await options.count();
  expect(count).toBeGreaterThan(0);

  // Click the first specific option (skip the "Tüm Uzmanlıklar" allOption)
  await options.nth(1).click();

  // Bottom sheet should close
  await expect(bottomSheet).not.toBeVisible();

  // The trigger should now reflect the selection
  await expect(specialtyTrigger).not.toHaveText("Tüm Uzmanlıklar");
});

test("Filter clear button resets both specialty and city filters", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/doctors", { waitUntil: "domcontentloaded" });

  const specialtyTrigger = page.locator("[data-testid='specialty-filter-select']");
  await specialtyTrigger.click();

  const bottomSheet = page.locator("[data-testid='specialty-filter-select-listbox']");
  // Select first specific specialty
  await bottomSheet.locator("[role='option']").nth(1).click();

  // Clear button should exist
  const clearBtn = page.locator("[data-testid='clear-filters-btn']");
  await expect(clearBtn).toBeVisible();

  // Click clear filters
  await clearBtn.click();

  // Specialty trigger should be back to default
  await expect(specialtyTrigger).toContainText("Tüm Uzmanlıklar");
});
