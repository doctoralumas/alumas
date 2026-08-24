import fs from 'node:fs';
const checks=['model OrganizationFavorite','model OrganizationReview','isOnDuty','/api/organizations/${organizationId}/availability','Yakınımdakiler','Nöbetçi eczane','OrganizationBooking','OrganizationReviews'];
const text=[fs.readFileSync('prisma/schema.prisma','utf8'),fs.readFileSync('components/organization-directory.tsx','utf8'),fs.readFileSync('components/organization-booking.tsx','utf8'),fs.readFileSync('components/organization-actions.tsx','utf8')].join('\n');
const missing=checks.filter(x=>!text.includes(x));if(missing.length){console.error('Eksik marketplace parçaları:',missing);process.exit(1)}console.log('Alumas v12 marketplace kaynak kontrolü başarılı.');
