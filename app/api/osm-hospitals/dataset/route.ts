import osmRecords from "@/data/osm/hospitals.json";
import { osmPreviewRequestAllowed } from "@/lib/osm-hospital-directory";

// The independent OSM extract is built without querying or filtering against
// ALUMAS institutions. Never include the private matched/displayed subset.
export async function GET(req: Request) {
  if (!osmPreviewRequestAllowed(req)) return new Response(null, { status: 404 });
  return Response.json({
    attribution: "© OpenStreetMap contributors",
    license: "https://opendatacommons.org/licenses/odbl/1-0/",
    source: "https://download.geofabrik.de/europe/turkey.html",
    description: "Independent OSM hospital extract; no ALUMAS institution or matching data.",
    source_dates: [...new Set(osmRecords.map((item) => item.source_date).filter(Boolean))],
    records: osmRecords,
  }, { headers: {
    "Content-Disposition": 'attachment; filename="alumas-osm-hospitals-odbl.json"',
    "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff",
  } });
}
