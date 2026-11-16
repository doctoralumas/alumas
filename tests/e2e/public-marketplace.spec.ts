import { test, expect } from "@playwright/test";

test("normalized, published hospital directory is publicly readable", async ({ request }) => {
  const response = await request.get("/api/organizations?type=HOSPITAL");
  expect(response.ok()).toBe(true);

  const rows = await response.json();
  expect(Array.isArray(rows)).toBe(true);
  const seedHospital = rows.find((row: any) => row.slug === "alumas-sehir-hastanesi");
  expect(seedHospital).toBeDefined();
  expect(seedHospital.type).toBe("HOSPITAL");
  expect(seedHospital.isVerified).toBe(true);
  expect(rows.every((row: any) =>
    typeof row.name === "string" && row.name.length > 0 &&
    row.type === "HOSPITAL" && typeof row.isVerified === "boolean"
  )).toBe(true);
});

test("readiness returns 200 when the test database is ready", async ({ request }) => {
  const response = await request.get("/api/readiness");
  expect(response.status()).toBe(200);
  expect((await response.json()).ok).toBe(true);
});
