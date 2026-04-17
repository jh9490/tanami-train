export interface CVExperience {
  id: string;
  title: string;
  organization: string;
  duration: string;
  description: string;
}

export interface CVEducation {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface CVSkill {
  id: string;
  value: string;
}

export interface CVDraft {
  fullName: string;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
}

export interface CVUserContext {
  isAuthenticated: boolean;
  userId?: number | null;
  displayName?: string | null;
}

export interface NormalizedCVDraft {
  fullName: string;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
}

export type CVOutputLanguage = 'ar' | 'en';
export type CVStage = 'validation' | 'translation' | 'generation' | 'export';
export type CVArtifactStatus = 'generated' | 'exported' | 'cancelled' | 'failed';
export type CVExportAction = 'share' | 'save';

export type CVErrorCode =
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

export interface CVOperationError {
  code: CVErrorCode;
  message: string;
  stage: CVStage;
  retryable: boolean;
}

export interface CVTranslationAvailability {
  supported: boolean;
  reason?: string;
  message?: string;
}

export interface GeneratedCVArtifact {
  fileName: string;
  filePath: string;
  mimeType: 'application/pdf';
  language: CVOutputLanguage;
  status: CVArtifactStatus;
  lastError: CVOperationError | null;
}

export interface CVGenerationOptions {
  outputLanguage?: CVOutputLanguage;
}

export type CVDraftPreparationResult =
  | { ok: true; draft: NormalizedCVDraft }
  | { ok: false; error: CVOperationError };

export type CVGenerationResult =
  | { ok: true; artifact: GeneratedCVArtifact }
  | { ok: false; error: CVOperationError };

export type CVExportResult =
  | {
      ok: true;
      artifact: GeneratedCVArtifact;
      status: 'exported' | 'cancelled';
      destination?: string;
    }
  | {
      ok: false;
      artifact: GeneratedCVArtifact;
      status: 'failed';
      error: CVOperationError;
    };
