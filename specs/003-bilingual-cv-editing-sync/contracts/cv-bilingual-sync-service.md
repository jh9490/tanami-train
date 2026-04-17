# Contract: CV Bilingual Sync Service

## Purpose

Define the service boundary used by the CV screen to switch editor languages, auto-populate target-language fields on-device, preserve user edits, and keep the existing PDF generation flow compatible with the bilingual draft.

## Inputs

### `getTranslationAvailability(sourceLanguage, targetLanguage)`

Returns whether the current device can perform automatic on-device sync for the requested language pair.

**Input shape**:

```ts
type CVOutputLanguage = 'ar' | 'en';
```

**Result shape**:

```ts
type CVTranslationAvailability = {
  supported: boolean;
  reason?: string;
  message?: string;
};
```

### `syncDraftForLanguage(draft, options)`

Prepares the draft for a language switch by translating eligible fields from the latest source-language values into the requested target language and returning updated sync metadata.

**Input shape**:

```ts
type SyncDraftOptions = {
  sourceLanguage: 'ar' | 'en';
  targetLanguage: 'ar' | 'en';
  overwriteMode?: 'auto' | 'preserve-target';
};
```

**Rules**:

- `sourceLanguage` and `targetLanguage` must differ.
- `overwriteMode` defaults to `auto`, which follows per-field sync metadata and last-edited-language rules.
- The request must support repeatable sections including experience, education, skills, certifications and courses, and volunteer experience.
- The sync request updates field values and sync metadata, but does not generate a PDF by itself.

### `generateCV(draft, userContext, options)`

Generates a PDF artifact from the current bilingual draft using the selected output language.

**Rules**:

- The selected output language uses that language’s latest saved field values.
- PDF generation must remain available even when a previous language-sync attempt produced partial field failures, as long as the active-language draft is valid.

## Outputs

### Successful draft sync

```ts
type DraftSyncResult = {
  ok: true;
  draft: BilingualCVDraft;
  sync: {
    sourceLanguage: 'ar' | 'en';
    targetLanguage: 'ar' | 'en';
    updatedFieldIds: string[];
    preservedFieldIds: string[];
    failedFieldIds: string[];
    message?: string;
  };
};
```

### Failed draft sync

```ts
type DraftSyncError = {
  ok: false;
  error: CVOperationError;
  failedFieldIds?: string[];
};
```

### Generation success

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

## Failure Contract

```ts
type CVOperationError = {
  code:
    | 'unauthenticated'
    | 'missing_full_name'
    | 'invalid_experience'
    | 'translation_unavailable'
    | 'translation_failed'
    | 'field_sync_failed'
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

- Language switching never clears already saved draft content.
- Auto-populated fields remain editable after sync.
- The service preserves explicit user-kept target wording according to sync metadata instead of blindly overwriting it.
- A partial sync failure reports affected fields while keeping unaffected fields usable.
- PDF generation and export remain language-aware but otherwise reuse the existing service pipeline.
