const fs = require('fs');

const headerFile = 'components/header.tsx';
let headerCode = fs.readFileSync(headerFile, 'utf8');

headerCode = headerCode.replace('className={`home-header ${homeFont.className}`}>\n        <div className="home-shell home-header-inner">', 'className={`home-header ${homeFont.className}`}>\n        <div className="home-header-inner">');

fs.writeFileSync(headerFile, headerCode, 'utf8');
console.log('header.tsx patched');
