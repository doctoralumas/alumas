const fs = require('fs');
let c = fs.readFileSync('app/home-care/client.tsx', 'utf8');

c = c.replace('export default function Page(){', 'import ClientLockOverlay from "@/components/client-lock-overlay";\nexport default function HomeCareClient({ isLoggedIn }: { isLoggedIn: boolean }) {');

c = c.replace('<form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>', '<ClientLockOverlay isLoggedIn={isLoggedIn}>\n          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>');

c = c.replace(/<\/form>\s*<\/section>/, '</form>\n          </ClientLockOverlay>\n        </section>');

fs.writeFileSync('app/home-care/client.tsx', c, 'utf8');

