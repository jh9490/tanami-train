import { generatePDF } from 'react-native-html-to-pdf';
import * as RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { renderCVHtml } from './cvHtmlRenderer';
import { translateDraftToEnglish } from './cvTranslationService';
import type {
  CVDraft,
  CVDraftPreparationResult,
  CVEducation,
  CVExportAction,
  CVGenerationOptions,
  CVExportResult,
  CVExperience,
  CVGenerationResult,
  CVOperationError,
  CVOutputLanguage,
  CVSkill,
  CVTranslationAvailability,
  CVUserContext,
  GeneratedCVArtifact,
  NormalizedCVDraft,
} from './cvTypes';

export type {
  CVDraft,
  CVEducation,
  CVExportAction,
  CVExportResult,
  CVGenerationOptions,
  CVExperience,
  CVGenerationResult,
  CVOperationError,
  CVOutputLanguage,
  CVSkill,
  CVTranslationAvailability,
  CVUserContext,
  GeneratedCVArtifact,
  NormalizedCVDraft,
} from './cvTypes';

export { getEnglishTranslationAvailability } from './cvTranslationService';

const PDF_MIME_TYPE = 'application/pdf' as const;
const DEFAULT_FILE_NAME = 'cv-arabic';
const DEFAULT_ENGLISH_FILE_NAME = 'cv-english';
const PDF_FILE_EXTENSION = '.pdf';

function trimText(value: string): string {
  return value.trim();
}

function hasText(value: string): boolean {
  return trimText(value).length > 0;
}

function buildError(
  code: CVOperationError['code'],
  message: string,
  stage: CVOperationError['stage'],
  retryable: boolean,
): CVOperationError {
  return { code, message, stage, retryable };
}

function buildArtifact(
  fileName: string,
  filePath: string,
  language: CVOutputLanguage,
  status: GeneratedCVArtifact['status'],
  lastError: CVOperationError | null,
): GeneratedCVArtifact {
  return {
    fileName,
    filePath,
    mimeType: PDF_MIME_TYPE,
    language,
    status,
    lastError,
  };
}

function stripFileScheme(filePath: string): string {
  return filePath.replace(/^file:\/\//, '');
}

function withFileScheme(filePath: string): string {
  return filePath.startsWith('file://') ? filePath : `file://${filePath}`;
}

async function getShareableFilePath(filePath: string, fileName: string): Promise<string> {
  const normalizedSourcePath = stripFileScheme(trimText(filePath));
  const cacheDirectory = trimText(RNFS.CachesDirectoryPath || RNFS.TemporaryDirectoryPath || '');

  if (!normalizedSourcePath || !cacheDirectory) {
    throw new Error('Missing source or cache path for CV export.');
  }

  const sourceExists = await RNFS.exists(normalizedSourcePath);
  if (!sourceExists) {
    throw new Error('Generated CV file is missing before export.');
  }

  const shareablePath = `${cacheDirectory}/${fileName}${PDF_FILE_EXTENSION}`;

  if (shareablePath === normalizedSourcePath) {
    return shareablePath;
  }

  const existingShareableFile = await RNFS.exists(shareablePath);
  if (existingShareableFile) {
    await RNFS.unlink(shareablePath);
  }

  await RNFS.copyFile(normalizedSourcePath, shareablePath);

  return shareablePath;
}

function normalizeExperience(experience: CVExperience): CVExperience {
  return {
    id: experience.id,
    title: trimText(experience.title),
    organization: trimText(experience.organization),
    duration: trimText(experience.duration),
    description: trimText(experience.description),
  };
}

function normalizeEducation(education: CVEducation): CVEducation {
  return {
    id: education.id,
    degree: trimText(education.degree),
    institution: trimText(education.institution),
    year: trimText(education.year),
  };
}

function normalizeSkill(skill: CVSkill): CVSkill {
  return {
    id: skill.id,
    value: trimText(skill.value),
  };
}

function isEmptyExperience(experience: CVExperience): boolean {
  return !hasText(experience.title) && !hasText(experience.organization) && !hasText(experience.duration) && !hasText(experience.description);
}

function hasExperienceIdentity(experience: CVExperience): boolean {
  return hasText(experience.title) || hasText(experience.organization) || hasText(experience.duration);
}

function isEmptyEducation(education: CVEducation): boolean {
  return !hasText(education.degree) && !hasText(education.institution) && !hasText(education.year);
}

function isEmptySkill(skill: CVSkill): boolean {
  return !hasText(skill.value);
}

function isShareCancelled(error: unknown): boolean {
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '';

  return (
    message.includes('User did not share') ||
    message.includes('User did not save') ||
    message.includes('User cancelled') ||
    message.includes('did not complete sharing')
  );
}

export function sanitizeCvFileName(fullName: string): string {
  const cleanedName = trimText(fullName)
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/[^\u0600-\u06FFA-Za-z0-9 _-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');

  return cleanedName ? `cv-${cleanedName}` : DEFAULT_FILE_NAME;
}

function buildCvFileName(fullName: string, outputLanguage: CVOutputLanguage): string {
  const sanitizedName = sanitizeCvFileName(fullName);

  if (outputLanguage === 'en') {
    return sanitizedName === DEFAULT_FILE_NAME ? DEFAULT_ENGLISH_FILE_NAME : `cv-en-${sanitizedName.replace(/^cv-/, '')}`;
  }

  return sanitizedName;
}

export function prepareCVDraft(draft: CVDraft, userContext?: CVUserContext): CVDraftPreparationResult {
  if (userContext && !userContext.isAuthenticated) {
    return {
      ok: false,
      error: buildError('unauthenticated', 'سجّل الدخول أولاً لاستخدام مولد السيرة الذاتية.', 'validation', false),
    };
  }

  const fullName = trimText(draft.fullName);
  if (!fullName) {
    return {
      ok: false,
      error: buildError('missing_full_name', 'يرجى إدخال الاسم الكامل قبل إنشاء السيرة الذاتية.', 'validation', true),
    };
  }

  const experiences = draft.experiences.map(normalizeExperience).filter(experience => !isEmptyExperience(experience));
  const invalidExperience = experiences.find(experience => !hasExperienceIdentity(experience));
  if (invalidExperience) {
    return {
      ok: false,
      error: buildError(
        'invalid_experience',
        'كل خبرة تحتوي على وصف يجب أن تتضمن المسمى الوظيفي أو جهة العمل أو المدة على الأقل.',
        'validation',
        true,
      ),
    };
  }

  const normalizedDraft: NormalizedCVDraft = {
    fullName,
    summary: trimText(draft.summary),
    experiences,
    education: draft.education.map(normalizeEducation).filter(education => !isEmptyEducation(education)),
    skills: draft.skills.map(normalizeSkill).filter(skill => !isEmptySkill(skill)),
  };

  return {
    ok: true,
    draft: normalizedDraft,
  };
}

export async function generateCV(
  draft: CVDraft,
  userContext?: CVUserContext,
  options?: CVGenerationOptions,
): Promise<CVGenerationResult> {
  const preparedDraft = prepareCVDraft(draft, userContext);
  if (!preparedDraft.ok) {
    return preparedDraft;
  }

  const outputLanguage = options?.outputLanguage ?? 'ar';
  const renderableDraft =
    outputLanguage === 'en' ? await translateDraftToEnglish(preparedDraft.draft) : { ok: true as const, draft: preparedDraft.draft };

  if (!renderableDraft.ok) {
    return renderableDraft;
  }

  const fileName = buildCvFileName(renderableDraft.draft.fullName, outputLanguage);

  try {
    const file = await generatePDF({
      html: renderCVHtml(renderableDraft.draft, outputLanguage),
      fileName,
      directory: 'Documents',
    });

    const filePath = trimText(file.filePath ?? '');
    if (!filePath) {
      return {
        ok: false,
        error: buildError('pdf_file_missing', 'تم إنشاء المستند ولكن تعذر الوصول إلى مسار الملف. حاول مرة أخرى.', 'generation', true),
      };
    }

    return {
      ok: true,
      artifact: buildArtifact(fileName, filePath, outputLanguage, 'generated', null),
    };
  } catch (error) {
    console.error('CV PDF generation failed:', error);

    return {
      ok: false,
      error: buildError(
        'pdf_generation_failed',
        'تعذر إنشاء ملف PDF على هذا الجهاز حالياً. حاول مرة أخرى بعد قليل.',
        'generation',
        true,
      ),
    };
  }
}

export async function exportGeneratedCV(
  artifact: GeneratedCVArtifact,
  action: CVExportAction,
): Promise<CVExportResult> {
  const filePath = trimText(artifact.filePath);
  if (!filePath) {
    const error = buildError('artifact_missing', 'لا يوجد ملف صالح للمشاركة حالياً. أنشئ السيرة الذاتية مرة أخرى.', 'export', true);

    return {
      ok: false,
      status: 'failed',
      artifact: buildArtifact(artifact.fileName, filePath, artifact.language, 'failed', error),
      error,
    };
  }

  try {
    const shareableFilePath = await getShareableFilePath(filePath, artifact.fileName);
    const documentLabel = artifact.language === 'en' ? 'السيرة الذاتية الإنجليزية' : 'السيرة الذاتية';

    await Share.open({
      title: action === 'save' ? `حفظ ${documentLabel}` : `مشاركة ${documentLabel}`,
      url: withFileScheme(shareableFilePath),
      type: artifact.mimeType,
      filename: `${artifact.fileName}${PDF_FILE_EXTENSION}`,
      saveToFiles: action === 'save',
    });

    return {
      ok: true,
      status: 'exported',
      artifact: buildArtifact(artifact.fileName, filePath, artifact.language, 'exported', null),
    };
  } catch (error) {
    if (isShareCancelled(error)) {
      return {
        ok: true,
        status: 'cancelled',
        artifact: buildArtifact(artifact.fileName, filePath, artifact.language, 'cancelled', null),
      };
    }

    console.error('CV export failed:', error);

    const exportError = buildError(
      'export_failed',
      'تعذر فتح خيارات الحفظ أو المشاركة. جرّب مرة أخرى أو اختر تطبيقاً آخر.',
      'export',
      true,
    );

    return {
      ok: false,
      status: 'failed',
      artifact: buildArtifact(artifact.fileName, filePath, artifact.language, 'failed', exportError),
      error: exportError,
    };
  }
}
