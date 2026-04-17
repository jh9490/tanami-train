# System Context Artifact: TanamiTrain React Native App

## 1. Project Structure
A standard and well-organized modern React Native structure inside the `src/` directory.

- `android/` & `ios/`: Native code directories for React Native.
- `src/`
  - `assets/`: Static resources such as images or localized assets.
  - `auth/`: OTP logic and Auth-related internal modules.
  - `context/`: Application state via React Context API (e.g., `AuthContext.tsx`).
  - `navigation/`: React Navigation setup and route definitions (`AppNavigator.tsx`).
  - `providers/`: Context providers that wrap the primary application layout.
  - `screens/`: Application views grouped by logical feature areas (e.g., Auth, Courses, User, Menu, Home, and `cv/` for the authenticated CV generator flow).
  - `services/`: External backend integrations plus device-side feature services such as the bilingual CV generation/export helpers in `cvService.ts`, `cvHtmlRenderer.ts`, and `cvTranslationService.ts`.
  - `storage/`: Local data persistence logic via AsyncStorage.
  - `theme/`: Shared styling configurations, specifically focused on RTL layout support (`rtl.ts`).
  - `types/`: Custom TypeScript models, API responses, and shared interfaces.
  - `util/`: Helper utilities (e.g., `deviceId.ts`).

## 2. Main Navigation Flow (React Navigation)
The app utilizes **React Navigation v7** with multiple nested stacks and bottom tabs to route the application flow efficiently:

- **RootStack** (Native Stack Navigator): The top-level container determining which substack to present.
- **MainTabs** (Bottom Tab Navigator): The primary user navigation, including components for `Home`, `Courses`, `Gallery`, `MenuRoot` (which routes to the `MenuStack`), and the authenticated-only `CVGenerator` tab for Arabic-first CV PDF creation with optional English output generation on supported devices.
  - **SubCourses**: Specific courses drill-down screens.
  - **AuthStack** (Native Stack Navigator): Guest flows covering SignIn, SignUp, OTP Verify, and Reset Password.
  - **AccountStack** (Native Stack Navigator): Authenticated management for Account specifics and Settings.
  - **UserStack** (Native Stack Navigator): Authenticated user modules such as My Notifications, My Courses, User Registration Requests, and Verification of Certificates.

## 3. State Management
- **Local/Global State**: Relies entirely on the native **React Context API**, specifically utilizing `AuthContext` as the global provider to track `user`, `profile`, and `isAuthenticated` states.
- **Third-Party Avoidance**: There are no external global state managers (like Redux, MobX, or Zustand) present in the package manifest.
- **Persistence**: Managed uniformly through `@react-native-async-storage/async-storage` for persisting user session tokens and caching requirements. 

## 4. Key API Services
The application wraps the native `fetch` API inside `src/services/api.ts` with custom debugging utilities, error interception, and authorization header management:

- **Base Endpoints**: Connects pointing mostly to `https://tanamitrain.com/tanamiAdmin` with specialized branching for `/api/mobile-app`, `/api/telegram`, and `/api/fcm`.
- **Key Client Modules**:
  - **Authentication**: Native login, OTP delivery through both SMS and uniquely **Telegram**, and profile editing paths.
  - **Courses**: Retrieval of public courses (`fetchCourses`), detailed view tracking (`fetchCourseById`), and handling user registrations for activities.
  - **Push Notifications (FCM)**: Registers FCM push tokens bridging Firebase to the backend and handles manual notification acknowledgments (`inboxAck`).
  - **CV Generation**: On-device Arabic-first CV rendering and PDF/export orchestration via `src/services/cvService.ts`, with bilingual HTML generation split into `src/services/cvHtmlRenderer.ts` and device-side English translation availability handled by `src/services/cvTranslationService.ts`.

## 5. Dependency Analysis
**Note:** A manual inspection of `package.json` suggests this is an extremely **modern** codebase, using up-to-date library bounds.

- **React / React Native**: Uses `React 19.1.0` and `React Native 0.80.0`, which are cutting-edge / bleeding-edge releases.
- **React Navigation**: Firmly on the `^7.x` stable branch.
- **Gorhom Bottom Sheet**: Utilizing stable `^5.x` versions integrated tightly with `react-native-reanimated ^3.19.0`.
- **Styled Components**: Set at a fairly stable recent branch (`^6.1.19`).

There are no highly outdated foundational packages identified. The structure indicates it was recently scaffolded or heavily maintained.

## 6. Native CV Translation

- **Android**: English CV generation uses a small native bridge in `android/app/src/main/java/com/tanamitrain/cv/` backed by ML Kit on-device translation. Local model preparation may occur on first use, but CV text is not sent to a TanamiTrain backend translation endpoint.
- **iOS**: The current increment exposes an explicit unsupported-path stub so the app can explain that English generation is unavailable on iOS without breaking the stable Arabic flow.
