# OmNomNom for iOS

A native SwiftUI app (iOS 26, Liquid Glass) for the OmNomNom nutrition tracker.
It talks to the existing Cloudflare Worker API and reuses all current endpoints.

## Requirements

- Xcode 26+ (iOS 26 SDK)
- [XcodeGen](https://github.com/yonyz/XcodeGen) (`brew install xcodegen`) — the
  `.xcodeproj` is generated from `project.yml` and is git-ignored.

## Generate & open

```sh
cd apps/ios
xcodegen generate
open OmNomNom.xcodeproj
```

## Run in the Simulator (no signing needed)

```sh
xcodebuild -project OmNomNom.xcodeproj -scheme OmNomNom \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath build \
  CODE_SIGN_IDENTITY="-" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=YES build
```

> Simulator builds are **ad-hoc signed** (`CODE_SIGN_IDENTITY="-"`), not unsigned —
> the Keychain (refresh-token persistence) needs the app's entitlements, which
> require a signature.

## Project layout

- `OmNomNom/App` — entry point, root tab view, session/auth state
- `OmNomNom/DesignSystem` — theme tokens, Liquid Glass components, mascot, charts bits
- `OmNomNom/Models` — domain types + request/response shapes (ported from `packages/shared`)
- `OmNomNom/Networking` — API client (Bearer access token + Keychain refresh, 401→refresh→retry)
- `OmNomNom/Nutrition` — on-device BMR/TDEE/macro math (ported from `calculate.ts`)
- `OmNomNom/Features` — Auth, Dashboard, Foods, PhotoLog, Trends, Settings, Notifications
- `OmNomNomWidgets` — WidgetKit extension (small/medium "Today" widget)

## Configuration

- **API base URL**: `APIClient.baseURL` and `AppGroup.apiBase`
  (`https://omnomnom-api.wasim-811.workers.dev`).
- **Bundle IDs**: app `com.pocketlibraries.omnomnom`, widget
  `com.pocketlibraries.omnomnom.widgets`.
- **Entitlements**: App Group `group.com.pocketlibraries.omnomnom` (shared with the
  widget) and a Keychain access group. The Keychain group uses
  `$(AppIdentifierPrefix)`, so it resolves to your team prefix automatically once
  you sign with your Apple Developer team.

## Submitting to the App Store

1. In `project.yml`, set `DEVELOPMENT_TEAM` to your Apple Developer Team ID (or set
   it in Xcode ▸ target ▸ Signing & Capabilities ▸ Team), then `xcodegen generate`.
2. Register the two bundle IDs and the App Group on the developer portal (Xcode's
   automatic signing can do this).
3. Add a real App Icon if you want to replace the generated one
   (`OmNomNom/Assets.xcassets/AppIcon.appiconset`).
4. Select a real device / "Any iOS Device", then **Product ▸ Archive**.
5. In the Organizer, **Distribute App ▸ App Store Connect**.

## Notes / backend

- Auth reuses the web's refresh-cookie contract: the app sends the stored refresh
  token as the `omnomnom_refresh_token` cookie to `POST /api/auth/refresh`.
- Reminders are scheduled as **on-device local notifications** (the web backend's
  OneSignal/cron path isn't used by the native app).
- The home-screen widget authenticates with a **widget token** minted in
  Settings ▸ "Create widget token" (stored in the App Group, no copy-paste).
