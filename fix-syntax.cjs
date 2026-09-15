const fs = require('fs');

// Fix labs/route.ts
let labsContent = fs.readFileSync('app/api/health/labs/route.ts', 'utf8');
labsContent = labsContent.replace('}else const where:any={userId};', '} const where:any={userId};');
fs.writeFileSync('app/api/health/labs/route.ts', labsContent);

// Fix imaging/route.ts
let imagingContent = fs.readFileSync('app/api/health/imaging/route.ts', 'utf8');
imagingContent = imagingContent.replace("}else return NextResponse.json(await prisma.imagingResult.findMany", "} return NextResponse.json(await prisma.imagingResult.findMany");
fs.writeFileSync('app/api/health/imaging/route.ts', imagingContent);

console.log('Fixed syntax errors in labs and imaging APIs');

