const fs = require('fs');

let cssCode = fs.readFileSync('app/home-visual.css', 'utf8');

const mobileHeroCSS = `
    .home-hero-kit {
      display: none;
    }
    .home-hero-doctor {
      right: -5%;
      height: 95%;
    }
`;

cssCode = cssCode.replace(
  /\.home-hero-copy \{\n\s*padding: 24px 0 0 20px;\n\s*width: 68%;\n\s*max-width: none;\n\s*\}/g,
  `.home-hero-copy {
      padding: 24px 0 0 20px;
      width: 68%;
      max-width: none;
    }
${mobileHeroCSS}`
);

fs.writeFileSync('app/home-visual.css', cssCode, 'utf8');
console.log('Mobile hero image fix applied.');
