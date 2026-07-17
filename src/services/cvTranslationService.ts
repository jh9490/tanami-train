import { NativeModules, Platform } from 'react-native';

import type {
  CVOperationError,
  CVOutputLanguage,
  CVTranslationAvailability,
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

export type CVTranslationItem = {
  id: string;
  text: string;
  allowProtectedTransform?: boolean;
};

export type CVTranslatedTextValue = {
  id: string;
  text: string;
  source: 'translated' | 'preserved';
};

export type CVTranslationBatchResult =
  | {
      ok: true;
      values: CVTranslatedTextValue[];
    }
  | {
      ok: false;
      error: CVOperationError;
      failedIds: string[];
      values: CVTranslatedTextValue[];
    };

function trimText(value: string): string {
  return value.trim();
}

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

  if (
    !translationModule ||
    typeof translationModule.getAvailability !== 'function' ||
    typeof translationModule.translateBatch !== 'function'
  ) {
    return null;
  }

  return translationModule;
}

function buildUnsupportedMessage(reason?: string): string {
  if (reason === 'platform_unsupported') {
    return 'الترجمة التلقائية متاحة حالياً على أجهزة Android المدعومة فقط. يمكنك متابعة التحرير اليدوي دون فقدان البيانات.';
  }

  if (reason === 'language_unsupported') {
    return 'هذا الجهاز لا يدعم الزوج اللغوي المطلوب ضمن مسار الترجمة المحلي الحالي.';
  }

  return 'تعذر العثور على خدمة الترجمة المحلية حالياً. يمكنك متابعة التحرير اليدوي أو المحاولة لاحقاً.';
}

function isEmail(value: string): boolean {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value);
}

function isUrl(value: string): boolean {
  return /https?:\/\/|www\./i.test(value);
}

function isPhone(value: string): boolean {
  const digits = value.replace(/[^\d+]/g, '');
  return digits.length >= 7 && /^[+\d][\d\s()-]+$/.test(value.trim());
}

function isAcronym(value: string): boolean {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every(token => /^[A-Z0-9&.+/-]{2,}$/.test(token));
}

function shouldPreserveText(text: string): boolean {
  const value = trimText(text);
  if (!value) {
    return false;
  }

  return isEmail(value) || isUrl(value) || isPhone(value) || isAcronym(value);
}

function buildPreservedValues(items: CVTranslationItem[]): CVTranslatedTextValue[] {
  return items.map(item => ({
    id: item.id,
    text: item.text,
    source: 'preserved',
  }));
}

export async function getTranslationAvailability(
  sourceLanguage: CVOutputLanguage,
  targetLanguage: CVOutputLanguage,
): Promise<CVTranslationAvailability> {
  const translationModule = getNativeTranslationModule();

  if (!translationModule) {
    return {
      supported: false,
      reason: Platform.OS === 'android' ? 'native_module_missing' : 'platform_unsupported',
      message: buildUnsupportedMessage(Platform.OS === 'android' ? 'native_module_missing' : 'platform_unsupported'),
    };
  }

  try {
    const availability = await translationModule.getAvailability(sourceLanguage, targetLanguage);
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
    console.error('Translation availability check failed:', error);

    return {
      supported: false,
      reason: 'availability_check_failed',
      message: 'تعذر التحقق من توفر الترجمة على هذا الجهاز حالياً. يمكنك متابعة التحرير اليدوي أو المحاولة لاحقاً.',
    };
  }
}

export async function translateTextBatch(
  items: CVTranslationItem[],
  sourceLanguage: CVOutputLanguage,
  targetLanguage: CVOutputLanguage,
): Promise<CVTranslationBatchResult> {
  const normalizedItems = items.filter(item => trimText(item.text).length > 0);
  const preservedItems = normalizedItems.filter(
    item => item.allowProtectedTransform !== true && shouldPreserveText(item.text),
  );
  const translatableItems = normalizedItems.filter(
    item => item.allowProtectedTransform === true || !shouldPreserveText(item.text),
  );
  const preservedValues = buildPreservedValues(preservedItems);

  if (!translatableItems.length) {
    return { ok: true, values: preservedValues };
  }

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
      failedIds: translatableItems.map(item => item.id),
      values: preservedValues,
    };
  }

  const availability = await getTranslationAvailability(sourceLanguage, targetLanguage);
  if (!availability.supported) {
    return {
      ok: false,
      error: buildError(
        'translation_unavailable',
        availability.message || buildUnsupportedMessage(availability.reason),
        'translation',
        false,
      ),
      failedIds: translatableItems.map(item => item.id),
      values: preservedValues,
    };
  }

  try {
    const translatedTexts = await translationModule.translateBatch(
      translatableItems.map(item => item.text),
      sourceLanguage,
      targetLanguage,
    );

    return {
      ok: true,
      values: [
        ...preservedValues,
        ...translatableItems.map((item, index) => ({
          id: item.id,
          text: translatedTexts[index] ?? item.text,
          source: 'translated' as const,
        })),
      ],
    };
  } catch (error) {
    console.error('CV draft sync translation failed:', error);

    return {
      ok: false,
      error: buildError(
        'field_sync_failed',
        'تعذر مزامنة بعض الحقول على الجهاز حالياً. يمكنك تعديل الحقول المتأثرة يدوياً ثم المتابعة.',
        'translation',
        true,
      ),
      failedIds: translatableItems.map(item => item.id),
      values: preservedValues,
    };
  }
}

export async function getEnglishTranslationAvailability(): Promise<CVTranslationAvailability> {
  return getTranslationAvailability('ar', 'en');
}
