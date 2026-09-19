const fs = require('fs');

let c = fs.readFileSync('components/google-nearby-places.tsx', 'utf8');

// 1. Reset ownership when category changes
c = c.replace(
  'const [category, setCategory] = useState(initial in cats ? initial : "health");',
  'const [category, setCategory] = useState(initial in cats ? initial : "health");\n  const [ownership, setOwnership] = useState<"all"|"private"|"public">("all");\n  \n  function handleCategoryChange(k: string) {\n    setCategory(k);\n    if (!["health", "hospital", "emergency", "clinic"].includes(k)) setOwnership("all");\n  }'
);
c = c.replace('const [ownership, setOwnership] = useState<"all"|"private"|"public">("all");\n', ''); // remove the old one

// 2. Use handleCategoryChange instead of setCategory
c = c.replace(/onClick=\{\(\) => setCategory\(k\)\}/g, 'onClick={() => handleCategoryChange(k)}');

// 3. Conditionally render the ownership pills
c = c.replace(
  '<div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>\n        <button onClick={() => setOwnership("all")',
  '{["health", "hospital", "emergency", "clinic"].includes(category) && (\n      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>\n        <button onClick={() => setOwnership("all")}'
);
c = c.replace('Devlet Hastaneleri</button>\n      </div>', 'Devlet Hastaneleri</button>\n      </div>\n      )}');

// Let's ensure we don't duplicate logic. I will rewrite the whole file nicely.
