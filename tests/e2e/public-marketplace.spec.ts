import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test("normalized, unverified hospital directory is publicly readable", async ({ request }) => {
  const db = new PrismaClient();
  const fixture = await db.directoryInstitution.create({
    data: {
      slug: "e2e-public-hospital-" + Date.now(),
      name: "E2E Public Hospital",
      type: "HOSPITAL",
      city: "Ankara",
      address: "E2E TEST Location 123",
      source: "E2E_TEST_FIXTURE",
      isActive: true,
    },
  });
  try {
    const response = await request.get("/api/organizations?type=HOSPITAL");
    expect(response.ok()).toBe(true);

    const rows = await response.json();
    expect(Array.isArray(rows)).toBe(true);
    const item = rows.find((row: any) => row.directoryId === fixture.id);
    expect(item).toBeDefined();
    expect(item.type).toBe("HOSPITAL");
    expect(item.isVerified).toBe(false);
    expect(item.canClaim).toBe(true);
    expect(rows.every((row: any) =>
      typeof row.name === "string" && row.name.length > 0 &&
      row.type === "HOSPITAL" && typeof row.isVerified === "boolean"
    )).toBe(true);
  } finally {
    await db.directoryInstitution.delete({ where: { id: fixture.id } }).catch(() => {});
    await db.$disconnect();
  }
});

test("readiness returns 200 when the test database is ready", async ({ request }) => {
  const response = await request.get("/api/readiness");
  expect(response.status()).toBe(200);
  expect((await response.json()).ok).toBe(true);
});
