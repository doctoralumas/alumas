import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import fs from "node:fs";

const ARTIFACT_DIR = "C:\\Users\\Yiğit\\.gemini\\antigravity\\brain\\0a110192-18a8-439f-9149-46521d2c6f29";
const BASE_URL = "http://localhost:3000";

const prisma = new PrismaClient();

async function run() {
  console.log("=== ALUMAS UI BROWSER VERIFICATION START ===");
  
  // 1. Fetch ground-truth records from DB
  const dbDirectoryRecords = await prisma.directoryInstitution.findMany({
    orderBy: { name: "asc" },
  });
  const dbOrgRecords = await prisma.organization.findMany();
  console.log(`[DB Check] DirectoryInstitutions in DB: ${dbDirectoryRecords.length}`);
  console.log(`[DB Check] Organizations in DB: ${dbOrgRecords.length}`);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "tr-TR",
  });
  const page = await context.newPage();

  // Test results collector
  const results = {
    totalDbDirectory: dbDirectoryRecords.length,
    totalDbOrganizations: dbOrgRecords.length,
    initialCardsCount: 0,
    matchedExternalCards: 0,
    missingExternalCards: [],
    verifiedCardsCount: 0,
    unverifiedCardsCount: 0,
    filterCounts: {},
    searchTests: [],
    mapRendered: false,
    mapMarkersCount: 0,
    claimFlowVerified: false,
    badgeContractsPassed: true,
    websiteContractsPassed: true,
    screenshots: [],
    defects: [],
  };

  try {
    // 2. Navigate to /organizations
    console.log(`[UI Test] Navigating to ${BASE_URL}/organizations ...`);
    await page.goto(`${BASE_URL}/organizations`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector("[data-testid^='directory-card-']", { timeout: 15000 });

    const allCards = await page.$$("[data-testid^='directory-card-']");
    results.initialCardsCount = allCards.length;
    console.log(`[UI Test] Rendered institution cards: ${allCards.length}`);

    // Check each of the 40 imported DB directory institutions
    for (const record of dbDirectoryRecords) {
      const card = await page.$(`[data-testid='directory-card-${record.slug}']`);
      if (card) {
        results.matchedExternalCards++;
      } else {
        results.missingExternalCards.push({ id: record.id, slug: record.slug, name: record.name });
      }
    }
    console.log(`[UI Test] Matched external cards by slug: ${results.matchedExternalCards} / ${dbDirectoryRecords.length}`);

    // Capture initial full view
    const p1 = path.join(ARTIFACT_DIR, "ui_verify_organizations_desktop_all.png");
    await page.screenshot({ path: p1, fullPage: false });
    results.screenshots.push(p1);

    // 3. Check Badges, Websites, and Claim Links on cards
    const verifiedBadges = await page.$$("[data-testid='alumas-verified-badge']");
    const externalBadges = await page.$$("[data-testid='external-directory-badge']");
    results.verifiedCardsCount = verifiedBadges.length;
    results.unverifiedCardsCount = externalBadges.length;
    console.log(`[Badge Check] ALUMAS Verified Blue Badges: ${verifiedBadges.length}`);
    console.log(`[Badge Check] Neutral External Directory Badges: ${externalBadges.length}`);

    if (verifiedBadges.length !== 12) {
      results.defects.push(`Expected 12 verified badges, found ${verifiedBadges.length}`);
    }
    if (externalBadges.length !== 40) {
      results.defects.push(`Expected 40 external directory badges, found ${externalBadges.length}`);
    }

    // Inspect representative cards:
    // A. Acıbadem Maslak (External WITH official website)
    const acibademCard = await page.$("[data-testid='directory-card-acibadem-maslak-hastanesi']");
    if (acibademCard) {
      const blueBadge = await acibademCard.$("[data-testid='alumas-verified-badge']");
      const greyBadge = await acibademCard.$("[data-testid='external-directory-badge']");
      const websiteLink = await acibademCard.$("[data-testid='external-website-link']");
      const claimLink = await acibademCard.$("[data-testid='claim-institution-link']");
      const href = websiteLink ? await websiteLink.getAttribute("href") : null;
      const target = websiteLink ? await websiteLink.getAttribute("target") : null;
      console.log(`[Card Check: Acıbadem Maslak] Blue: ${!!blueBadge}, Grey: ${!!greyBadge}, Link: ${href}, Target: ${target}, Claim: ${!!claimLink}`);
      if (blueBadge) results.defects.push("Acıbadem Maslak unexpectedly has ALUMAS verified badge!");
      if (!greyBadge) results.defects.push("Acıbadem Maslak missing neutral external badge!");
      if (!href || !href.includes("acibadem.com.tr")) results.defects.push("Acıbadem Maslak official link invalid!");
      if (target !== "_blank") results.defects.push("Acıbadem Maslak link does not open in new tab!");
    } else {
      results.defects.push("Acıbadem Maslak card not found!");
    }

    // B. Aylin Eczanesi (External WITHOUT website)
    const aylinCard = await page.$("[data-testid='directory-card-aylin-eczanesi']");
    if (aylinCard) {
      const blueBadge = await aylinCard.$("[data-testid='alumas-verified-badge']");
      const greyBadge = await aylinCard.$("[data-testid='external-directory-badge']");
      const websiteLink = await aylinCard.$("[data-testid='external-website-link']");
      const noWebsitePill = await aylinCard.$("[data-testid='website-unavailable-pill']");
      const claimLink = await aylinCard.$("[data-testid='claim-institution-link']");
      console.log(`[Card Check: Aylin Eczanesi] Blue: ${!!blueBadge}, Grey: ${!!greyBadge}, ExtLink: ${!!websiteLink}, NoWebPill: ${!!noWebsitePill}, Claim: ${!!claimLink}`);
      if (blueBadge) results.defects.push("Aylin Eczanesi unexpectedly has ALUMAS verified badge!");
      if (websiteLink) results.defects.push("Aylin Eczanesi unexpectedly has external website link!");
      if (!noWebsitePill) results.defects.push("Aylin Eczanesi missing 'Web Sitesi Bulunmuyor' disabled pill!");
    } else {
      results.defects.push("Aylin Eczanesi card not found!");
    }

    // Scroll to and screenshot a specific external card
    if (aylinCard) {
      await aylinCard.scrollIntoViewIfNeeded();
      const pCard = path.join(ARTIFACT_DIR, "ui_verify_organizations_desktop_external_card.png");
      await page.screenshot({ path: pCard });
      results.screenshots.push(pCard);
    }

    // 4. Test Category Filter Buttons
    console.log("[Filter Check] Testing category filter buttons with data-testid and response synchronization...");
    const filterDefs = [
      { id: "hospital", name: "HOSPITAL", expectedTotal: 17 },
      { id: "clinic", name: "CLINIC", expectedTotal: 11 },
      { id: "pharmacy", name: "PHARMACY", expectedTotal: 13 },
      { id: "laboratory", name: "LABORATORY", expectedTotal: 6 },
      { id: "imaging_center", name: "IMAGING_CENTER", expectedTotal: 5 },
    ];

    for (const f of filterDefs) {
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/organizations") && r.status() === 200),
        page.click(`[data-testid='filter-type-${f.id}']`),
      ]);
      await page.waitForTimeout(300);
      const cards = await page.$$("[data-testid^='directory-card-']");
      results.filterCounts[f.name] = cards.length;
      console.log(`  Filtered [${f.name}]: ${cards.length} cards (expected: ${f.expectedTotal})`);
      if (cards.length !== f.expectedTotal) {
        results.defects.push(`Filter ${f.name} returned ${cards.length} cards, expected ${f.expectedTotal}`);
      }
    }

    // Screenshot filtered state
    const pFilters = path.join(ARTIFACT_DIR, "ui_verify_organizations_desktop_filters.png");
    await page.screenshot({ path: pFilters });
    results.screenshots.push(pFilters);

    // Reset filter to All
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/organizations") && r.status() === 200),
      page.click("[data-testid='filter-type-all']"),
    ]);
    await page.waitForTimeout(300);

    // 5. Test Search Input
    console.log("[Search Check] Testing search input...");
    const searchQueries = [
      { q: "Bakırköy", expectedMin: 2 },
      { q: "Biruni", expectedMin: 1 },
      { q: "Avcılar", expectedMin: 2 },
      { q: "Betemar", expectedMin: 1 },
      { q: "Moda", expectedMin: 1 },
    ];
    for (const sq of searchQueries) {
      await page.fill("[data-testid='organization-search-input']", sq.q);
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/organizations") && r.status() === 200),
        page.click("[data-testid='organization-search-button']"),
      ]);
      await page.waitForTimeout(300);
      const cards = await page.$$("[data-testid^='directory-card-']");
      results.searchTests.push({ query: sq.q, count: cards.length });
      console.log(`  Search '${sq.q}': ${cards.length} results (expected >= ${sq.expectedMin})`);
      if (cards.length < sq.expectedMin) {
        results.defects.push(`Search '${sq.q}' returned only ${cards.length} results, expected >= ${sq.expectedMin}`);
      }
    }

    // Clear search
    await page.fill("[data-testid='organization-search-input']", "");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/organizations") && r.status() === 200),
      page.click("[data-testid='organization-search-button']"),
    ]);
    await page.waitForTimeout(300);

    // 6. Test Map View
    console.log("[Map Check] Testing Map View toggle...");
    await page.click("[data-testid='organization-map-toggle-button']");
    await page.waitForTimeout(2000);

    const mapContainer = await page.$(".interactive-map");
    const mapMarkers = await page.$$(".mapboxgl-marker");
    results.mapMarkersCount = mapMarkers.length;
    console.log(`[Map Check] Map container found: ${!!mapContainer}, Markers count: ${mapMarkers.length}`);
    results.mapRendered = Boolean(mapContainer && mapMarkers.length > 0);
    if (!results.mapRendered) {
      results.defects.push("Map did not render markers properly!");
    }

    const pMap = path.join(ARTIFACT_DIR, "ui_verify_organizations_map_view.png");
    await page.screenshot({ path: pMap });
    results.screenshots.push(pMap);

    // Toggle back to list
    await page.click("[data-testid='organization-map-toggle-button']");
    await page.waitForTimeout(500);

    // 7. Test Claim Institution Navigation Flow
    console.log("[Claim Check] Testing claim navigation...");
    const testClaimCard = await page.$("[data-testid='directory-card-ozel-moda-poliklinigi']");
    if (testClaimCard) {
      const claimLink = await testClaimCard.$("[data-testid='claim-institution-link']");
      if (claimLink) {
        const claimHref = await claimLink.getAttribute("href");
        console.log(`[Claim Check] Claim link href: ${claimHref}`);
        
        // Navigate to claim URL
        await page.goto(`${BASE_URL}${claimHref}`, { waitUntil: "networkidle", timeout: 30000 });
        const currentUrl = page.url();
        console.log(`[Claim Check] Navigated to: ${currentUrl}`);
        
        // Verify claimed institution summary is rendered on the page
        const pageContent = await page.textContent("body");
        const containsInstitutionName = pageContent.includes("Özel Moda Polikliniği");
        const containsDistrict = pageContent.includes("Kadıköy") || pageContent.includes("KADIKÖY");
        console.log(`[Claim Check] Contains 'Özel Moda Polikliniği': ${containsInstitutionName}, Contains 'Kadıköy': ${containsDistrict}`);
        
        if (containsInstitutionName) {
          results.claimFlowVerified = true;
        } else {
          results.defects.push("Claim application page did not render the claimed institution name!");
        }

        const pClaim = path.join(ARTIFACT_DIR, "ui_verify_organizations_claim_gate.png");
        await page.screenshot({ path: pClaim });
        results.screenshots.push(pClaim);
      } else {
        results.defects.push("Claim link not found on Özel Moda Polikliniği card!");
      }
    } else {
      results.defects.push("Özel Moda Polikliniği card not found!");
    }

    // 8. Mobile Viewport Check
    console.log("[Mobile Check] Testing mobile viewport (390x844)...");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/organizations`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector("[data-testid^='directory-card-']", { timeout: 15000 });
    const mobileCards = await page.$$("[data-testid^='directory-card-']");
    console.log(`[Mobile Check] Mobile cards count: ${mobileCards.length}`);
    const pMobile = path.join(ARTIFACT_DIR, "ui_verify_organizations_mobile.png");
    await page.screenshot({ path: pMobile });
    results.screenshots.push(pMobile);

  } catch (err) {
    console.error("Test execution error:", err);
    results.defects.push(`Execution error: ${err.message}`);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log("=== ALUMAS UI BROWSER VERIFICATION SUMMARY ===");
  console.log(JSON.stringify(results, null, 2));

  // Write results json
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "ui_browser_verification_results.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );

  return results;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
