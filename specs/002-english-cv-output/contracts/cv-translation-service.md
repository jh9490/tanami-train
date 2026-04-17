# Contract: CV Translation And Generation Service

## Purpose

Define the service boundary used by the CV screen to request Arabic or English PDF generation while keeping translation on the Android device for supported English output.

## Inputs

### `getEnglishTranslationAvailability()`

Returns the current Android device capability for Arabic-to-English translation in this feature increment.

**Result shape**:

```ts
type CVTranslationAvailability = {
  supported: boolean;
  message?: string;
  reason?: string;
};
```

### `generateCV(draft, userContext, options)`

Generates a PDF artifact for the requested output language.

**Input shape**:

```ts
type CVGenerationOptions = {
  outputLanguage?: 'ar' | 'en';
};
```

**Rules**:

- `outputLanguage` defaults to `ar`.
- `en` requires a successful device-side translation step before HTML rendering.
- A generation request never mutates the source draft.

## Outputs

### Success

```ts
type GeneratedCVArtifact = {
  fileName: string;
  filePath: string;
  mimeType: 'application/pdf';
  language: 'ar' | 'en';
  status: 'generated' | 'exported' | 'cancelled' | 'failed';
  lastError: CVOperationError | null;
};
```

### Failure

```ts
type CVOperationError = {
  code:
    | 'unauthenticated'
    | 'missing_full_name'
    | 'invalid_experience'
    | 'translation_unavailable'
    | 'translation_failed'
    | 'pdf_generation_failed'
    | 'pdf_file_missing'
    | 'artifact_missing'
    | 'export_failed'
    | 'export_cancelled';
  stage: 'validation' | 'translation' | 'generation' | 'export';
  message: string;
  retryable: boolean;
};
```

## Behavioral Guarantees

- Arabic generation remains available even when English translation is unavailable.
- English generation never sends CV text to a new backend endpoint.
- Unsupported Android-device handling produces a translation-specific error instead of reusing a generic PDF failure.
- Export behavior stays language-agnostic after a valid artifact is generated.
