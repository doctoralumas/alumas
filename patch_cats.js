const fs = require('fs');
let css = fs.readFileSync('app/home-visual.css', 'utf8');

const replacements = [
  {
    from: /\.home-cat-label \{\n  display: block;\n  text-align: center;\n  font-size: 16px;\n  font-weight: 700;\n  line-height: 1\.2;\n  padding: 4px 6px 12px;\n  color: #12243f;\n\}/g,
    to: `.home-cat-label {
  display: block;
  text-align: center;
  font-size: 16.5px;
  font-weight: 750;
  line-height: 1.2;
  padding: 4px 6px 12px;
  color: #12243f;
}`
  },
  {
    from: /\.home-cat\[data-id="institutions"\] .home-cat-visual img,\n\.home-cat\[data-id="tourism"\] .home-cat-visual img,\n\.home-cat\[data-id="nearby"\] .home-cat-visual img,\n\.home-cat\[data-id="insurance"\] .home-cat-visual img \{\n  object-fit: contain;\n  padding: 8px 6px 0;\n\}/g,
    to: `.home-cat[data-id="institutions"] .home-cat-visual img {
  object-fit: contain;
  padding: 8px 6px 0;
  transform: scale(1.1);
}
.home-cat[data-id="tourism"] .home-cat-visual img {
  object-fit: contain;
  padding: 8px 6px 0;
  transform: scale(1.15) translateY(-5%);
}
.home-cat[data-id="nearby"] .home-cat-visual img {
  object-fit: contain;
  padding: 8px 6px 0;
  transform: scale(1.15) translateY(-2%);
}
.home-cat[data-id="insurance"] .home-cat-visual img {
  object-fit: contain;
  padding: 8px 6px 0;
  transform: scale(1.2);
}`
  },
  {
    from: /\.home-cat\[data-fit="cover"\] .home-cat-visual img \{\n  object-fit: cover;\n  object-position: center 16%;\n\}/g,
    to: `.home-cat[data-fit="cover"] .home-cat-visual img {
  object-fit: cover;
  object-position: center 16%;
}
.home-cat[data-id="experts"] .home-cat-visual img {
  transform: scale(1.1);
}
.home-cat[data-id="home"] .home-cat-visual img {
  transform: scale(1.05);
}`
  },
  {
    from: /\.home-cat\[data-id="health"\] .home-cat-visual img \{\n  object-fit: contain;\n  padding: 10px 8px 0;\n  object-position: center center;\n\}/g,
    to: `.home-cat[data-id="health"] .home-cat-visual img {
  object-fit: contain;
  padding: 10px 8px 0;
  object-position: center center;
  transform: scale(1.15) translateY(2%);
}`
  }
];

for (let r of replacements) {
  css = css.replace(r.from, r.to);
}

fs.writeFileSync('app/home-visual.css', css, 'utf8');
console.log('Category styles patched');
