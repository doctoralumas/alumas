const fs = require('fs');
let css = fs.readFileSync('app/home-visual.css', 'utf8');

const oldPromoImg = `.home-promo img {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 108%;
  width: 54%;
  object-fit: contain;
  object-position: right bottom;
  pointer-events: none;
}

.home-promo[data-id="hospital"] img {
  height: 102%;
  width: 58%;
  right: -4px;
}

.home-promo[data-id="insurance"] img {
  height: 112%;
  width: 58%;
  right: -6px;
  bottom: -8px;
}`;

const newPromoImg = `.home-promo img {
  position: absolute;
  right: -10px;
  bottom: -10px;
  height: 125%;
  width: 60%;
  object-fit: contain;
  object-position: right bottom;
  pointer-events: none;
}

.home-promo[data-id="doctor"] img {
  height: 130%;
  width: 65%;
  right: -5px;
  bottom: -5px;
}

.home-promo[data-id="hospital"] img {
  height: 110%;
  width: 62%;
  right: -8px;
  bottom: -5px;
}

.home-promo[data-id="insurance"] img {
  height: 120%;
  width: 65%;
  right: -10px;
  bottom: -15px;
}`;

// I will use string replace. I will replace it if it exists.
if (css.includes('.home-promo img {\n  position: absolute;')) {
  css = css.replace(oldPromoImg, newPromoImg);
} else {
  // Try regex replace
  css = css.replace(/\.home-promo img \{[\s\S]*?\.home-promo\[data-id="insurance"\] img \{[\s\S]*?\}/, newPromoImg);
}

fs.writeFileSync('app/home-visual.css', css, 'utf8');
console.log('Promo images patched');
