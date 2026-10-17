# ALUMAS — UI Route i18n Coverage Manifest

Generated at: 2026-10-16T19:05:09.550Z

## Summary Metrics
- **Total UI Routes:** 83
- **Verified Fully Localized:** 82
- **Partially Localized:** 0
- **Not Localized:** 0
- **Intentionally Excluded:** 1

| Route | Source File | Auth Role | Dynamic? | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/about` | `app/about/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/admin/agencies` | `app/admin/agencies/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/admin/content` | `app/admin/content/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/admin/doctors` | `app/admin/doctors/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/admin/organizations` | `app/admin/organizations/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/admin` | `app/admin/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/admin/release` | `app/admin/release/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/admin/reviews` | `app/admin/reviews/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/agencies/[id]` | `app/agencies/[id]/page.tsx` | PUBLIC | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/agency/apply` | `app/agency/apply/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/agency` | `app/agency/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/agency/[id]` | `app/agency/[id]/page.tsx` | AUTHENTICATED_PATIENT | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/ai` | `app/ai/page.tsx` | PUBLIC_WITH_AUTH_FEATURE_GATE | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/ai-policy` | `app/ai-policy/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/appointments` | `app/appointments/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/business/apply` | `app/business/apply/page.tsx` | AUTHENTICATED_PATIENT | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/business` | `app/business/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/business/[id]` | `app/business/[id]/page.tsx` | AUTHENTICATED_PATIENT | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/calendar` | `app/calendar/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/campaigns` | `app/campaigns/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/care-calendar` | `app/care-calendar/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/contact` | `app/contact/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/cookies` | `app/cookies/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/cross-border` | `app/cross-border/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/doctor` | `app/doctor/page.tsx` | AUTHENTICATED_PRO | No | **VERIFIED_FULLY_LOCALIZED** |
| `/doctor/patients/[id]` | `app/doctor/patients/[id]/page.tsx` | AUTHENTICATED_PATIENT | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/doctors` | `app/doctors/page.tsx` | DOCTOR_ONLY | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/doctors/[id]` | `app/doctors/[id]/page.tsx` | DOCTOR_ONLY | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/emergency` | `app/emergency/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/allergies` | `app/health/allergies/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/blood-pressure` | `app/health/blood-pressure/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/body` | `app/health/body/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/cycle` | `app/health/cycle/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/family` | `app/health/family/page.tsx` | PUBLIC | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/health/family/[id]/calendar` | `app/health/family/[id]/calendar/page.tsx` | PUBLIC | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/health/family/[id]` | `app/health/family/[id]/page.tsx` | PUBLIC | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/health/family-access` | `app/health/family-access/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/family-hub` | `app/health/family-hub/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/family-profiles` | `app/health/family-profiles/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/glucose` | `app/health/glucose/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/goals` | `app/health/goals/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/imaging` | `app/health/imaging/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/labs` | `app/health/labs/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/medical-history` | `app/health/medical-history/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/medications` | `app/health/medications/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health` | `app/health/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/reports` | `app/health/reports/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/sleep` | `app/health/sleep/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/summary` | `app/health/summary/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/tasks` | `app/health/tasks/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/timeline` | `app/health/timeline/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/vaccinations` | `app/health/vaccinations/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health/water` | `app/health/water/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health-card` | `app/health-card/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health-card/[token]` | `app/health-card/[token]/page.tsx` | PUBLIC | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/health-circle` | `app/health-circle/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health-data` | `app/health-data/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health-tourism` | `app/health-tourism/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/health-tourism-legal` | `app/health-tourism-legal/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/home-care` | `app/home-care/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/insurance` | `app/insurance/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/login` | `app/login/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/maintenance` | `app/maintenance/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/messages` | `app/messages/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/nearby` | `app/nearby/page.tsx` | PUBLIC_WITH_AUTH_FEATURE_GATE | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/notifications` | `app/notifications/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/onboarding/doctor` | `app/onboarding/doctor/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/organizations` | `app/organizations/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/organizations/[slug]` | `app/organizations/[slug]/page.tsx` | PUBLIC | Yes | **VERIFIED_FULLY_LOCALIZED** |
| `/` | `app/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/partner/apply` | `app/partner/apply/page.tsx` | PUBLIC | No | **INTENTIONALLY_EXCLUDED** |
| `/phone-directory` | `app/phone-directory/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/phone-login` | `app/phone-login/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/privacy` | `app/privacy/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/pro/login` | `app/pro/login/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/pro/register` | `app/pro/register/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/profile` | `app/profile/page.tsx` | AUTHENTICATED_PATIENT | No | **VERIFIED_FULLY_LOCALIZED** |
| `/provider-terms` | `app/provider-terms/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/register` | `app/register/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/retention` | `app/retention/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/services` | `app/services/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/terms` | `app/terms/page.tsx` | PUBLIC | No | **VERIFIED_FULLY_LOCALIZED** |
| `/video/[id]` | `app/video/[id]/page.tsx` | PUBLIC | Yes | **VERIFIED_FULLY_LOCALIZED** |
