# TanamiTrain Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-17

## Active Technologies
- TypeScript 5.x, React 19.1, React Native 0.80
- React Navigation 7
- `@react-native-async-storage/async-storage`
- `react-native-html-to-pdf`
- `react-native-share`
- `react-native-vector-icons`
- Kotlin 2.1
- Android ML Kit on-device translation
- TypeScript 5.x, React 19.1, React Native 0.80, Kotlin 2.1 + React Navigation 7, `@react-native-async-storage/async-storage`, `react-native-html-to-pdf`, `react-native-share`, `react-native-vector-icons`, Android ML Kit translation via the existing `CVTranslationModule` bridge (003-bilingual-cv-editing-sync)
- In-memory React state for the active bilingual draft, existing transient PDF files in device storage, no new backend translation storage in this incremen (003-bilingual-cv-editing-sync)

## Project Structure

```text
android/
ios/
src/
  auth/
  context/
  navigation/
  providers/
  screens/
  services/
  storage/
  theme/
  types/
  util/
specs/
__tests__/
```

## Commands

- `npm test`
- `npm run android`
- `npm run ios`
- `.specify/scripts/bash/update-agent-context.sh codex`

## Code Style

- Preserve the existing React Native app structure instead of introducing new architectural layers.
- Keep authenticated flows aligned with `src/context/AuthContext.tsx` and `src/navigation/AppNavigator.tsx`.
- Treat Arabic and RTL correctness as functional requirements for user-facing copy and document output.
- Validate native file-generation behavior on device or emulator before considering a PDF/export feature complete.

## Low-Token Workflow

- Start a new chat for each major phase: spec, plan, implementation, or bugfix.
- Reference repository files by path instead of pasting long requirements into chat.
- Scope each request narrowly, for example one task group or one bug at a time.
- Prefer the active feature files in `specs/` plus the exact source files being changed.
- Avoid asking for whole-repo analysis unless it is genuinely required.
- Keep `system_context.md` and this file concise and update them only when the working context changes materially.

## Recent Changes
- 003-bilingual-cv-editing-sync: Added TypeScript 5.x, React 19.1, React Native 0.80, Kotlin 2.1 + React Navigation 7, `@react-native-async-storage/async-storage`, `react-native-html-to-pdf`, `react-native-share`, `react-native-vector-icons`, Android ML Kit translation via the existing `CVTranslationModule` bridge
- `002-english-cv-output`: Added a spec-driven feature package for English CV output from the Arabic draft, with Arabic as the default selection and on-device translation support on supported devices.
- `001-arabic-cv-export`: Added a full spec-driven feature package for authenticated Arabic ATS CV generation, PDF export reliability, and failure recovery.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
