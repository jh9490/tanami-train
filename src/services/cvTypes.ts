export type CVOutputLanguage = 'ar' | 'en';
export type CVStage = 'validation' | 'translation' | 'generation' | 'export';
export type CVArtifactStatus = 'generated' | 'exported' | 'cancelled' | 'failed';
export type CVExportAction = 'share' | 'save';
export type CVSyncState = 'not_synced' | 'auto_populated' | 'manually_edited' | 'failed' | 'preserved';
export type CVSyncOverwriteMode = 'auto' | 'preserve-target';

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

export interface CVCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  details: string;
}

export interface CVVolunteerExperience {
  id: string;
  role: string;
  organization: string;
  duration: string;
  description: string;
}

export interface CVContactSection {
  email: string;
  phone: string;
  address: string;
  linkedin?: string;
  title: string;
}

export interface CVDraft {
  fullName: string;
  contact: CVContactSection;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
  certifications: CVCertification[];
  volunteerExperiences: CVVolunteerExperience[];
}

export interface CVUserContext {
  isAuthenticated: boolean;
  userId?: number | null;
  profileId?: number | null;
  displayName?: string | null;
}

export interface NormalizedCVDraft {
  fullName: string;
  contact: CVContactSection;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
  certifications: CVCertification[];
  volunteerExperiences: CVVolunteerExperience[];
}

export interface CVLocalizedField {
  ar: string;
  en: string;
  lastEditedLanguage: CVOutputLanguage;
  syncState: CVSyncState;
  lastSyncSourceLanguage?: CVOutputLanguage;
  lastSyncAt?: string;
  failureReason?: string;
}

export interface CVBilingualExperience {
  id: string;
  title: CVLocalizedField;
  organization: CVLocalizedField;
  duration: CVLocalizedField;
  description: CVLocalizedField;
}

export interface CVBilingualEducation {
  id: string;
  degree: CVLocalizedField;
  institution: CVLocalizedField;
  year: CVLocalizedField;
}

export interface CVBilingualSkill {
  id: string;
  value: CVLocalizedField;
}

export interface CVBilingualCertification {
  id: string;
  name: CVLocalizedField;
  issuer: CVLocalizedField;
  date: CVLocalizedField;
  details: CVLocalizedField;
}

export interface CVBilingualVolunteerExperience {
  id: string;
  role: CVLocalizedField;
  organization: CVLocalizedField;
  duration: CVLocalizedField;
  description: CVLocalizedField;
}

export interface CVBilingualContactSection {
  email: CVLocalizedField;
  phone: CVLocalizedField;
  address: CVLocalizedField;
  linkedin: CVLocalizedField;
  title: CVLocalizedField;
}

export interface CVBilingualDraft {
  editingLanguage: CVOutputLanguage;
  fullName: CVLocalizedField;
  contact: CVBilingualContactSection;
  summary: CVLocalizedField;
  experiences: CVBilingualExperience[];
  education: CVBilingualEducation[];
  skills: CVBilingualSkill[];
  certifications: CVBilingualCertification[];
  volunteerExperiences: CVBilingualVolunteerExperience[];
}

export type CVErrorCode =
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

export interface CVDraftSyncInfo {
  sourceLanguage: CVOutputLanguage;
  targetLanguage: CVOutputLanguage;
  updatedFieldIds: string[];
  preservedFieldIds: string[];
  failedFieldIds: string[];
  message?: string;
}

export interface CVDraftSyncOptions {
  sourceLanguage: CVOutputLanguage;
  targetLanguage: CVOutputLanguage;
  overwriteMode?: CVSyncOverwriteMode;
}

export interface CVProfileDefaults {
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  email?: string | null;
  phone?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
}

export interface CVStoredDraftSnapshot {
  profileId?: number | null;
  userId?: number | null;
  savedAt: string;
  draft: CVBilingualDraft;
}

export type CVDraftPreparationResult =
  | { ok: true; draft: NormalizedCVDraft }
  | { ok: false; error: CVOperationError };

export type CVDraftSyncResult =
  | {
      ok: true;
      draft: CVBilingualDraft;
      sync: CVDraftSyncInfo;
    }
  | {
      ok: false;
      draft: CVBilingualDraft;
      error: CVOperationError;
      failedFieldIds: string[];
    };

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
