# TanamiTrain Constitution

## Core Principles

### I. Spec Before Implementation
Every non-trivial product change MUST begin with a feature spec in `specs/` and use the spec-kit flow in this order: specify, clarify if needed, plan, tasks, then implement. Code changes without a current feature directory, a reviewed spec, and an implementation plan are exceptions that must be called out explicitly as emergency fixes.

### II. Existing Architecture First
Changes MUST integrate with the current React Native app structure instead of introducing a parallel architecture. New work should prefer the established layers in `src/navigation/`, `src/context/`, `src/screens/`, `src/services/`, and `src/types/`, and should reuse existing authentication, navigation, and storage patterns unless the plan justifies a deviation.

### III. Authenticated, Arabic-First UX
User-specific functionality MUST respect the authenticated session model already provided by `src/context/AuthContext.tsx`. Features that target Arabic-speaking users MUST preserve RTL behavior, bundled Arabic typography, and content structures that remain machine-readable when the requirement includes ATS compatibility or exportable documents.

### IV. Native Reliability Is a Product Requirement
Any feature that touches native modules, file generation, downloads, sharing, or device permissions MUST define failure modes and validation steps for real device or emulator execution. "Works in TypeScript" is insufficient when the user value depends on Android or iOS runtime behavior.

### V. Small, Reversible Increments
Plans and tasks MUST produce increments that can be implemented and validated independently. Work should avoid broad refactors in the same change set as feature delivery, preserve user edits in a dirty worktree, and favor narrow, reviewable changes over speculative cleanup.

## Project Constraints

- The active application is a React Native mobile app using React 19, React Native 0.80, TypeScript, and React Navigation 7.
- `system_context.md` is the baseline architecture artifact and should be updated when a plan materially changes the documented structure.
- Existing third-party libraries should be preferred before adding new dependencies, especially for authentication, PDF generation, sharing, storage, and navigation.
- Feature specs must be written so that non-technical stakeholders can review the intent, while plans and tasks must anchor decisions to the real repository structure.

## Workflow And Quality Gates

- The current feature path MUST be recorded in `.specify/feature.json`.
- Each feature MUST maintain `spec.md`, `plan.md`, `tasks.md`, and any supporting artifacts required by the plan.
- Plans for native-facing work MUST include manual validation steps for Android and, when relevant, iOS.
- If a requirement is ambiguous, clarify it in the spec before implementation rather than encoding assumptions in code.
- After plan updates, refresh the Codex context file so the agent instructions reflect the active technology and feature set.

## Governance

This constitution supersedes ad hoc workflow decisions for this repository. Amendments require a documented rationale in a spec or planning artifact, an updated constitution file, and a recorded version change. Reviews should reject work that bypasses the spec-driven flow without a stated exception.

**Version**: 1.0.0 | **Ratified**: 2026-04-16 | **Last Amended**: 2026-04-16
