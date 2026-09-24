import * as fs from 'fs';

const orgManagerPath = 'components/business/organization-manager.tsx';
let managerCode = fs.readFileSync(orgManagerPath, 'utf8');

// Modify saveHours to have a success state
managerCode = managerCode.replace(
  'const [hours, setHours] = useState<any[]>(org.hours || []);',
  'const [hours, setHours] = useState<any[]>(org.hours || []);\n  const [hoursSaved, setHoursSaved] = useState(false);'
);

managerCode = managerCode.replace(
  'async function saveHours() { const payload = days.map((_, weekday) => { const row = hours.find((h: any) => h.weekday === weekday) || {}; return { weekday, isClosed: !!row.isClosed, opensAt: row.opensAt || "09:00", closesAt: row.closesAt || "18:00" }; }); const r = await fetch(/api/organizations/ + org.id + /hours, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ hours: payload }) }); setMsg(r.ok ? "Çalýþma saatleri kaydedildi" : "Saatler kaydedilemedi"); }',
  'async function saveHours() { const payload = days.map((_, weekday) => { const row = hours.find((h: any) => h.weekday === weekday) || {}; return { weekday, isClosed: !!row.isClosed, opensAt: row.opensAt || "09:00", closesAt: row.closesAt || "18:00" }; }); const r = await fetch(/api/organizations/ + org.id + /hours, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ hours: payload }) }); if(r.ok) { setHoursSaved(true); setTimeout(() => setHoursSaved(false), 2000); } else setMsg("Saatler kaydedilemedi"); }'
);

managerCode = managerCode.replace(
  '<button className="primary" onClick={saveHours}>Tüm Saatleri Kaydet</button>',
  '<button className="primary" onClick={saveHours} style={{ backgroundColor: hoursSaved ? "#16a34a" : undefined }}>{hoursSaved ? "? Kaydedildi" : "Tüm Saatleri Kaydet"}</button>'
);

fs.writeFileSync(orgManagerPath, managerCode);
console.log('Modified organization-manager.tsx');
