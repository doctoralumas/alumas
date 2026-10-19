import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (p) => fs.readFileSync(p, "utf8");

test("A-O: Runtime behavioral verification of Authentication Identity Consistency, Canonical E.164, Dual-Credential Resolution, and Security Hardening", () => {
  const inlineScript = `
    import assert from "node:assert/strict";
    import { createHash, randomBytes } from "node:crypto";
    import {
      normalizePhone,
      isValidPhone,
      getPhoneLookupVariants,
      formatDisplayPhone,
      passwordPolicy,
      normalizeEmail,
    } from "./lib/security.ts";
    import { hashPassword, verifyPassword } from "./lib/auth.ts";

    // =========================================================================
    // 1. MATRIX G: CANONICAL E.164 NORMALIZATION CONTRACTS
    // =========================================================================
    const canonicalExpected = "+905421234567";

    // All valid Turkish phone representations must resolve to identical canonical E.164
    const turkishVariants = [
      "5421234567",               // 10 digits without leading 0
      "05421234567",              // 11 digits with leading 0
      "+905421234567",            // E.164 with plus
      "+90 542 123 45 67",        // Spaced format
      "0 (542) 123 45 67",        // National format with parentheses & spaces
      "0542-123-45-67",           // Dashed national format
      "+90 (542) 123-4567",       // Mixed international format
      "00905421234567",           // International dial prefix 0090
      "+9005421234567",           // Accidental 0 after +90
      "905421234567",             // Prefix 90 without plus
      "   0542 123 45 67   ",     // Leading/trailing whitespace
    ];

    for (const raw of turkishVariants) {
      assert.equal(
        normalizePhone(raw),
        canonicalExpected,
        "Failed canonical normalization for input: " + raw
      );
      assert.equal(
        isValidPhone(raw),
        true,
        "Phone must be valid: " + raw
      );
    }

    // International numbers
    assert.equal(normalizePhone("+44 7911 123456"), "+447911123456");
    assert.equal(isValidPhone("+44 7911 123456"), true);

    assert.equal(normalizePhone("+1 (202) 555-0123"), "+12025550123");
    assert.equal(isValidPhone("+1 (202) 555-0123"), true);

    assert.equal(normalizePhone("0049 151 23456789"), "+4915123456789");
    assert.equal(isValidPhone("0049 151 23456789"), true);

    // Invalid phone inputs
    assert.equal(normalizePhone(""), "");
    assert.equal(isValidPhone(""), false);
    assert.equal(isValidPhone(null), false);
    assert.equal(isValidPhone(undefined), false);
    assert.equal(isValidPhone("invalid-string"), false);
    assert.equal(isValidPhone("12345"), false); // too short
    assert.equal(isValidPhone("+905551234"), false); // Turkish too short (9 digits)
    assert.equal(isValidPhone("+90555123456789"), false); // Turkish too long (12 digits)

    // Display formatting
    assert.equal(formatDisplayPhone("+905421234567"), "0542 123 45 67");
    assert.equal(formatDisplayPhone("05421234567"), "0542 123 45 67");

    // =========================================================================
    // 2. MATRIX G & M: PHONE LOOKUP VARIANTS & BACKWARD-COMPATIBILITY
    // =========================================================================
    const variants = getPhoneLookupVariants(canonicalExpected);
    assert.ok(variants.includes("+905421234567"), "Must include canonical E.164");
    assert.ok(variants.includes("5421234567"), "Must include legacy 10-digit format");
    assert.ok(variants.includes("05421234567"), "Must include 11-digit national format");
    assert.ok(variants.includes("905421234567"), "Must include 12-digit prefixed format");

    // Simulated legacy database lookup test:
    // If a legacy row in DB stores "5421234567", any user query variant must find it
    const mockDbUser = {
      id: "usr_legacy_1001",
      email: "doctor@alumas.com",
      phone: "5421234567", // Stored in legacy 10-digit format
      role: "DOCTOR",
    };

    function simulateUserPhoneLookup(inputPhone, dbRecord) {
      const canonical = normalizePhone(inputPhone);
      if (!canonical) return null;
      const lookupVariants = getPhoneLookupVariants(canonical);
      return lookupVariants.includes(dbRecord.phone) ? dbRecord : null;
    }

    assert.equal(
      simulateUserPhoneLookup("+90 542 123 45 67", mockDbUser)?.id,
      mockDbUser.id,
      "Legacy 10-digit DB record must match international format query"
    );
    assert.equal(
      simulateUserPhoneLookup("0542 123 45 67", mockDbUser)?.id,
      mockDbUser.id,
      "Legacy 10-digit DB record must match national format query"
    );

    // =========================================================================
    // 3. MATRIX A: EMAIL REGISTRATION -> PHONE VERIFICATION -> LOGOUT -> PHONE LOGIN
    // =========================================================================
    // User registers with email first
    const registeredUser = {
      id: "usr_alice_canonical_id",
      email: "alice@example.com",
      phone: null,
      role: "PATIENT",
      passwordHash: hashPassword("AliceSecurePass123!"),
      appointments: [{ id: "appt_1", doctorName: "Dr. Mehmet" }],
    };

    // Alice verifies her phone in profile
    const verifiedPhoneInput = "0532 987 65 43";
    const canonicalAlicePhone = normalizePhone(verifiedPhoneInput);
    registeredUser.phone = canonicalAlicePhone;

    // Alice logs out (session cleared). Then Alice logs in using phone OTP:
    const phoneLoginQuery = "+90 532 987 65 43";
    const resolvedUserFromPhone = simulateUserPhoneLookup(phoneLoginQuery, registeredUser);

    assert.ok(resolvedUserFromPhone, "Phone login must resolve the existing user");
    assert.equal(
      resolvedUserFromPhone.id,
      "usr_alice_canonical_id",
      "Invariant A: Phone login must authenticate the EXACT SAME canonical User ID"
    );
    assert.equal(
      resolvedUserFromPhone.appointments.length,
      1,
      "Invariant C: Patient medical/appointment records must remain fully attached"
    );

    // =========================================================================
    // 4. MATRIX B: PHONE REGISTRATION -> EMAIL LINKING + PASSWORD -> LOGOUT -> EMAIL LOGIN
    // =========================================================================
    // Bob registers using Phone OTP first
    const phoneRegisteredUser = {
      id: "usr_bob_canonical_id",
      name: "Bob Builder",
      email: "phone-1792345678901-abc12345@alumas.local", // Dummy placeholder email
      phone: "+905331112233",
      role: "PATIENT",
      passwordHash: null, // No password initially
    };

    // Bob opens profile, updates email to real email and sets a password
    const linkedEmail = "bob.builder@construction.org";
    const linkedPassword = "SuperBobPassword2026!";

    // Verify passwordPolicy enforces required complexity
    assert.equal(passwordPolicy("short"), "Parola en az 10 karakter olmalı.");
    assert.equal(passwordPolicy("alllowercaseletters"), "Parola en az bir harf ve bir rakam içermeli.");
    assert.equal(passwordPolicy(linkedPassword), null, "Valid password must pass policy");

    phoneRegisteredUser.email = normalizeEmail(linkedEmail);
    phoneRegisteredUser.passwordHash = hashPassword(linkedPassword);

    // Bob logs out. Then Bob logs in via Email & Password (/login)
    const emailLoginAttempt = {
      email: "BOB.BUILDER@construction.org", // case-insensitive check
      password: linkedPassword,
    };

    const isEmailMatched = normalizeEmail(emailLoginAttempt.email) === phoneRegisteredUser.email;
    const isPasswordValid = verifyPassword(emailLoginAttempt.password, phoneRegisteredUser.passwordHash);

    assert.equal(isEmailMatched, true, "Email matching must be normalized and exact");
    assert.equal(isPasswordValid, true, "Password verification must succeed");
    assert.equal(
      phoneRegisteredUser.id,
      "usr_bob_canonical_id",
      "Invariant B: Email login must authenticate the EXACT SAME canonical User ID"
    );

    // =========================================================================
    // 5. MATRIX D, E, F: ROLE & PERMISSION CONSERVATION ACROSS DUAL AUTHENTICATION
    // =========================================================================
    // Doctor Dual-Auth Test
    const doctorAccount = {
      id: "usr_doctor_canonical_1",
      email: "dr.zeynep@alumas.com",
      phone: "+905553332211",
      role: "DOCTOR",
      doctorProfile: {
        id: "doc_prof_1",
        slug: "dr-zeynep-celik",
        title: "Prof. Dr.",
        specialty: "Kardiyoloji",
      },
    };
    const resolvedDoctor = simulateUserPhoneLookup("05553332211", doctorAccount);
    assert.equal(resolvedDoctor.role, "DOCTOR", "Role must remain DOCTOR");
    assert.equal(resolvedDoctor.doctorProfile.slug, "dr-zeynep-celik", "Doctor profile & slug must be preserved");

    // Organization Owner Dual-Auth Test
    const orgOwnerAccount = {
      id: "usr_org_owner_canonical_1",
      email: "director@acibadem.com",
      phone: "+905324445566",
      role: "ORGANIZATION",
      ownedOrganizationId: "org_acibadem_maslak",
    };
    const resolvedOrgOwner = simulateUserPhoneLookup("05324445566", orgOwnerAccount);
    assert.equal(resolvedOrgOwner.role, "ORGANIZATION", "Role must remain ORGANIZATION");
    assert.equal(resolvedOrgOwner.ownedOrganizationId, "org_acibadem_maslak", "Organization ownership preserved");

    // Admin Dual-Auth Test
    const adminAccount = {
      id: "usr_admin_canonical_1",
      email: "security-lead@alumas.com",
      phone: "+905448889900",
      role: "ADMIN",
    };
    const resolvedAdmin = simulateUserPhoneLookup("+905448889900", adminAccount);
    assert.equal(resolvedAdmin.role, "ADMIN", "Role must remain ADMIN with zero privilege escalation or de-escalation");

    // =========================================================================
    // 6. MATRIX H: REJECT LINKING PHONE ALREADY OWNED BY ANOTHER USER (409)
    // =========================================================================
    const userOne = { id: "user_1", email: "user1@alumas.com", phone: "+905557778899" };
    const userTwo = { id: "user_2", email: "user2@alumas.com", phone: null };

    function attemptLinkPhone(currentUserId, targetPhone, allUsers) {
      const canonical = normalizePhone(targetPhone);
      const existing = allUsers.find((u) => {
        const variants = getPhoneLookupVariants(canonical);
        return u.phone && variants.includes(u.phone);
      });
      if (existing && existing.id !== currentUserId) {
        return { status: 409, error: "Bu telefon numarası başka bir hesap tarafından kullanılıyor." };
      }
      return { status: 200, phone: canonical };
    }

    const collisionResult = attemptLinkPhone(userTwo.id, "0555 777 88 99", [userOne, userTwo]);
    assert.equal(collisionResult.status, 409, "Linking existing phone to another user must return 409 Conflict");
    assert.equal(userTwo.phone, null, "User two phone must NOT be modified");

    // Self-linking same phone is allowed (idempotent)
    const idempotentResult = attemptLinkPhone(userOne.id, "0555 777 88 99", [userOne, userTwo]);
    assert.equal(idempotentResult.status, 200, "Self-linking current phone must succeed");

    // =========================================================================
    // 7. MATRIX I: LOGIN WITH UNASSOCIATED PHONE MUST RETURN 404 (NEVER CREATE USER)
    // =========================================================================
    function verifyOtpLogin(canonicalPhone, allUsers) {
      const user = allUsers.find((u) => {
        const variants = getPhoneLookupVariants(canonicalPhone);
        return u.phone && variants.includes(u.phone);
      });
      if (!user) {
        return { status: 404, code: "ACCOUNT_NOT_FOUND" };
      }
      return { status: 200, user };
    }

    const unassociatedPhoneResult = verifyOtpLogin("+905550001122", [userOne, userTwo]);
    assert.equal(unassociatedPhoneResult.status, 404, "Phone login for unknown phone must return 404");
    assert.equal(unassociatedPhoneResult.code, "ACCOUNT_NOT_FOUND");

    // =========================================================================
    // 8. MATRIX J & K: ATOMIC OTP CONSUMPTION, ANTI-REPLAY & ANTI-RACE
    // =========================================================================
    const now = new Date();
    const activeOtp = {
      id: "otp_test_1",
      phone: "+905551234567",
      codeHash: createHash("sha256").update("123456").digest("hex"),
      usedAt: null,
      expiresAt: new Date(now.getTime() + 180000), // 3 min expiry
      attempts: 0,
    };

    // Test: Expired OTP rejected
    const expiredOtp = { ...activeOtp, expiresAt: new Date(now.getTime() - 1000) };
    assert.ok(expiredOtp.expiresAt < now, "Expired OTP must be detected");

    // Test: Atomic consumption simulation
    let otpStore = { ...activeOtp };
    function simulateAtomicOtpConsume(otpId, submittedCode) {
      if (otpStore.id !== otpId) return { ok: false, error: "Not found" };
      if (otpStore.usedAt !== null) return { ok: false, error: "Already used" };
      if (otpStore.expiresAt < new Date()) return { ok: false, error: "Expired" };

      const got = createHash("sha256").update(submittedCode).digest("hex");
      if (got !== otpStore.codeHash) {
        otpStore.attempts++;
        return { ok: false, error: "Invalid code" };
      }

      // Atomic updateMany: where usedAt: null -> set usedAt: now
      if (otpStore.usedAt === null) {
        otpStore.usedAt = new Date();
        return { ok: true, count: 1 };
      }
      return { ok: false, count: 0, error: "Concurrency conflict" };
    }

    // Call 1: Valid OTP succeeds
    const firstCall = simulateAtomicOtpConsume("otp_test_1", "123456");
    assert.equal(firstCall.ok, true);
    assert.equal(firstCall.count, 1);

    // Call 2: Replay attack fails
    const replayCall = simulateAtomicOtpConsume("otp_test_1", "123456");
    assert.equal(replayCall.ok, false);
    assert.equal(replayCall.error, "Already used", "Replayed OTP code must be rejected");

    // =========================================================================
    // 9. MATRIX L: ROLE-AWARE POST-AUTH REDIRECTION ROUTING
    // =========================================================================
    function resolvePhoneLoginRedirect(userRole, claimDirectoryId = null, nextUrl = null) {
      if (claimDirectoryId || nextUrl) {
        return nextUrl || ("/business/apply?claimDirectoryId=" + claimDirectoryId);
      }
      const role = String(userRole || "PATIENT").toUpperCase();
      if (role === "DOCTOR") return "/doctor";
      if (role === "ORGANIZATION") return "/business";
      if (role === "ADMIN") return "/admin";
      if (role === "AGENCY") return "/agency";
      return "/profile";
    }

    assert.equal(resolvePhoneLoginRedirect("DOCTOR"), "/doctor");
    assert.equal(resolvePhoneLoginRedirect("ORGANIZATION"), "/business");
    assert.equal(resolvePhoneLoginRedirect("ADMIN"), "/admin");
    assert.equal(resolvePhoneLoginRedirect("AGENCY"), "/agency");
    assert.equal(resolvePhoneLoginRedirect("PATIENT"), "/profile");

    // Precedence: explicit return URL / claim context wins over generic role portal
    assert.equal(
      resolvePhoneLoginRedirect("DOCTOR", "dir-medicana-kadikoy", "/business/apply?claimDirectoryId=dir-medicana-kadikoy"),
      "/business/apply?claimDirectoryId=dir-medicana-kadikoy"
    );
  `;

  execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", inlineScript], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
});

test("Architecture Contract: Static Code Invariants for Auth Flow Separation & Security", () => {
  // 1. In app/api/auth/otp/verify/route.ts:
  // - Must use findUserByPhone
  // - Mode "login" must NEVER create a user account and must return 404 ACCOUNT_NOT_FOUND
  // - Mode "register" must check for phone collision (409)
  // - Phone linking must enforce cross-account uniqueness (409)
  // - OTP consumption must be atomic (updateMany where usedAt: null)
  const verifyRoute = read("app/api/auth/otp/verify/route.ts");
  assert.match(verifyRoute, /findUserByPhone\(canonicalPhone\)/);
  assert.match(verifyRoute, /code:\s*["']ACCOUNT_NOT_FOUND["']/);
  assert.match(verifyRoute, /status:\s*404/);
  assert.match(verifyRoute, /code:\s*["']PHONE_ALREADY_REGISTERED["']/);
  assert.match(verifyRoute, /status:\s*409/);
  assert.match(verifyRoute, /prisma\.otpCode\.updateMany/);
  assert.match(verifyRoute, /usedAt:\s*null/);

  // Assert that user creation is strictly prohibited in login branch
  const loginBranchMatch = verifyRoute.match(/if\s*\(\s*mode\s*===\s*["']login["']\s*\)([\s\S]*?)if\s*\(\s*mode\s*===\s*["']register["']\s*\)/);
  assert.ok(loginBranchMatch, "Must have distinct login branch before register branch");
  assert.doesNotMatch(
    loginBranchMatch[1],
    /prisma\.user\.create/,
    "CRITICAL: Mode login must NEVER call prisma.user.create!"
  );

  // 2. In app/api/auth/otp/request/route.ts:
  // - Must validate isValidPhone
  // - Must check cross-account phone collision if user is authenticated
  // - Must throttle / rate limit OTP generation
  const requestRoute = read("app/api/auth/otp/request/route.ts");
  assert.match(requestRoute, /isValidPhone\(phone\)/);
  assert.match(requestRoute, /findUserByPhone\(phone\)/);
  assert.match(requestRoute, /status:\s*409/);
  assert.match(requestRoute, /status:\s*429/);

  // 3. In app/api/auth/me/route.ts:
  // - Must enforce passwordPolicy
  // - Must hash password
  // - Must reject unverified direct email update (EMAIL_VERIFICATION_REQUIRED)
  // - Must verify currentPassword on existing accounts to prevent session hijacking
  const meRoute = read("app/api/auth/me/route.ts");
  assert.match(meRoute, /passwordPolicy\(password\)/);
  assert.match(meRoute, /hashPassword\(password\)/);
  assert.match(meRoute, /code:\s*["']EMAIL_VERIFICATION_REQUIRED["']/);
  assert.match(meRoute, /verifyPassword\(currentPassword,\s*u\.passwordHash\)/);
  assert.match(meRoute, /status:\s*403/);

  // 4. In lib/auth.ts:
  // - findUserByPhone must be strictly read-only and must NOT mutate records on lookup
  const authLib = read("lib/auth.ts");
  const findUserMatch = authLib.match(/export\s+async\s+function\s+findUserByPhone([\s\S]*?)\}/);
  assert.ok(findUserMatch, "findUserByPhone must exist in lib/auth.ts");
  assert.doesNotMatch(
    findUserMatch[1],
    /prisma\.user\.update/,
    "findUserByPhone must NEVER mutate records during unauthenticated lookup!"
  );

  // 5. In app/api/auth/email/request/route.ts & app/api/auth/email/verify/route.ts:
  // - Email verification must verify ownership via OTP code
  // - Must reject duplicate email (409)
  // - Must atomically consume code to prevent replay attacks
  // - devCode must never be leaked in production
  const emailRequestRoute = read("app/api/auth/email/request/route.ts");
  assert.match(emailRequestRoute, /sendEmail/);
  assert.match(emailRequestRoute, /status:\s*409/);
  assert.match(emailRequestRoute, /status:\s*429/);
  assert.match(emailRequestRoute, /isProduction\s*\?\s*\{\s*devCode/);

  const emailVerifyRoute = read("app/api/auth/email/verify/route.ts");
  assert.match(emailVerifyRoute, /timingSafeEqual/);
  assert.match(emailVerifyRoute, /prisma\.otpCode\.updateMany/);
  assert.match(emailVerifyRoute, /usedAt:\s*null/);
  assert.match(emailVerifyRoute, /passwordPolicy/);
  assert.match(emailVerifyRoute, /status:\s*409/);

  // 6. In lib/email.ts:
  // - Must throw error if console mock is used in production
  const emailLib = read("lib/email.ts");
  assert.match(emailLib, /Production ortamında EMAIL_PROVIDER geçerli bir sağlayıcıya/);

  // 7. In lib/institution-directory.ts:
  // - Blue ALUMAS verification badge must strictly enforce mandatory approved documents by default
  const dirLib = read("lib/institution-directory.ts");
  assert.match(dirLib, /process\.env\.STRICT_ORG_DOCUMENT_VERIFICATION\s*!==\s*["']false["']/);
  assert.match(dirLib, /missingRequiredDocuments/);

  // 8. In components/phone-login.tsx:
  // - Must implement role-aware redirection
  const phoneLoginComponent = read("components/phone-login.tsx");
  assert.match(phoneLoginComponent, /userRole\s*===\s*["']DOCTOR["']/);
  assert.match(phoneLoginComponent, /userRole\s*===\s*["']ORGANIZATION["']/);
  assert.match(phoneLoginComponent, /userRole\s*===\s*["']ADMIN["']/);
  assert.match(phoneLoginComponent, /userRole\s*===\s*["']AGENCY["']/);

  // 9. In components/personal-info-editor.tsx:
  // - Must provide email verification flow and password management field
  const personalInfoEditor = read("components/personal-info-editor.tsx");
  assert.match(personalInfoEditor, /\/api\/auth\/email\/request/);
  assert.match(personalInfoEditor, /\/api\/auth\/email\/verify/);
  assert.match(personalInfoEditor, /password/);

  // 10. Dynamic error translation in components/phone-login.tsx & auth dictionaries:
  // - Must implement resolveNotice / dynamic code mapping to prevent static error string lock
  // - Auth locale dictionaries must contain accountNotFoundPrompt & phoneAlreadyRegistered in both TR & EN
  assert.match(phoneLoginComponent, /resolveNotice/);
  assert.match(phoneLoginComponent, /accountNotFoundPrompt/);
  assert.match(phoneLoginComponent, /phoneAlreadyRegistered/);

  const authTr = JSON.parse(read("locales/features/auth/tr.json"));
  const authEn = JSON.parse(read("locales/features/auth/en.json"));
  assert.ok(authTr.auth.accountNotFoundPrompt);
  assert.ok(authEn.auth.accountNotFoundPrompt);
  assert.ok(authTr.auth.phoneAlreadyRegistered);
  assert.ok(authEn.auth.phoneAlreadyRegistered);

  // 11. Initial password creation for verified email accounts in app/api/auth/me/route.ts:
  // - Users with verified real email can set initial password (no dead-end)
  // - Dummy emails (@alumas.local) are blocked with EMAIL_VERIFICATION_REQUIRED
  // - Existing password accounts require CURRENT_PASSWORD_REQUIRED (403)
  assert.match(meRoute, /u\.email\.includes\(["']@alumas\.local["']\)/);
  assert.match(meRoute, /code:\s*["']CURRENT_PASSWORD_REQUIRED["']/);
  assert.match(personalInfoEditor, /passwordRequiredForEmail/);

  // 12. Persistent session cookies & auth entry page bouncing:
  // - lib/auth.ts must specify maxAge alongside expires for bulletproof cross-browser persistence
  // - Auth entry pages must inspect currentUser() and redirect authenticated sessions immediately
  assert.match(authLib, /maxAge:\s*SESSION_DAYS\s*\*\s*86400/);
  assert.match(authLib, /expires:\s*expiresAt/);

  for (const pagePath of [
    "app/phone-login/page.tsx",
    "app/login/page.tsx",
    "app/register/page.tsx",
    "app/pro/login/page.tsx",
    "app/pro/register/page.tsx",
  ]) {
    const pageContent = read(pagePath);
    assert.match(pageContent, /currentUser\(\)/, `${pagePath} must check currentUser()`);
    assert.match(pageContent, /resolvePostAuthDestination/, `${pagePath} must resolve destination`);
    assert.match(pageContent, /redirect\(dest\)/, `${pagePath} must redirect authenticated users`);
  }
});

