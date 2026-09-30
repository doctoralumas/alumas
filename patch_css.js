const fs = require('fs');
let css = fs.readFileSync('app/home-visual.css', 'utf8');

const replacements = [
  {
    from: /.home-shell \{\n  width: min\(1430px, calc\(100% - 106px\)\);\n  margin: 0 auto;\n\}/g,
    to: `.home-shell {
  width: min(1434px, calc(100% - 104px));
  margin: 0 auto;
}`
  },
  {
    from: /.home-header-inner \{\n  height: 72px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n\}/g,
    to: `.home-header-inner {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: calc(100% - 164px);
  max-width: 1460px;
  margin: 0 auto;
}`
  },
  {
    from: /.home-search \{\n  width: min\(1140px, 100%\);\n  margin: 18px auto 0;\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n\}/g,
    to: `.home-search {
  width: min(1144px, 100%);
  margin: 33px auto 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
}`
  },
  {
    from: /.home-search-field \{\n  flex: 1;\n  min-width: 0;\n  height: 60px;\n  background: #fff;\n  border-radius: 14px;\n  box-shadow: 0 4px 14px rgba\(20, 70, 100, 0\.08\);\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 6px 6px 18px;\n\}/g,
    to: `.home-search-field {
  flex: 1;
  min-width: 0;
  height: 62px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(20, 70, 100, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 20px;
}`
  },
  {
    from: /.home-search-field input \{\n  flex: 1;\n  min-width: 0;\n  border: 0;\n  outline: none;\n  background: transparent;\n  font-size: 16px;\n  font-weight: 500;\n  color: #16344e;\n\}/g,
    to: `.home-search-field input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 17px;
  font-weight: 500;
  color: #16344e;
}`
  },
  {
    from: /.home-search-go \{\n  height: 48px;\n  padding: 0 18px;\n  border: 0;\n  border-radius: 12px;\n  background: #0bbec5;\n  color: #fff;\n  font-size: 16px;\n  font-weight: 700;\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  cursor: pointer;\n  flex-shrink: 0;\n\}/g,
    to: `.home-search-go {
  height: 50px;
  padding: 0 24px;
  border: 0;
  border-radius: 14px;
  background: #0bbec5;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex-shrink: 0;
}`
  },
  {
    from: /.home-search-luma \{\n  height: 60px;\n  padding: 0 18px;\n  background: #fff;\n  color: #16344e;\n  border-radius: 14px;\n  box-shadow: 0 4px 14px rgba\(20, 70, 100, 0\.08\);\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  text-decoration: none;\n  font-size: 15px;\n  font-weight: 700;\n  white-space: nowrap;\n  flex-shrink: 0;\n\}/g,
    to: `.home-search-luma {
  height: 62px;
  width: 165px;
  justify-content: center;
  background: #fff;
  color: #16344e;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(20, 70, 100, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}`
  },
  {
    from: /.home-hero \{\n  position: relative;\n  height: 272px;\n  margin-top: 16px;\n  border-radius: 18px;\n  overflow: hidden;\n  background: #05475f;\n\}/g,
    to: `.home-hero {
  position: relative;
  height: 275px;
  margin-top: 23px;
  border-radius: 16px;
  overflow: hidden;
  background: transparent;
}
.home-hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #094754 0%, #157d8e 45%, #bcebef 100%);
  z-index: 1;
}
.home-hero-doctor {
  position: absolute;
  width: auto;
  object-fit: contain;
  height: 104%;
  bottom: -2px;
  left: 54%;
  z-index: 2;
}
.home-hero-kit {
  position: absolute;
  width: auto;
  object-fit: contain;
  height: 85%;
  right: 32px;
  top: 18px;
  z-index: 3;
}`
  },
  {
    from: /.home-hero-art \{\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center center;\n  pointer-events: none;\n  user-select: none;\n  z-index: 0;\n\}/g,
    to: ``
  },
  {
    from: /.home-hero-copy \{\n  position: relative;\n  z-index: 2;\n  padding: 46px 0 0 46px;\n  max-width: 460px;\n\}/g,
    to: `.home-hero-copy {
  position: relative;
  z-index: 10;
  padding: 55px 0 0 80px;
  max-width: 500px;
}`
  },
  {
    from: /.home-hero h1 \{\n  margin: 0;\n  color: #fff;\n  font-size: 58px;\n  font-weight: 800;\n  letter-spacing: -0\.035em;\n  line-height: 1\.05;\n\}/g,
    to: `.home-hero h1 {
  margin: 0;
  color: #fff;
  font-size: 59px;
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.05;
  text-shadow: none;
}`
  },
  {
    from: /.home-hero-sub \{\n  margin: 14px 0 0;\n  color: rgba\(255, 255, 255, 0\.94\);\n  font-size: 20px;\n  font-weight: 500;\n  line-height: 1\.35;\n\}/g,
    to: `.home-hero-sub {
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 1);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.35;
}`
  },
  {
    from: /.home-hero-accent \{\n  width: 52px;\n  height: 4px;\n  margin-top: 16px;\n  border-radius: 4px;\n  background: #2ad4d6;\n\}/g,
    to: `.home-hero-accent {
  width: 42px;
  height: 4px;
  margin-top: 24px;
  border-radius: 2px;
  background: #0bbec5;
}`
  },
  {
    from: /.home-heading \{\n  margin: 22px 0 14px;\n  font-size: 30px;\n  font-weight: 800;\n  letter-spacing: -0\.03em;\n  color: #12243f;\n  line-height: 1\.15;\n\}/g,
    to: `.home-heading {
  margin: 22px 0 14px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #12243f;
  line-height: 1.15;
}`
  },
  {
    from: /.home-promo-arrow \{\n  width: 32px;\n  height: 32px;\n  margin-top: 14px;\n  border-radius: 50%;\n  background: #d4f3f8;\n  color: #0c8f98;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n\}/g,
    to: `.home-promo-arrow {
  width: 40px;
  height: 40px;
  margin-top: 14px;
  border-radius: 50%;
  background: #d4f3f8;
  color: #0c8f98;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.home-promo-arrow svg {
  width: 20px;
  height: 20px;
}`
  },
  {
    from: /.home-promo \{\n  position: relative;\n  display: block;\n  height: 176px;\n  padding: 22px 46% 18px 22px;\n  border-radius: 16px;\n  background: #e3f7fc;\n  text-decoration: none;\n  overflow: hidden;\n  color: #12243f;\n\}/g,
    to: `.home-promo {
  position: relative;
  display: block;
  height: 172px;
  padding: 24px 48% 24px 24px;
  border-radius: 16px;
  background: #e4f7fc;
  text-decoration: none;
  overflow: hidden;
  color: #12243f;
}`
  },
  {
    from: /.home-promo h3 \{\n  margin: 0;\n  font-size: 24px;\n  font-weight: 800;\n  letter-spacing: -0\.03em;\n  line-height: 1\.15;\n  color: #12243f;\n\}/g,
    to: `.home-promo h3 {
  margin: 0;
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: #12243f;
}`
  },
  {
    from: /.home-promo p \{\n  margin: 8px 0 0;\n  font-size: 15\.5px;\n  line-height: 1\.35;\n  color: #5d7388;\n  font-weight: 500;\n\}/g,
    to: `.home-promo p {
  margin: 8px 0 0;
  font-size: 16px;
  line-height: 1.35;
  color: #5d7388;
  font-weight: 500;
}`
  }
];

for (let r of replacements) {
  css = css.replace(r.from, r.to);
}

fs.writeFileSync('app/home-visual.css', css, 'utf8');
console.log('home-visual.css patched');
