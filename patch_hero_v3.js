const fs = require('fs');

let cssCode = fs.readFileSync('app/home-visual.css', 'utf8');

cssCode = cssCode.replace(
  /\.home-hero-copy \{\n\s*padding: 24px 0 0 20px;\n\s*max-width: 68%;\n\s*\}/g,
  `.home-hero-copy {
      padding: 24px 0 0 20px;
      width: 68%;
      max-width: none;
    }`
);

fs.writeFileSync('app/home-visual.css', cssCode, 'utf8');
console.log('Mobile hero copy fixed.');
