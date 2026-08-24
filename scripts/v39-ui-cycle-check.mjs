import fs from 'node:fs';
const home=fs.readFileSync('app/page.tsx','utf8');
const cycle=fs.readFileSync('app/health/cycle/page.tsx','utf8');
const api=fs.readFileSync('app/api/health/cycle/route.ts','utf8');
const css=fs.readFileSync('app/globals.css','utf8');
const checks={grid:home.includes('home-tile-grid')&&css.includes('grid-template-columns:repeat(12'),cycleCard:home.includes('/health/cycle'),cycleUI:cycle.includes('Regl Takibi')&&cycle.includes('Ortalama döngü')&&cycle.includes('Tahmini sonraki'),cycleCRUD:api.includes('export async function POST')&&api.includes('export async function DELETE')&&api.includes('findMany'),auth:api.includes('currentUser'),validation:api.includes('z.object')};
console.log(checks);if(Object.values(checks).some(v=>!v))process.exit(1);
