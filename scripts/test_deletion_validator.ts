import {
  validateAccountDeletionConfirmation,
  normalizeDeletionPhrase,
  getDeletionMessages,
} from "../lib/account-deletion";

const tests: Array<[string | null | undefined, boolean, string | null]> = [
  // Turkish canonical and variations
  ["HESABIMI SİL", true, "tr"],
  ["hesabımı sil", true, "tr"],
  ["Hesabımı Sil", true, "tr"],
  ["  hesabımı sil  ", true, "tr"],
  ["HESABIMI SIL", true, "tr"],
  ["hesabimi sil", true, "tr"],
  ["   HESABIMI    SİL   ", true, "tr"],
  ["hesabımı   sil", true, "tr"],

  // English canonical and variations
  ["DELETE MY ACCOUNT", true, "en"],
  ["delete my account", true, "en"],
  ["Delete My Account", true, "en"],
  ["  DELETE MY ACCOUNT  ", true, "en"],
  ["   delete    my    account   ", true, "en"],

  // Invalid phrases / edge cases
  ["random", false, null],
  ["", false, null],
  [null, false, null],
  [undefined, false, null],
  ["hesabımı", false, null],
  ["sil", false, null],
  ["delete", false, null],
  ["my account", false, null],
  ["HESABIMI SİL LÜTFEN", false, null],
  ["PLEASE DELETE MY ACCOUNT", false, null],
];

let failed = 0;
for (const [input, expectedValid, expectedLang] of tests) {
  const res = validateAccountDeletionConfirmation(input);
  if (res.isValid !== expectedValid || res.matchedLanguage !== expectedLang) {
    console.error("FAIL:", { input, expectedValid, expectedLang, actual: res });
    failed++;
  }
}

if (failed === 0) {
  console.log(`SUCCESS: All ${tests.length} unit test cases passed!`);
} else {
  console.error(`FAILED: ${failed} tests failed.`);
  process.exit(1);
}

// Test messages
console.log("TR messages loaded:", Object.keys(getDeletionMessages("tr")).length);
console.log("EN messages loaded:", Object.keys(getDeletionMessages("en")).length);
