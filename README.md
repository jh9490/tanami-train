# TanamiTrain

TanamiTrain is a React Native mobile app for Tanami training services. The app is Arabic-first, RTL-oriented, and connects to the Tanami backend for authentication, courses, registrations, notifications, media, certificate verification, and CV generation.

Current Android release metadata:

- Application ID: `com.tanamitrain`
- Version name: `1.1.1`
- Version code: `24`

## Features

- Arabic RTL navigation and UI.
- Public home, course, gallery, location, and contact sections.
- Mobile authentication with sign up, sign in, OTP verification, password reset, and profile management.
- User course area with course details, activity files, live YouTube preview support, registrations, certificates, and notifications.
- Firebase Cloud Messaging registration and notification inbox acknowledgements.
- Certificate verification from scanned or entered certificate tokens.
- Photo/gallery viewing and user photo access.
- CV builder with Arabic/English draft support, translation helpers, PDF generation, and sharing.

## Tech Stack

- React Native `0.80.0`
- React `19.1.0`
- TypeScript `5.x`
- React Navigation `7`
- Firebase Messaging via `@react-native-firebase/app` and `@react-native-firebase/messaging`
- Android ML Kit translation through the native Android bridge
- `react-native-html-to-pdf` and `react-native-share` for CV export
- `@react-native-async-storage/async-storage` for local app state/session persistence

## Project Structure

```text
android/                 Android native project
ios/                     iOS native project
src/
  auth/                  OTP and auth helpers
  context/               Auth context and session state
  navigation/            Root, tab, auth, account, and user stacks
  screens/               App screens and screen components
  services/              API, notifications, CV rendering/export
  storage/               AsyncStorage helpers
  theme/                 RTL styling helpers
  types/                 Shared API and native module types
  util/                  Device, phone, linking, and media helpers
__tests__/               Jest tests
specs/                   Feature specifications and planning artifacts
```

## Prerequisites

- Node.js `>=18`
- npm or Yarn
- React Native development environment for Android and/or iOS
- Android Studio and a configured emulator/device for Android
- Xcode and CocoaPods for iOS on macOS

Follow the official React Native environment setup for the target platform before running the app.

## Local Configuration

Some native configuration files are intentionally not tracked in git because they contain local or sensitive values.

Required local Android files:

- `android/gradle.properties`
- `android/app/google-services.json`

Use `android/gradle.properties.example` as the template for local signing properties:

```properties
MYAPP_UPLOAD_STORE_FILE=your-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=your-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=change-me
MYAPP_UPLOAD_KEY_PASSWORD=change-me
```

Do not commit real signing passwords, keystores, Firebase config files, or other credentials.

## Install

```sh
npm install
```

For iOS:

```sh
bundle install
bundle exec pod install --project-directory=ios
```

## Run

Start Metro:

```sh
npm start
```

Run Android:

```sh
npm run android
```

Run iOS:

```sh
npm run ios
```

## Test and Lint

```sh
npm test
npm run lint
```

## Android Release Notes

Release signing is configured in `android/app/build.gradle` and reads values from local Gradle properties. Keep release credentials only on trusted developer or CI machines.

The release build currently enables code minification:

```gradle
minifyEnabled true
shrinkResources false
```

Before producing a release, verify:

- `android/gradle.properties` contains valid local signing values.
- `android/app/google-services.json` matches the Firebase project for this app.
- The Android version code and version name are updated as needed.
- PDF export, notifications, certificate verification, and authenticated course flows work on a real device or emulator.

## Backend

The app uses the Tanami backend under:

```text
https://tanamitrain.com/tanamiAdmin
```

Main mobile endpoints are accessed through:

```text
/api/mobile-app
```

Firebase notification endpoints are accessed through:

```text
/api/fcm
```

## Security

This repository should not contain local secrets. If a secret is committed or pushed by mistake:

1. Rotate the exposed credential immediately.
2. Remove the file from git tracking.
3. Rewrite repository history if the secret reached a shared or public remote.
4. Force-push the cleaned history only after coordinating with other collaborators.

## Privacy

See `PRIVACY_POLICY.md` for the app privacy policy.
