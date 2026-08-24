# Alumas native integration — v5

Alumas now uses Capacitor 8 directly rather than a custom `window.AlumasHealth` bridge.

- Health: `@capgo/capacitor-health` → Apple HealthKit on iOS, Health Connect on Android.
- Push: `@capacitor/push-notifications` → APNs device token on iOS / FCM token flow on Android.
- Native runtime: `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`.
- Assets: `@capacitor/assets` using `resources/icon.svg` and `resources/splash.svg`.

The application requests only the health scopes selected by the user: steps, heart rate, weight and sleep. See `MOBILE_RELEASE.md` for platform capabilities, manifest/privacy configuration and store release steps.
