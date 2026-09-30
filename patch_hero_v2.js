const fs = require('fs');

let cssCode = fs.readFileSync('app/home-visual.css', 'utf8');

const oldHeroDoctor = /\.home-hero-doctor\s*\{[\s\S]*?\}/;
const newHeroDoctor = `.home-hero-doctor {
  position: absolute;
  width: auto;
  object-fit: contain;
  object-position: bottom center;
  height: 97%;
  bottom: 0;
  right: 27%;
  z-index: 2;
  filter: drop-shadow(-8px 10px 24px rgba(10, 45, 60, 0.18));
}`;
cssCode = cssCode.replace(oldHeroDoctor, newHeroDoctor);

const oldHeroKit = /\.home-hero-kit\s*\{[\s\S]*?\}/;
const newHeroKit = `.home-hero-kit {
  position: absolute;
  width: auto;
  object-fit: contain;
  object-position: center right;
  height: 68%;
  right: 3%;
  top: 12%;
  z-index: 3;
  filter: drop-shadow(-6px 14px 20px rgba(10, 45, 60, 0.2));
}`;
cssCode = cssCode.replace(oldHeroKit, newHeroKit);

const oldHeroGradient = /\.home-hero-gradient\s*\{[\s\S]*?\}/;
const newHeroGradient = `.home-hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #0f5a66 0%, #1f7f90 38%, #5bbfca 68%, #bfe8ec 100%);
  z-index: 1;
}`;
cssCode = cssCode.replace(oldHeroGradient, newHeroGradient);

const oldHeroCopy = /\.home-hero-copy\s*\{[\s\S]*?\}/;
const newHeroCopy = `.home-hero-copy {
  position: relative;
  z-index: 10;
  padding: 55px 0 0 80px;
  width: 45%;
}`;
cssCode = cssCode.replace(oldHeroCopy, newHeroCopy);

fs.writeFileSync('app/home-visual.css', cssCode, 'utf8');
console.log('Hero CSS updated.');
