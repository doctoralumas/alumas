import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// Node 22.18+ natively strips the non-runtime TypeScript syntax in this pure module.
const {
  hospitalNameKey,
  isDisplayableOsmHospital,
  samePhysicalHospital,
  uniqueOsmDisplayIds,
  hideCuratedHospitalDuplicates,
} = await import("../../lib/osm-hospital-matching.ts");

const raw = JSON.parse(readFileSync(new URL("../../data/osm/hospitals.json", import.meta.url), "utf8"));
const records = raw.map((r) => ({
  sourceId: r.source_id, name: r.name, city: r.osm_city || null,
  district: r.osm_district || null, address: r.address || null,
  website: r.website || null, latitude: Number(r.latitude), longitude: Number(r.longitude),
}));

test("independent ODbL inventory has 1,366 unique source identities", () => {
  assert.equal(raw.length, 1366);
  assert.equal(new Set(raw.map((row) => row.source_id)).size, raw.length);
});

test("Turkish names compare consistently", () => {
  assert.equal(hospitalNameKey("ÖZEL ŞİŞLİ HASTANESİ"), "ozel sisli hastanesi");
});

test("real hospitals with only name + coordinates stay discoverable", () => {
  const hospital = records.find((r) => r.name === "Özel Çankaya Hastanesi");
  assert.ok(hospital);
  assert.equal(hospital.city, null);
  assert.equal(isDisplayableOsmHospital(hospital), true);
});

test("generic map labels, former facilities and subfacilities are suppressed", () => {
  const candidate = (name) => ({name,latitude:41.01,longitude:29.01});
  for (const name of [
    "Hastane", "Devlet Hastanesi", "Eski Kemer Devlet Hastanesi",
    "Vatan Hastanesi Acil", "Kocaeli Şehir Hastanesi Acil Girişi",
    "Taşova Devlet Hastanesi Ana Binası",
  ]) assert.equal(isDisplayableOsmHospital(candidate(name)), false, name);
  assert.equal(isDisplayableOsmHospital(candidate("Taşova Devlet Hastanesi")), true);
});

test("same-name nearby hospital duplicates are recognized; branch locations stay separate", () => {
  const first = { name:"Özel Örnek Hastanesi",city:"İstanbul",latitude:41,longitude:29 };
  const repeated = { ...first,latitude:41.00015,longitude:29.00005 };
  const otherBranch = { ...first,latitude:41.2,longitude:29.3 };
  assert.equal(samePhysicalHospital(first,repeated),true);
  assert.equal(samePhysicalHospital(first,otherBranch),false);
});

test("different hospitals can share a campus without being collapsed", () => {
  const first = {name:"Çevre Hastanesi",latitude:41,longitude:29};
  const second = {name:"Aksoy Hastanesi",latitude:41.00001,longitude:29};
  assert.equal(samePhysicalHospital(first,second),false);
});

test("missing coordinates do not merge chains merely because names match", () => {
  const a={name:"Örnek Hastanesi",city:"Ankara",address:""};
  const b={name:"Örnek Hastanesi",city:"Ankara",address:""};
  assert.equal(samePhysicalHospital(a,b),false);
});

test("the exact source remains available even when a curated card takes precedence", () => {
  const osm=[{name:"Örnek Hastanesi",latitude:41,longitude:29,sourceId:"OSM:node/1"},
             {name:"Başka Hastane",latitude:41.01,longitude:29.01,sourceId:"OSM:node/2"}];
  const result=hideCuratedHospitalDuplicates(osm,[{name:"Örnek Hastanesi",latitude:41,longitude:29}]);
  assert.deepEqual(result.map((r)=>r.sourceId),["OSM:node/2"]);
  assert.equal(osm.length,2);
});

test("real OSM selection is stable, includes 1,200+ hospitals, and has no self duplicates", () => {
  const before=JSON.stringify(records);
  const ids=uniqueOsmDisplayIds(records);
  assert.ok(ids.size>1200, `Unexpectedly few retained hospitals: ${ids.size}`);
  assert.ok(ids.size<records.length);
  assert.ok(ids.has("OSM:node/75319365"), "Çankaya Hospital must be preserved");
  assert.equal(JSON.stringify(records),before, "selection must not mutate source order");
  assert.deepEqual([...uniqueOsmDisplayIds([...records].reverse())].sort(),[...ids].sort());
});


test("curated fixture hospitals align with independent OSM references", () => {
  const cases = [
    { name: "Acıbadem Maslak Hastanesi", latitude: 41.1264, longitude: 29.0247, sourceId: "OSM:way/1319843595" },
    { name: "VKV Amerikan Hastanesi", latitude: 41.0522, longitude: 28.9935, sourceId: "OSM:node/2311684920" },
    { name: "Memorial Şişli Hastanesi", latitude: 41.0615, longitude: 28.9734, sourceId: "OSM:way/382843570" },
    { name: "Ankara Bilkent Şehir Hastanesi", latitude: 39.8986, longitude: 32.7565, sourceId: "OSM:way/724710677" },
  ];
  for (const { sourceId, ...curated } of cases) {
    const osm = records.find((item) => item.sourceId === sourceId);
    assert.ok(osm, sourceId);
    assert.equal(samePhysicalHospital(curated, osm), true, `Not matched: ${curated.name}`);
    assert.deepEqual(hideCuratedHospitalDuplicates([osm], [curated]), [],
      `Curated record must take precedence for ${curated.name}`);
  }
});
