const fs = require('fs');

let pageCode = fs.readFileSync('app/page.tsx', 'utf8');

// Update image sources to the cutout versions
pageCode = pageCode.replace(
  'src="/assets/home-reference/processed/hero-doctor.png"', 
  'src="/assets/home-reference/processed/hero-doctor-cutout.png"'
);
pageCode = pageCode.replace(
  'src="/assets/home-reference/processed/hero-medical-kit-only.png"', 
  'src="/assets/home-reference/processed/hero-medical-kit-cutout.png"'
);

fs.writeFileSync('app/page.tsx', pageCode, 'utf8');
console.log('page.tsx image paths updated to cutouts');

let cssCode = fs.readFileSync('app/home-visual.css', 'utf8');
// Update doctor positioning
cssCode = cssCode.replace(
  /height: 104%;\n  bottom: -2px;\n  left: 54%;/,
  'height: 109%;\n  bottom: -2px;\n  left: 52%;'
);

// Update kit positioning
cssCode = cssCode.replace(
  /height: 85%;\n  right: 32px;\n  top: 18px;/,
  'height: 84%;\n  right: 28px;\n  top: 20px;'
);

fs.writeFileSync('app/home-visual.css', cssCode, 'utf8');
console.log('home-visual.css hero positions updated');
