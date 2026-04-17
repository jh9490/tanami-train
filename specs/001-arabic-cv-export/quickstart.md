# Quickstart: Authenticated Arabic CV PDF Export

## Goal

Implement and validate a reliable Arabic CV PDF export flow for authenticated users without rewriting the app structure.

## Working Inputs

- Product context: [system_context.md](../../system_context.md)
- Constitution: [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- Feature spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Tasks: [tasks.md](./tasks.md)

## Suggested Execution Flow

1. Review `spec.md` and confirm the scope remains limited to authenticated Arabic CV generation and export reliability.
2. Implement tasks in priority order, starting with generation stability before export polish.
3. Keep source edits localized to:
   - `src/screens/cv/`
   - `src/services/`
   - `src/navigation/`
   - native files only if required by runtime validation
4. Refresh `AGENTS.md` after material plan changes with:

```sh
.specify/scripts/bash/update-agent-context.sh codex
```

## Local Validation Commands

```sh
npm test
npm run android
```

For iOS environments with pods installed:

```sh
npm run ios
```

## Manual QA Checklist

1. Sign in with a valid authenticated account.
2. Open the `CVGenerator` tab and verify the route is not visible to guests.
3. Enter a minimal valid Arabic CV and generate the PDF.
4. Confirm the generated PDF contains selectable Arabic text.
5. Complete at least one export path successfully.
6. Simulate or trigger a generation failure and confirm the form data remains available for retry.
7. Simulate or trigger an export failure and confirm the error is specific and recoverable.
