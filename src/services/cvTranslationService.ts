import { NativeModules, Platform } from 'react-native';

import type {
  CVEducation,
  CVExperience,
  CVOperationError,
  CVSkill,
  CVTranslationAvailability,
  NormalizedCVDraft,
} from './cvTypes';

type NativeTranslationAvailability = {
  supported?: boolean;
  reason?: string;
  message?: string;
};

type NativeTranslationModule = {
  getAvailability(sourceLanguage: string, targetLanguage: string): Promise<NativeTranslationAvailability>;
  translateBatch(texts: string[], sourceLanguage: string, targetLanguage: string): Promise<string[]>;
};

type CVTranslationResult =
  | { ok: true; draft: NormalizedCVDraft }
  | { ok: false; error: CVOperationError };

const SOURCE_LANGUAGE = 'ar';
const TARGET_LANGUAGE = 'en';

function buildError(
  code: CVOperationError['code'],
  message: string,
  stage: CVOperationError['stage'],
  retryable: boolean,
): CVOperationError {
  return { code, message, stage, retryable };
}

function getNativeTranslationModule(): NativeTranslationModule | null {
  const translationModule = NativeModules.CVTranslationModule as NativeTranslationModule | undefined;

  if (!translationModule || typeof translationModule.getAvailability !== 'function' || typeof translationModule.translateBatch !== 'function') {
    return null;
  }

  return translationModule;
}

function buildUnsupportedMessage(reason?: string): string {
  if (reason === 'platform_unsupported') {
    return 'الترجمة إلى الإنجليزية متاحة حالياً على أجهزة Android المدعومة فقط. يمكنك إنشاء النسخة العربية الآن.';
  }

  if (reason === 'language_unsupported') {
    return 'هذا الجهاز لا يدعم ترجمة السيرة الذاتية من العربية إلى الإنجليزية ضمن المسار المحلي الحالي.';
  }

  return 'تعذر العثور على خدمة الترجمة المحلية حالياً. يمكنك متابعة إنشاء النسخة العربية بدون فقدان البيانات.';
}

function collectDraftTexts(draft: NormalizedCVDraft): string[] {
  return [
    draft.summary,
    ...draft.experiences.flatMap(experience => [
      experience.title,
      experience.organization,
      experience.duration,
      experience.description,
    ]),
    ...draft.education.flatMap(education => [education.degree, education.institution, education.year]),
    ...draft.skills.map(skill => skill.value),
  ];
}

function createNextValueGetter(translatedTexts: string[]): () => string {
  let index = 0;

  return () => translatedTexts[index++] ?? '';
}

function rebuildExperiences(experiences: CVExperience[], nextValue: () => string): CVExperience[] {
  return experiences.map(experience => ({
    ...experience,
    title: nextValue(),
    organization: nextValue(),
    duration: nextValue(),
    description: nextValue(),
  }));
}

function rebuildEducation(education: CVEducation[], nextValue: () => string): CVEducation[] {
  return education.map(item => ({
    ...item,
    degree: nextValue(),
    institution: nextValue(),
    year: nextValue(),
  }));
}

function rebuildSkills(skills: CVSkill[], nextValue: () => string): CVSkill[] {
  return skills.map(skill => ({
    ...skill,
    value: nextValue(),
  }));
}

function rebuildTranslatedDraft(draft: NormalizedCVDraft, translatedTexts: string[]): NormalizedCVDraft {
  const nextValue = createNextValueGetter(translatedTexts);

  return {
    fullName: draft.fullName,
    summary: nextValue(),
    experiences: rebuildExperiences(draft.experiences, nextValue),
    education: rebuildEducation(draft.education, nextValue),
    skills: rebuildSkills(draft.skills, nextValue),
  };
}

export async function getEnglishTranslationAvailability(): Promise<CVTranslationAvailability> {
  const translationModule = getNativeTranslationModule();

  if (!translationModule) {
    return {
      supported: false,
      reason: Platform.OS === 'android' ? 'native_module_missing' : 'platform_unsupported',
      message: buildUnsupportedMessage(Platform.OS === 'android' ? 'native_module_missing' : 'platform_unsupported'),
    };
  }

  try {
    const availability = await translationModule.getAvailability(SOURCE_LANGUAGE, TARGET_LANGUAGE);
    const supported = Boolean(availability.supported);

    if (supported) {
      return { supported: true };
    }

    return {
      supported: false,
      reason: availability.reason,
      message: availability.message || buildUnsupportedMessage(availability.reason),
    };
  } catch (error) {
    console.error('English translation availability check failed:', error);

    return {
      supported: false,
      reason: 'availability_check_failed',
      message: 'تعذر التحقق من توفر الترجمة الإنجليزية على هذا الجهاز حالياً. يمكنك متابعة النسخة العربية أو المحاولة لاحقاً.',
    };
  }
}

export async function translateDraftToEnglish(draft: NormalizedCVDraft): Promise<CVTranslationResult> {
  const translationModule = getNativeTranslationModule();
  if (!translationModule) {
    return {
      ok: false,
      error: buildError(
        'translation_unavailable',
        buildUnsupportedMessage(Platform.OS === 'android' ? 'native_module_missing' : 'platform_unsupported'),
        'translation',
        false,
      ),
    };
  }

  const availability = await getEnglishTranslationAvailability();
  if (!availability.supported) {
    return {
      ok: false,
      error: buildError(
        'translation_unavailable',
        availability.message || buildUnsupportedMessage(availability.reason),
        'translation',
        false,
      ),
    };
  }

  try {
    const translatedTexts = await translationModule.translateBatch(collectDraftTexts(draft), SOURCE_LANGUAGE, TARGET_LANGUAGE);

    return {
      ok: true,
      draft: rebuildTranslatedDraft(draft, translatedTexts),
    };
  } catch (error) {
    console.error('English CV translation failed:', error);

    return {
      ok: false,
      error: buildError(
        'translation_failed',
        'تعذر إكمال الترجمة الإنجليزية على الجهاز حالياً. قد تحتاج المحاولة الأولى إلى اتصال لتنزيل نموذج الترجمة ثم إعادة المحاولة.',
        'translation',
        true,
      ),
    };
  }
}
