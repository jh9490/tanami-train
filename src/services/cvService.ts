import { generatePDF } from 'react-native-html-to-pdf';
import * as RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { NativeModules, Platform } from 'react-native';

import { renderCVHtml } from './cvHtmlRenderer';
import {
  getEnglishTranslationAvailability,
  getTranslationAvailability,
  translateTextBatch,
} from './cvTranslationService';
import type {
  CVBilingualCertification,
  CVBilingualContactSection,
  CVBilingualDraft,
  CVBilingualEducation,
  CVBilingualExperience,
  CVBilingualSkill,
  CVBilingualVolunteerExperience,
  CVCertification,
  CVContactSection,
  CVDraft,
  CVDraftPreparationResult,
  CVDraftSyncInfo,
  CVDraftSyncOptions,
  CVDraftSyncResult,
  CVEducation,
  CVExportAction,
  CVExportResult,
  CVExperience,
  CVGenerationOptions,
  CVGenerationResult,
  CVLocalizedField,
  CVOperationError,
  CVOutputLanguage,
  CVProfileDefaults,
  CVSkill,
  CVSyncState,
  CVTranslationAvailability,
  CVUserContext,
  CVVolunteerExperience,
  GeneratedCVArtifact,
  NormalizedCVDraft,
} from './cvTypes';

export type {
  CVBilingualCertification,
  CVBilingualContactSection,
  CVBilingualDraft,
  CVBilingualEducation,
  CVBilingualExperience,
  CVBilingualSkill,
  CVBilingualVolunteerExperience,
  CVCertification,
  CVContactSection,
  CVDraft,
  CVDraftPreparationResult,
  CVDraftSyncInfo,
  CVDraftSyncOptions,
  CVDraftSyncResult,
  CVEducation,
  CVExportAction,
  CVExportResult,
  CVExperience,
  CVGenerationOptions,
  CVGenerationResult,
  CVLocalizedField,
  CVOperationError,
  CVOutputLanguage,
  CVProfileDefaults,
  CVSkill,
  CVTranslationAvailability,
  CVUserContext,
  CVVolunteerExperience,
  GeneratedCVArtifact,
  NormalizedCVDraft,
} from './cvTypes';

export { getEnglishTranslationAvailability, getTranslationAvailability } from './cvTranslationService';

const PDF_MIME_TYPE = 'application/pdf' as const;
const DEFAULT_FILE_NAME = 'cv-arabic';
const DEFAULT_ENGLISH_FILE_NAME = 'cv-english';
const PDF_FILE_EXTENSION = '.pdf';

type CVFileSaveModuleShape = {
  savePdfToDownloads?: (
    sourcePath: string,
    fileName: string,
  ) => Promise<{ destination?: string; label?: string }>;
};

type SyncFieldDescriptor = {
  id: string;
  label: string;
  field: CVLocalizedField;
  allowProtectedTransform?: boolean;
};

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

async function buildAvailableExportPath(directory: string, fileName: string): Promise<string> {
  const basePath = `${directory}/${fileName}${PDF_FILE_EXTENSION}`;
  const baseExists = await RNFS.exists(basePath);

  if (!baseExists) {
    return basePath;
  }

  let attempt = 1;
  let candidatePath = `${directory}/${fileName}-${attempt}${PDF_FILE_EXTENSION}`;

  while (await RNFS.exists(candidatePath)) {
    attempt += 1;
    candidatePath = `${directory}/${fileName}-${attempt}${PDF_FILE_EXTENSION}`;
  }

  return candidatePath;
}

async function saveFileToDevice(filePath: string, fileName: string): Promise<string> {
  const nativeFileSaveModule = NativeModules.CVFileSaveModule as CVFileSaveModuleShape | undefined;

  if (Platform.OS === 'android' && nativeFileSaveModule?.savePdfToDownloads) {
    const result = await nativeFileSaveModule.savePdfToDownloads(filePath, fileName);
    return trimText(result?.label || result?.destination || '');
  }

  const normalizedSourcePath = stripFileScheme(trimText(filePath));
  const destinationDirectory = trimText(
    RNFS.DownloadDirectoryPath ||
      RNFS.DocumentDirectoryPath ||
      RNFS.CachesDirectoryPath ||
      RNFS.TemporaryDirectoryPath ||
      '',
  );

  if (!normalizedSourcePath || !destinationDirectory) {
    throw new Error('Missing source or destination path for CV save.');
  }

  const sourceExists = await RNFS.exists(normalizedSourcePath);
  if (!sourceExists) {
    throw new Error('Generated CV file is missing before save.');
  }

  await RNFS.mkdir(destinationDirectory);

  const destinationPath = await buildAvailableExportPath(destinationDirectory, fileName);
  await RNFS.copyFile(normalizedSourcePath, destinationPath);

  if (typeof RNFS.scanFile === 'function') {
    try {
      await RNFS.scanFile(destinationPath);
    } catch (error) {
      console.warn('CV saved but media scan failed:', error);
    }
  }

  return destinationPath;
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

function normalizeContact(contact: CVContactSection): CVContactSection {
  return {
    email: trimText(contact.email),
    phone: trimText(contact.phone),
    address: trimText(contact.address),
    linkedin: trimText(contact.linkedin ?? ''),
    title: trimText(contact.title),
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

function normalizeCertification(certification: CVCertification): CVCertification {
  return {
    id: certification.id,
    name: trimText(certification.name),
    issuer: trimText(certification.issuer),
    date: trimText(certification.date),
    details: trimText(certification.details),
  };
}

function normalizeVolunteerExperience(volunteerExperience: CVVolunteerExperience): CVVolunteerExperience {
  return {
    id: volunteerExperience.id,
    role: trimText(volunteerExperience.role),
    organization: trimText(volunteerExperience.organization),
    duration: trimText(volunteerExperience.duration),
    description: trimText(volunteerExperience.description),
  };
}

const ARABIC_INDIC_DIGIT_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

const MONTH_PATTERNS: Array<{ month: number; patterns: string[] }> = [
  { month: 1, patterns: ['january', 'jan', 'يناير'] },
  { month: 2, patterns: ['february', 'feb', 'فبراير', 'فبراي'] },
  { month: 3, patterns: ['march', 'mar', 'مارس'] },
  { month: 4, patterns: ['april', 'apr', 'ابريل', 'أبريل'] },
  { month: 5, patterns: ['may', 'مايو'] },
  { month: 6, patterns: ['june', 'jun', 'يونيو'] },
  { month: 7, patterns: ['july', 'jul', 'يوليو'] },
  { month: 8, patterns: ['august', 'aug', 'اغسطس', 'أغسطس'] },
  { month: 9, patterns: ['september', 'sep', 'sept', 'سبتمبر'] },
  { month: 10, patterns: ['october', 'oct', 'اكتوبر', 'أكتوبر'] },
  { month: 11, patterns: ['november', 'nov', 'نوفمبر'] },
  { month: 12, patterns: ['december', 'dec', 'ديسمبر'] },
];

const ONGOING_PATTERNS = [
  'present',
  'current',
  'ongoing',
  'now',
  'حتى الآن',
  'حتى الان',
  'إلى الآن',
  'الى الان',
  'الآن',
  'الان',
  'حاليا',
  'حالياً',
  'مستمر',
] as const;

type HistoricalSortKey = {
  originalIndex: number;
  hasDate: boolean;
  isOngoing: boolean;
  endYear: number;
  endMonth: number;
  startYear: number;
  startMonth: number;
};

function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, digit => ARABIC_INDIC_DIGIT_MAP[digit] ?? digit);
}

function normalizeDateText(value: string): string {
  return normalizeDigits(trimText(value)).toLowerCase();
}

function extractYears(value: string): number[] {
  return Array.from(value.matchAll(/\b(19|20)\d{2}\b/g), match => Number(match[0]));
}

function extractLatestMonth(value: string): number {
  let latestMonth = 0;

  MONTH_PATTERNS.forEach(({ month, patterns }) => {
    if (patterns.some(pattern => value.includes(pattern))) {
      latestMonth = Math.max(latestMonth, month);
    }
  });

  return latestMonth;
}

function buildHistoricalSortKey(rawDate: string, originalIndex: number): HistoricalSortKey {
  const normalizedDate = normalizeDateText(rawDate);
  const years = extractYears(normalizedDate);
  const hasDate = years.length > 0;
  const isOngoing = ONGOING_PATTERNS.some(pattern => normalizedDate.includes(pattern.toLowerCase()));
  const latestMonth = extractLatestMonth(normalizedDate);
  const endYear = isOngoing ? Number.MAX_SAFE_INTEGER : years[years.length - 1] ?? 0;
  const startYear = years[0] ?? 0;

  return {
    originalIndex,
    hasDate,
    isOngoing,
    endYear,
    endMonth: isOngoing ? 12 : latestMonth,
    startYear,
    startMonth: latestMonth,
  };
}

function compareHistoricalSortKey(left: HistoricalSortKey, right: HistoricalSortKey): number {
  if (left.isOngoing !== right.isOngoing) {
    return left.isOngoing ? -1 : 1;
  }

  if (left.hasDate !== right.hasDate) {
    return left.hasDate ? -1 : 1;
  }

  if (!left.hasDate && !right.hasDate) {
    return left.originalIndex - right.originalIndex;
  }

  return (
    right.endYear - left.endYear ||
    right.endMonth - left.endMonth ||
    right.startYear - left.startYear ||
    right.startMonth - left.startMonth ||
    left.originalIndex - right.originalIndex
  );
}

function sortHistoricalItems<T>(
  items: T[],
  getDateValue: (item: T) => string,
): T[] {
  return items
    .map((item, originalIndex) => ({
      item,
      key: buildHistoricalSortKey(getDateValue(item), originalIndex),
    }))
    .sort((left, right) => compareHistoricalSortKey(left.key, right.key))
    .map(({ item }) => item);
}

function dedupeSkills(skills: CVSkill[]): CVSkill[] {
  const seen = new Set<string>();

  return skills.filter(skill => {
    const dedupeKey = normalizeDateText(skill.value);

    if (!dedupeKey || seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}

function isEmptyExperience(experience: CVExperience): boolean {
  return (
    !hasText(experience.title) &&
    !hasText(experience.organization) &&
    !hasText(experience.duration) &&
    !hasText(experience.description)
  );
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

function isEmptyCertification(certification: CVCertification): boolean {
  return (
    !hasText(certification.name) &&
    !hasText(certification.issuer) &&
    !hasText(certification.date) &&
    !hasText(certification.details)
  );
}

function isEmptyVolunteerExperience(volunteerExperience: CVVolunteerExperience): boolean {
  return (
    !hasText(volunteerExperience.role) &&
    !hasText(volunteerExperience.organization) &&
    !hasText(volunteerExperience.duration) &&
    !hasText(volunteerExperience.description)
  );
}

function buildSeededField(
  arValue = '',
  enValue = '',
  syncState: CVSyncState = 'auto_populated',
): CVLocalizedField {
  const normalizedAr = trimText(arValue);
  const normalizedEn = trimText(enValue);
  const lastEditedLanguage: CVOutputLanguage =
    hasText(normalizedEn) && !hasText(normalizedAr) ? 'en' : 'ar';

  return {
    ar: normalizedAr,
    en: normalizedEn,
    lastEditedLanguage,
    syncState: hasText(normalizedAr) || hasText(normalizedEn) ? syncState : 'not_synced',
  };
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

function getLanguageLabel(language: CVOutputLanguage): string {
  return language === 'en' ? 'الإنجليزية' : 'العربية';
}

function buildSyncSuccessMessage(sync: CVDraftSyncInfo): string {
  if (sync.updatedFieldIds.length && sync.preservedFieldIds.length) {
    return `تم التبديل إلى ${getLanguageLabel(sync.targetLanguage)} مع مزامنة ${sync.updatedFieldIds.length} حقل والإبقاء على ${sync.preservedFieldIds.length} حقل كما هو.`;
  }

  if (sync.updatedFieldIds.length) {
    return `تم التبديل إلى ${getLanguageLabel(sync.targetLanguage)} مع مزامنة ${sync.updatedFieldIds.length} حقل تلقائياً.`;
  }

  if (sync.preservedFieldIds.length) {
    return `تم التبديل إلى ${getLanguageLabel(sync.targetLanguage)} مع الإبقاء على القيم الحالية دون استبدالها.`;
  }

  return `تم التبديل إلى ${getLanguageLabel(sync.targetLanguage)}.`;
}

function cloneDraft(draft: CVBilingualDraft): CVBilingualDraft {
  return JSON.parse(JSON.stringify(draft)) as CVBilingualDraft;
}

function createField(
  value = '',
  language: CVOutputLanguage = 'ar',
  syncState: CVSyncState = 'not_synced',
): CVLocalizedField {
  return {
    ar: language === 'ar' ? value : '',
    en: language === 'en' ? value : '',
    lastEditedLanguage: language,
    syncState,
  };
}

function getFieldValue(field: CVLocalizedField, language: CVOutputLanguage): string {
  return language === 'ar' ? field.ar : field.en;
}

function setFieldValue(field: CVLocalizedField, language: CVOutputLanguage, value: string): CVLocalizedField {
  const nextValue = value;
  const nextField: CVLocalizedField = {
    ...field,
    ar: language === 'ar' ? nextValue : field.ar,
    en: language === 'en' ? nextValue : field.en,
    lastEditedLanguage: language,
    syncState: hasText(nextValue) || hasText(getFieldValue(field, language === 'ar' ? 'en' : 'ar'))
      ? 'manually_edited'
      : 'not_synced',
    failureReason: undefined,
  };

  return nextField;
}

function markFieldPreserved(field: CVLocalizedField): CVLocalizedField {
  return {
    ...field,
    syncState: 'preserved',
    failureReason: undefined,
  };
}

function buildSyncFieldId(prefix: string, id: string, fieldName: string): string {
  return `${prefix}.${id}.${fieldName}`;
}

function collectDraftFields(draft: CVBilingualDraft): SyncFieldDescriptor[] {
  const fields: SyncFieldDescriptor[] = [
    { id: 'fullName', label: 'الاسم الكامل', field: draft.fullName, allowProtectedTransform: true },
    { id: 'contact.email', label: 'البريد الإلكتروني', field: draft.contact.email },
    { id: 'contact.phone', label: 'رقم الجوال', field: draft.contact.phone },
    { id: 'contact.address', label: 'العنوان', field: draft.contact.address },
    { id: 'contact.linkedin', label: 'لينكدإن', field: draft.contact.linkedin },
    { id: 'contact.title', label: 'المسمى المهني', field: draft.contact.title },
    { id: 'summary', label: 'الملخص المهني', field: draft.summary },
  ];

  draft.experiences.forEach(item => {
    fields.push(
      { id: buildSyncFieldId('experience', item.id, 'title'), label: 'المسمى الوظيفي', field: item.title },
      { id: buildSyncFieldId('experience', item.id, 'organization'), label: 'جهة العمل', field: item.organization },
      { id: buildSyncFieldId('experience', item.id, 'duration'), label: 'المدة', field: item.duration },
      { id: buildSyncFieldId('experience', item.id, 'description'), label: 'وصف الخبرة', field: item.description },
    );
  });

  draft.education.forEach(item => {
    fields.push(
      { id: buildSyncFieldId('education', item.id, 'degree'), label: 'الدرجة العلمية', field: item.degree },
      { id: buildSyncFieldId('education', item.id, 'institution'), label: 'المؤسسة التعليمية', field: item.institution },
      { id: buildSyncFieldId('education', item.id, 'year'), label: 'سنة التخرج', field: item.year },
    );
  });

  draft.skills.forEach(item => {
    fields.push({ id: buildSyncFieldId('skill', item.id, 'value'), label: 'المهارة', field: item.value });
  });

  draft.certifications.forEach(item => {
    fields.push(
      { id: buildSyncFieldId('certification', item.id, 'name'), label: 'اسم الشهادة أو الدورة', field: item.name },
      { id: buildSyncFieldId('certification', item.id, 'issuer'), label: 'الجهة المانحة', field: item.issuer },
      { id: buildSyncFieldId('certification', item.id, 'date'), label: 'التاريخ', field: item.date },
      { id: buildSyncFieldId('certification', item.id, 'details'), label: 'تفاصيل الشهادة أو الدورة', field: item.details },
    );
  });

  draft.volunteerExperiences.forEach(item => {
    fields.push(
      { id: buildSyncFieldId('volunteer', item.id, 'role'), label: 'الدور التطوعي', field: item.role },
      { id: buildSyncFieldId('volunteer', item.id, 'organization'), label: 'الجهة', field: item.organization },
      { id: buildSyncFieldId('volunteer', item.id, 'duration'), label: 'المدة', field: item.duration },
      { id: buildSyncFieldId('volunteer', item.id, 'description'), label: 'وصف العمل التطوعي', field: item.description },
    );
  });

  return fields;
}

function createContactFromLocalized(
  item: CVBilingualContactSection,
  language: CVOutputLanguage,
): CVContactSection {
  return {
    email: getFieldValue(item.email, language),
    phone: getFieldValue(item.phone, language),
    address: getFieldValue(item.address, language),
    linkedin: getFieldValue(item.linkedin, language),
    title: getFieldValue(item.title, language),
  };
}

function createExperienceFromLocalized(
  item: CVBilingualExperience,
  language: CVOutputLanguage,
): CVExperience {
  return {
    id: item.id,
    title: getFieldValue(item.title, language),
    organization: getFieldValue(item.organization, language),
    duration: getFieldValue(item.duration, language),
    description: getFieldValue(item.description, language),
  };
}

function createEducationFromLocalized(
  item: CVBilingualEducation,
  language: CVOutputLanguage,
): CVEducation {
  return {
    id: item.id,
    degree: getFieldValue(item.degree, language),
    institution: getFieldValue(item.institution, language),
    year: getFieldValue(item.year, language),
  };
}

function createSkillFromLocalized(item: CVBilingualSkill, language: CVOutputLanguage): CVSkill {
  return {
    id: item.id,
    value: getFieldValue(item.value, language),
  };
}

function createCertificationFromLocalized(
  item: CVBilingualCertification,
  language: CVOutputLanguage,
): CVCertification {
  return {
    id: item.id,
    name: getFieldValue(item.name, language),
    issuer: getFieldValue(item.issuer, language),
    date: getFieldValue(item.date, language),
    details: getFieldValue(item.details, language),
  };
}

function createVolunteerFromLocalized(
  item: CVBilingualVolunteerExperience,
  language: CVOutputLanguage,
): CVVolunteerExperience {
  return {
    id: item.id,
    role: getFieldValue(item.role, language),
    organization: getFieldValue(item.organization, language),
    duration: getFieldValue(item.duration, language),
    description: getFieldValue(item.description, language),
  };
}

export function createLocalizedField(
  value = '',
  language: CVOutputLanguage = 'ar',
  syncState: CVSyncState = 'not_synced',
): CVLocalizedField {
  return createField(value, language, syncState);
}

export function updateLocalizedFieldValue(
  field: CVLocalizedField,
  language: CVOutputLanguage,
  value: string,
): CVLocalizedField {
  return setFieldValue(field, language, value);
}

export function preserveLocalizedField(field: CVLocalizedField): CVLocalizedField {
  return markFieldPreserved(field);
}

export function createEmptyBilingualDraft(language: CVOutputLanguage = 'ar'): CVBilingualDraft {
  return {
    editingLanguage: language,
    fullName: createField('', language),
    contact: {
      email: createField('', language),
      phone: createField('', language),
      address: createField('', language),
      linkedin: createField('', language),
      title: createField('', language),
    },
    summary: createField('', language),
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    volunteerExperiences: [],
  };
}

export function upgradeBilingualDraft(draft: CVBilingualDraft): CVBilingualDraft {
  const linkedin = draft.contact.linkedin;

  if (linkedin) {
    return draft;
  }

  return {
    ...draft,
    contact: {
      ...draft.contact,
      linkedin: createField('', draft.editingLanguage),
    },
  };
}

export function createBilingualDraftFromDraft(
  draft: CVDraft,
  language: CVOutputLanguage = 'ar',
): CVBilingualDraft {
  return {
    editingLanguage: language,
    fullName: createField(draft.fullName, language),
    contact: {
      email: buildSeededField(draft.contact.email, draft.contact.email, 'preserved'),
      phone: buildSeededField(draft.contact.phone, draft.contact.phone, 'preserved'),
      address: createField(draft.contact.address, language),
      linkedin: buildSeededField(draft.contact.linkedin ?? '', draft.contact.linkedin ?? '', 'preserved'),
      title: createField(draft.contact.title, language),
    },
    summary: createField(draft.summary, language),
    experiences: draft.experiences.map(item => ({
      id: item.id,
      title: createField(item.title, language),
      organization: createField(item.organization, language),
      duration: createField(item.duration, language),
      description: createField(item.description, language),
    })),
    education: draft.education.map(item => ({
      id: item.id,
      degree: createField(item.degree, language),
      institution: createField(item.institution, language),
      year: createField(item.year, language),
    })),
    skills: draft.skills.map(item => ({
      id: item.id,
      value: createField(item.value, language),
    })),
    certifications: draft.certifications.map(item => ({
      id: item.id,
      name: createField(item.name, language),
      issuer: createField(item.issuer, language),
      date: createField(item.date, language),
      details: createField(item.details, language),
    })),
    volunteerExperiences: draft.volunteerExperiences.map(item => ({
      id: item.id,
      role: createField(item.role, language),
      organization: createField(item.organization, language),
      duration: createField(item.duration, language),
      description: createField(item.description, language),
    })),
  };
}

export function createBilingualDraftFromProfileDefaults(
  defaults: CVProfileDefaults,
  language: CVOutputLanguage = 'ar',
): CVBilingualDraft {
  const draft = createEmptyBilingualDraft(language);

  return mergeDraftWithProfileDefaults(draft, defaults);
}

function mergeLocalizedFieldWithDefaults(
  field: CVLocalizedField,
  defaults: { ar?: string | null; en?: string | null },
  syncState: CVSyncState = 'auto_populated',
): CVLocalizedField {
  const arValue = trimText(defaults.ar ?? '');
  const enValue = trimText(defaults.en ?? '');
  const shouldAddAr = !hasText(field.ar) && hasText(arValue);
  const shouldAddEn = !hasText(field.en) && hasText(enValue);

  if (!shouldAddAr && !shouldAddEn) {
    return field;
  }

  const nextField = { ...field };

  if (shouldAddAr) {
    nextField.ar = arValue;
  }

  if (shouldAddEn) {
    nextField.en = enValue;
  }

  if (!hasText(field.ar) && !hasText(field.en)) {
    nextField.lastEditedLanguage = hasText(enValue) && !hasText(arValue) ? 'en' : 'ar';
  }

  if (nextField.syncState === 'not_synced') {
    nextField.syncState = syncState;
  }

  nextField.failureReason = undefined;

  return nextField;
}

export function mergeDraftWithProfileDefaults(
  draft: CVBilingualDraft,
  defaults: CVProfileDefaults,
): CVBilingualDraft {
  draft = upgradeBilingualDraft(draft);
  const fullName = mergeLocalizedFieldWithDefaults(
    draft.fullName,
    {
      ar: defaults.fullNameAr,
      en: defaults.fullNameEn,
    },
    'auto_populated',
  );
  const email = mergeLocalizedFieldWithDefaults(
    draft.contact.email,
    {
      ar: defaults.email,
      en: defaults.email,
    },
    'preserved',
  );
  const phone = mergeLocalizedFieldWithDefaults(
    draft.contact.phone,
    {
      ar: defaults.phone,
      en: defaults.phone,
    },
    'preserved',
  );
  const address = mergeLocalizedFieldWithDefaults(
    draft.contact.address,
    {
      ar: defaults.addressAr,
      en: defaults.addressEn,
    },
    'auto_populated',
  );
  const linkedin = draft.contact.linkedin;
  const title = mergeLocalizedFieldWithDefaults(
    draft.contact.title,
    {
      ar: defaults.titleAr,
      en: defaults.titleEn,
    },
    'auto_populated',
  );

  if (
    fullName === draft.fullName &&
    email === draft.contact.email &&
    phone === draft.contact.phone &&
    address === draft.contact.address &&
    linkedin === draft.contact.linkedin &&
    title === draft.contact.title
  ) {
    return draft;
  }

  return {
    ...draft,
    fullName,
    contact: {
      email,
      phone,
      address,
      linkedin,
      title,
    },
  };
}

export function buildDraftForLanguage(
  draft: CVBilingualDraft,
  language: CVOutputLanguage = draft.editingLanguage,
): CVDraft {
  return {
    fullName: getFieldValue(draft.fullName, language),
    contact: createContactFromLocalized(draft.contact, language),
    summary: getFieldValue(draft.summary, language),
    experiences: draft.experiences.map(item => createExperienceFromLocalized(item, language)),
    education: draft.education.map(item => createEducationFromLocalized(item, language)),
    skills: draft.skills.map(item => createSkillFromLocalized(item, language)),
    certifications: draft.certifications.map(item => createCertificationFromLocalized(item, language)),
    volunteerExperiences: draft.volunteerExperiences.map(item => createVolunteerFromLocalized(item, language)),
  };
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
    contact: normalizeContact(draft.contact),
    summary: trimText(draft.summary),
    experiences,
    education: draft.education.map(normalizeEducation).filter(education => !isEmptyEducation(education)),
    skills: draft.skills.map(normalizeSkill).filter(skill => !isEmptySkill(skill)),
    certifications: draft.certifications.map(normalizeCertification).filter(certification => !isEmptyCertification(certification)),
    volunteerExperiences: draft.volunteerExperiences
      .map(normalizeVolunteerExperience)
      .filter(volunteerExperience => !isEmptyVolunteerExperience(volunteerExperience)),
  };

  return {
    ok: true,
    draft: normalizedDraft,
  };
}

export function prepareAtsDraftForExport(draft: NormalizedCVDraft): NormalizedCVDraft {
  return {
    ...draft,
    experiences: sortHistoricalItems(draft.experiences, experience => experience.duration),
    education: sortHistoricalItems(draft.education, education => education.year),
    skills: dedupeSkills(draft.skills),
    certifications: sortHistoricalItems(draft.certifications, certification => certification.date),
    volunteerExperiences: sortHistoricalItems(
      draft.volunteerExperiences,
      volunteerExperience => volunteerExperience.duration,
    ),
  };
}

export async function syncDraftForLanguage(
  draft: CVBilingualDraft,
  options: CVDraftSyncOptions,
): Promise<CVDraftSyncResult> {
  const overwriteMode = options.overwriteMode ?? 'auto';
  const sourceLanguage = options.sourceLanguage;
  const targetLanguage = options.targetLanguage;

  const nextDraft = cloneDraft(draft);
  nextDraft.editingLanguage = targetLanguage;

  if (sourceLanguage === targetLanguage) {
    const sync: CVDraftSyncInfo = {
      sourceLanguage,
      targetLanguage,
      updatedFieldIds: [],
      preservedFieldIds: [],
      failedFieldIds: [],
      message: `تم إبقاء التحرير على ${getLanguageLabel(targetLanguage)}.`,
    };

    return { ok: true, draft: nextDraft, sync };
  }

  const updatedFieldIds: string[] = [];
  const preservedFieldIds: string[] = [];
  const failedFieldIds: string[] = [];
  const translationRequests = collectDraftFields(nextDraft)
    .filter(descriptor => {
      const sourceValue = trimText(getFieldValue(descriptor.field, sourceLanguage));
      const targetValue = trimText(getFieldValue(descriptor.field, targetLanguage));

      if (!sourceValue) {
        return false;
      }

      if (descriptor.field.syncState === 'preserved' || (overwriteMode === 'preserve-target' && targetValue)) {
        preservedFieldIds.push(descriptor.id);
        descriptor.field.syncState = 'preserved';
        descriptor.field.failureReason = undefined;
        return false;
      }

      if (descriptor.field.lastEditedLanguage === targetLanguage) {
        preservedFieldIds.push(descriptor.id);
        descriptor.field.failureReason = undefined;
        return false;
      }

      return descriptor.field.lastEditedLanguage === sourceLanguage || !targetValue;
    })
    .map(descriptor => ({
      id: descriptor.id,
      label: descriptor.label,
      field: descriptor.field,
      allowProtectedTransform: descriptor.allowProtectedTransform,
      text: getFieldValue(descriptor.field, sourceLanguage),
    }));

  if (!translationRequests.length) {
    const sync: CVDraftSyncInfo = {
      sourceLanguage,
      targetLanguage,
      updatedFieldIds,
      preservedFieldIds,
      failedFieldIds,
    };
    sync.message = buildSyncSuccessMessage(sync);

    return { ok: true, draft: nextDraft, sync };
  }

  const translationResult = await translateTextBatch(
    translationRequests.map(item => ({
      id: item.id,
      text: item.text,
      allowProtectedTransform: item.allowProtectedTransform,
    })),
    sourceLanguage,
    targetLanguage,
  );

  const now = new Date().toISOString();

  translationResult.values.forEach(result => {
    const request = translationRequests.find(item => item.id === result.id);
    if (!request) {
      return;
    }

    if (targetLanguage === 'ar') {
      request.field.ar = result.text;
    } else {
      request.field.en = result.text;
    }
    request.field.lastSyncSourceLanguage = sourceLanguage;
    request.field.lastSyncAt = now;
    request.field.failureReason = undefined;
    request.field.syncState = result.source === 'translated' ? 'auto_populated' : 'preserved';

    if (result.source === 'translated') {
      updatedFieldIds.push(result.id);
    } else {
      preservedFieldIds.push(result.id);
    }
  });

  if (!translationResult.ok) {
    translationResult.failedIds.forEach(id => {
      const request = translationRequests.find(item => item.id === id);
      if (!request) {
        return;
      }

      request.field.syncState = 'failed';
      request.field.failureReason = translationResult.error.message;
      failedFieldIds.push(id);
    });

    return {
      ok: false,
      draft: nextDraft,
      error: translationResult.error,
      failedFieldIds,
    };
  }

  const sync: CVDraftSyncInfo = {
    sourceLanguage,
    targetLanguage,
    updatedFieldIds,
    preservedFieldIds,
    failedFieldIds,
  };
  sync.message = buildSyncSuccessMessage(sync);

  return { ok: true, draft: nextDraft, sync };
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
    return sanitizedName === DEFAULT_FILE_NAME
      ? DEFAULT_ENGLISH_FILE_NAME
      : `cv-en-${sanitizedName.replace(/^cv-/, '')}`;
  }

  return sanitizedName;
}

export async function generateCV(
  draft: CVDraft,
  userContext?: CVUserContext,
  options?: CVGenerationOptions,
): Promise<CVGenerationResult> {
  const preparedDraftResult = prepareCVDraft(draft, userContext);
  if (!preparedDraftResult.ok) {
    return preparedDraftResult;
  }

  const outputLanguage = options?.outputLanguage ?? 'ar';
  const preparedDraft = prepareAtsDraftForExport(preparedDraftResult.draft);
  const fileName = buildCvFileName(preparedDraft.fullName, outputLanguage);

  try {
    const file = await generatePDF({
      html: renderCVHtml(preparedDraft, outputLanguage),
      fileName,
      directory: 'Documents',
    });

    const filePath = trimText(file.filePath ?? '');
    if (!filePath) {
      return {
        ok: false,
        error: buildError(
          'pdf_file_missing',
          'تم إنشاء المستند ولكن تعذر الوصول إلى مسار الملف. حاول مرة أخرى.',
          'generation',
          true,
        ),
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
    const error = buildError(
      'artifact_missing',
      'لا يوجد ملف صالح للمشاركة حالياً. أنشئ السيرة الذاتية مرة أخرى.',
      'export',
      true,
    );

    return {
      ok: false,
      status: 'failed',
      artifact: buildArtifact(artifact.fileName, filePath, artifact.language, 'failed', error),
      error,
    };
  }

  try {
    if (action === 'save') {
      const destination = await saveFileToDevice(filePath, artifact.fileName);

      return {
        ok: true,
        status: 'exported',
        artifact: buildArtifact(artifact.fileName, filePath, artifact.language, 'exported', null),
        destination,
      };
    }

    const shareableFilePath = await getShareableFilePath(filePath, artifact.fileName);
    const documentLabel = artifact.language === 'en' ? 'السيرة الذاتية الإنجليزية' : 'السيرة الذاتية';

    await Share.open({
      title: `مشاركة ${documentLabel}`,
      url: withFileScheme(shareableFilePath),
      type: artifact.mimeType,
      filename: `${artifact.fileName}${PDF_FILE_EXTENSION}`,
      saveToFiles: false,
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
