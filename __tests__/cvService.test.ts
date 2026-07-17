jest.mock('react-native-html-to-pdf', () => ({
  __esModule: true,
  generatePDF: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  TemporaryDirectoryPath: '/tmp',
  DownloadDirectoryPath: '/downloads',
  DocumentDirectoryPath: '/documents',
  exists: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  copyFile: jest.fn(),
  scanFile: jest.fn(),
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { renderArabicCVHtml, renderEnglishCVHtml } from '../src/services/cvHtmlRenderer';
import { generatePDF } from 'react-native-html-to-pdf';
import * as RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {
  buildDraftForLanguage,
  createBilingualDraftFromDraft,
  mergeDraftWithProfileDefaults,
  exportGeneratedCV,
  generateCV,
  prepareAtsDraftForExport,
  prepareCVDraft,
  preserveLocalizedField,
  sanitizeCvFileName,
  syncDraftForLanguage,
  upgradeBilingualDraft,
  updateLocalizedFieldValue,
} from '../src/services/cvService';
import { loadStoredCVDraft, saveStoredCVDraft } from '../src/storage/cvDraftStorage';

const mockedGeneratePDF = jest.mocked(generatePDF);
const mockedRNFS = jest.mocked(RNFS);
const mockedShareOpen = jest.mocked(Share.open);
const mockedAsyncStorage = jest.mocked(AsyncStorage);

type TranslationModuleMock = {
  getAvailability: jest.Mock;
  translateBatch: jest.Mock;
};

type FileSaveModuleMock = {
  savePdfToDownloads: jest.Mock;
};

const mockedTranslationModule: TranslationModuleMock = {
  getAvailability: jest.fn(),
  translateBatch: jest.fn(),
};

const mockedFileSaveModule: FileSaveModuleMock = {
  savePdfToDownloads: jest.fn(),
};

function createArabicDraft() {
  return {
    fullName: 'أحمد صالح',
    contact: {
      email: 'ahmed.saleh@example.com',
      phone: '+966500000000',
      address: 'الرياض',
      title: 'مهندس برمجيات أول',
    },
    summary: 'مهندس جوال أول',
    experiences: [
      {
        id: 'exp-1',
        title: 'مطور React Native أول',
        organization: 'شركة تنامي للحلول الرقمية',
        duration: '2023 - حتى الآن',
        description: 'بناء تطبيقات عربية.',
      },
    ],
    education: [{ id: 'edu-1', degree: 'علوم الحاسب', institution: 'جامعة الملك سعود', year: '2020' }],
    skills: [{ id: 'skill-1', value: 'TypeScript' }],
    certifications: [
      {
        id: 'cert-1',
        name: 'شهادة تطوير تطبيقات الجوال',
        issuer: 'منصة تدريبية',
        date: '2024',
        details: 'برنامج تطبيقي مكثف.',
      },
    ],
    volunteerExperiences: [
      {
        id: 'vol-1',
        role: 'منظم تقني',
        organization: 'مجتمع المطورين',
        duration: '2023',
        description: 'تنسيق ورش مجانية.',
      },
    ],
  };
}

describe('cvService helpers', () => {
  beforeEach(() => {
    mockedGeneratePDF.mockReset();
    mockedRNFS.exists.mockReset();
    mockedRNFS.mkdir.mockReset();
    mockedRNFS.unlink.mockReset();
    mockedRNFS.copyFile.mockReset();
    mockedRNFS.scanFile.mockReset();
    mockedShareOpen.mockReset();
    mockedAsyncStorage.getItem.mockReset();
    mockedAsyncStorage.setItem.mockReset();
    mockedAsyncStorage.removeItem.mockReset();
    mockedTranslationModule.getAvailability.mockReset();
    mockedTranslationModule.translateBatch.mockReset();
    mockedFileSaveModule.savePdfToDownloads.mockReset();
    mockedTranslationModule.getAvailability.mockResolvedValue({ supported: true });
    (NativeModules as Record<string, unknown>).CVTranslationModule = mockedTranslationModule;
    (NativeModules as Record<string, unknown>).CVFileSaveModule = mockedFileSaveModule;
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });

  it('requires a full name before generation', () => {
    const result = prepareCVDraft(
      {
        fullName: '   ',
        contact: { email: '', phone: '', address: '', title: '' },
        summary: '',
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        volunteerExperiences: [],
      },
      { isAuthenticated: true },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('missing_full_name');
    }
  });

  it('filters empty rows and trims values across the new CV sections', () => {
    const result = prepareCVDraft(
      {
        fullName: '  أحمد صالح  ',
        contact: {
          email: '  ahmed.saleh@example.com  ',
          phone: '  +966500000000  ',
          address: '  الرياض  ',
          title: '  مهندس برمجيات  ',
        },
        summary: '  مطور تطبيقات React Native  ',
        experiences: [
          {
            id: '1',
            title: '  مطور تطبيقات  ',
            organization: '  شركة تنامي  ',
            duration: ' 2022 - الآن ',
            description: '  تطوير واجهات عربية  ',
          },
          {
            id: '2',
            title: '',
            organization: '',
            duration: '',
            description: '',
          },
        ],
        education: [{ id: '3', degree: '  بكالوريوس  ', institution: '  جامعة  ', year: ' 2020 ' }],
        skills: [{ id: '4', value: '  TypeScript  ' }, { id: '5', value: '   ' }],
        certifications: [
          { id: '6', name: '  شهادة  ', issuer: '  منصة  ', date: ' 2024 ', details: '  تفاصيل  ' },
          { id: '7', name: '   ', issuer: '', date: '', details: '' },
        ],
        volunteerExperiences: [
          {
            id: '8',
            role: '  منظم  ',
            organization: '  مجتمع  ',
            duration: ' 2023 ',
            description: '  نشاط تطوعي  ',
          },
          { id: '9', role: '', organization: '', duration: '', description: '' },
        ],
      },
      { isAuthenticated: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.fullName).toBe('أحمد صالح');
      expect(result.draft.contact).toEqual({
        email: 'ahmed.saleh@example.com',
        phone: '+966500000000',
        address: 'الرياض',
        linkedin: '',
        title: 'مهندس برمجيات',
      });
      expect(result.draft.summary).toBe('مطور تطبيقات React Native');
      expect(result.draft.experiences).toHaveLength(1);
      expect(result.draft.skills).toEqual([{ id: '4', value: 'TypeScript' }]);
      expect(result.draft.certifications).toEqual([
        { id: '6', name: 'شهادة', issuer: 'منصة', date: '2024', details: 'تفاصيل' },
      ]);
      expect(result.draft.volunteerExperiences).toEqual([
        {
          id: '8',
          role: 'منظم',
          organization: 'مجتمع',
          duration: '2023',
          description: 'نشاط تطوعي',
        },
      ]);
    }
  });

  it('sanitizes filenames without dropping Arabic names', () => {
    expect(sanitizeCvFileName(' أحمد/صالح: Senior Dev ')).toBe('cv-أحمد-صالح-Senior-Dev');
  });

  it('sorts ATS historical sections from newer to older and removes duplicate skills', () => {
    const exportDraft = prepareAtsDraftForExport({
      fullName: 'Ahmed Saleh',
      contact: {
        email: 'ahmed.saleh@example.com',
        phone: '+966500000000',
        address: 'Riyadh',
        linkedin: 'https://www.linkedin.com/in/ahmed-saleh',
        title: 'Senior Software Engineer',
      },
      summary: 'Senior mobile engineer',
      experiences: [
        {
          id: 'exp-old',
          title: 'Older Role',
          organization: 'Org 1',
          duration: '2019 - 2021',
          description: 'Older experience',
        },
        {
          id: 'exp-current',
          title: 'Current Role',
          organization: 'Org 3',
          duration: '2023 - Present',
          description: 'Current experience',
        },
        {
          id: 'exp-mid',
          title: 'Mid Role',
          organization: 'Org 2',
          duration: '2022 - 2023',
          description: 'Mid experience',
        },
        {
          id: 'exp-undated',
          title: 'Undated Role',
          organization: 'Org 4',
          duration: '',
          description: 'Undated experience',
        },
      ],
      education: [
        { id: 'edu-old', degree: 'BSc', institution: 'University A', year: '2020' },
        { id: 'edu-new', degree: 'MSc', institution: 'University B', year: '٢٠٢٤' },
        { id: 'edu-undated', degree: 'Coursework', institution: 'University C', year: '' },
      ],
      skills: [
        { id: 'skill-1', value: 'React Native' },
        { id: 'skill-2', value: 'react native' },
        { id: 'skill-3', value: 'TypeScript' },
      ],
      certifications: [
        { id: 'cert-old', name: 'Cert 1', issuer: 'Platform', date: '2024', details: '' },
        { id: 'cert-new', name: 'Cert 2', issuer: 'Platform', date: 'Mar 2025', details: '' },
        { id: 'cert-undated', name: 'Cert 3', issuer: 'Platform', date: '', details: '' },
      ],
      volunteerExperiences: [
        {
          id: 'vol-old',
          role: 'Volunteer',
          organization: 'Community A',
          duration: '2022',
          description: '',
        },
        {
          id: 'vol-current',
          role: 'Lead Volunteer',
          organization: 'Community B',
          duration: 'January 2024 - Present',
          description: '',
        },
        {
          id: 'vol-undated',
          role: 'Helper',
          organization: 'Community C',
          duration: '',
          description: '',
        },
      ],
    });

    expect(exportDraft.experiences.map(item => item.id)).toEqual([
      'exp-current',
      'exp-mid',
      'exp-old',
      'exp-undated',
    ]);
    expect(exportDraft.education.map(item => item.id)).toEqual(['edu-new', 'edu-old', 'edu-undated']);
    expect(exportDraft.skills.map(item => item.id)).toEqual(['skill-1', 'skill-3']);
    expect(exportDraft.certifications.map(item => item.id)).toEqual([
      'cert-new',
      'cert-old',
      'cert-undated',
    ]);
    expect(exportDraft.volunteerExperiences.map(item => item.id)).toEqual([
      'vol-current',
      'vol-old',
      'vol-undated',
    ]);
  });

  it('builds a monolingual draft from the selected bilingual language', () => {
    const bilingualDraft = createBilingualDraftFromDraft(createArabicDraft(), 'ar');
    bilingualDraft.summary = updateLocalizedFieldValue(bilingualDraft.summary, 'en', 'Senior mobile engineer');

    const englishDraft = buildDraftForLanguage(bilingualDraft, 'en');

    expect(englishDraft.summary).toBe('Senior mobile engineer');
    expect(englishDraft.fullName).toBe('');
    expect(englishDraft.contact.email).toBe('ahmed.saleh@example.com');
    expect(englishDraft.certifications).toHaveLength(1);
  });

  it('syncs the bilingual draft into English with editable translated values', async () => {
    const bilingualDraft = createBilingualDraftFromDraft(createArabicDraft(), 'ar');

    mockedTranslationModule.translateBatch.mockResolvedValue([
      'Ahmed Saleh',
      'Riyadh, Saudi Arabia',
      'Senior Software Engineer',
      'Senior mobile engineer',
      'Lead React Native Developer',
      'Tanami Digital Solutions',
      '2023 - Present',
      'Built Arabic-first apps.',
      'Computer Science',
      'King Saud University',
      'TypeScript',
      'Mobile Development Certificate',
      'Training Platform',
      'Intensive applied program.',
      'Technical Organizer',
      'Developers Community',
      'Coordinated free workshops.',
    ]);

    const result = await syncDraftForLanguage(bilingualDraft, {
      sourceLanguage: 'ar',
      targetLanguage: 'en',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sync.updatedFieldIds).toContain('fullName');
      expect(result.draft.editingLanguage).toBe('en');
      expect(result.draft.fullName.en).toBe('Ahmed Saleh');
      expect(result.draft.contact.email.en).toBe('ahmed.saleh@example.com');
      expect(result.draft.contact.address.en).toBe('Riyadh, Saudi Arabia');
      expect(result.draft.contact.title.en).toBe('Senior Software Engineer');
      expect(result.draft.summary.en).toBe('Senior mobile engineer');
      expect(result.draft.certifications[0].name.en).toBe('Mobile Development Certificate');
      expect(result.draft.volunteerExperiences[0].role.en).toBe('Technical Organizer');
      expect(result.draft.education[0].year.en).toBe('2020');
      expect(result.draft.certifications[0].date.en).toBe('2024');
      expect(result.draft.summary.syncState).toBe('auto_populated');
    }
  });

  it('propagates the latest edited English value back into Arabic on the next switch', async () => {
    const bilingualDraft = createBilingualDraftFromDraft(createArabicDraft(), 'ar');
    mockedTranslationModule.translateBatch.mockResolvedValue([
      'Ahmed Saleh',
      'Riyadh, Saudi Arabia',
      'Senior Software Engineer',
      'Senior mobile engineer',
      'Lead React Native Developer',
      'Tanami Digital Solutions',
      '2023 - Present',
      'Built Arabic-first apps.',
      'Computer Science',
      'King Saud University',
      'TypeScript',
      'Mobile Development Certificate',
      'Training Platform',
      'Intensive applied program.',
      'Technical Organizer',
      'Developers Community',
      'Coordinated free workshops.',
    ]);

    const englishResult = await syncDraftForLanguage(bilingualDraft, {
      sourceLanguage: 'ar',
      targetLanguage: 'en',
    });

    expect(englishResult.ok).toBe(true);
    if (!englishResult.ok) {
      return;
    }

    const editedEnglishDraft = {
      ...englishResult.draft,
      summary: updateLocalizedFieldValue(
        englishResult.draft.summary,
        'en',
        'Principal mobile engineer with bilingual CV workflow expertise',
      ),
    };

    mockedTranslationModule.translateBatch.mockResolvedValue([
      'مهندس جوال رئيسي بخبرة في إدارة سير ذاتية ثنائية اللغة',
    ]);

    const arabicResult = await syncDraftForLanguage(editedEnglishDraft, {
      sourceLanguage: 'en',
      targetLanguage: 'ar',
    });

    expect(arabicResult.ok).toBe(true);
    if (arabicResult.ok) {
      expect(arabicResult.draft.summary.ar).toBe(
        'مهندس جوال رئيسي بخبرة في إدارة سير ذاتية ثنائية اللغة',
      );
      expect(arabicResult.draft.summary.lastEditedLanguage).toBe('en');
    }
  });

  it('preserves protected text and reports failed field syncs without clearing the draft', async () => {
    const bilingualDraft = createBilingualDraftFromDraft(
      {
        fullName: 'أحمد صالح',
        contact: {
          email: 'ahmed.saleh@example.com',
          phone: '+966500000000',
          address: 'الرياض',
          title: 'مهندس برمجيات',
        },
        summary: 'ملخص مهني',
        experiences: [],
        education: [],
        skills: [{ id: 'skill-1', value: 'API' }],
        certifications: [],
        volunteerExperiences: [],
      },
      'ar',
    );

    mockedTranslationModule.translateBatch.mockRejectedValue(new Error('sync failed'));

    const result = await syncDraftForLanguage(bilingualDraft, {
      sourceLanguage: 'ar',
      targetLanguage: 'en',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('field_sync_failed');
      expect(result.draft.editingLanguage).toBe('en');
      expect(result.draft.skills[0].value.en).toBe('API');
      expect(result.draft.skills[0].value.syncState).toBe('preserved');
      expect(result.failedFieldIds).toContain('summary');
      expect(result.draft.summary.syncState).toBe('failed');
    }
  });

  it('lets a field stay preserved when the user keeps the current target wording', async () => {
    const bilingualDraft = createBilingualDraftFromDraft(
      {
        fullName: 'أحمد صالح',
        contact: {
          email: 'ahmed.saleh@example.com',
          phone: '+966500000000',
          address: 'الرياض',
          title: 'مهندس برمجيات',
        },
        summary: 'ملخص مهني',
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        volunteerExperiences: [],
      },
      'ar',
    );
    const preservedDraft = {
      ...bilingualDraft,
      summary: preserveLocalizedField(
        updateLocalizedFieldValue(bilingualDraft.summary, 'en', 'Kept English summary'),
      ),
    };

    mockedTranslationModule.translateBatch.mockResolvedValue(['Ahmed Saleh']);

    const result = await syncDraftForLanguage(preservedDraft, {
      sourceLanguage: 'ar',
      targetLanguage: 'en',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.summary.en).toBe('Kept English summary');
      expect(result.sync.preservedFieldIds).toContain('summary');
    }
  });

  it('uses the installed PDF module API to generate the file artifact from the selected language draft', async () => {
    mockedGeneratePDF.mockResolvedValue({ filePath: '/tmp/cv-en-Ahmed-Saleh.pdf' });

    const result = await generateCV(
      {
        fullName: 'Ahmed Saleh',
        contact: {
          email: 'ahmed.saleh@example.com',
          phone: '+966500000000',
          address: 'Riyadh',
          title: 'Senior Software Engineer',
        },
        summary: 'Senior mobile engineer',
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        volunteerExperiences: [],
      },
      { isAuthenticated: true },
      { outputLanguage: 'en' },
    );

    expect(mockedGeneratePDF).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'cv-en-Ahmed-Saleh',
        directory: 'Documents',
        html: expect.stringContaining('Objective'),
      }),
    );
    expect(result).toEqual({
      ok: true,
      artifact: {
        fileName: 'cv-en-Ahmed-Saleh',
        filePath: '/tmp/cv-en-Ahmed-Saleh.pdf',
        mimeType: 'application/pdf',
        language: 'en',
        status: 'generated',
        lastError: null,
      },
    });
  });

  it('applies ATS export ordering before rendering the PDF HTML', async () => {
    mockedGeneratePDF.mockResolvedValue({ filePath: '/tmp/cv-en-Ahmed-Saleh.pdf' });

    await generateCV(
      {
        fullName: 'Ahmed Saleh',
        contact: {
          email: 'ahmed.saleh@example.com',
          phone: '+966500000000',
          address: 'Riyadh',
          title: 'Senior Software Engineer',
        },
        summary: 'Senior mobile engineer',
        experiences: [
          {
            id: 'exp-old',
            title: 'Older Role',
            organization: 'Org 1',
            duration: '2019 - 2021',
            description: 'Older experience',
          },
          {
            id: 'exp-current',
            title: 'Current Role',
            organization: 'Org 2',
            duration: '2023 - Present',
            description: 'Current experience',
          },
        ],
        education: [],
        skills: [
          { id: 'skill-1', value: 'React Native' },
          { id: 'skill-2', value: 'react native' },
          { id: 'skill-3', value: 'TypeScript' },
        ],
        certifications: [
          { id: 'cert-old', name: 'Older Cert', issuer: 'Platform', date: '2024', details: '' },
          { id: 'cert-new', name: 'Newer Cert', issuer: 'Platform', date: '2025', details: '' },
        ],
        volunteerExperiences: [],
      },
      { isAuthenticated: true },
      { outputLanguage: 'en' },
    );

    const html = mockedGeneratePDF.mock.calls[0]?.[0]?.html ?? '';

    expect(html.indexOf('Current Role')).toBeLessThan(html.indexOf('Older Role'));
    expect(html.indexOf('Newer Cert')).toBeLessThan(html.indexOf('Older Cert'));
    expect(html).toContain('<ul class="ats-bullets"><li>React Native</li><li>TypeScript</li></ul>');
  });

  it('merges account defaults into missing bilingual name and contact values without overwriting edits', () => {
    const bilingualDraft = createBilingualDraftFromDraft(
      {
        fullName: '',
        contact: { email: '', phone: '', address: '', title: '' },
        summary: 'ملخص مهني',
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        volunteerExperiences: [],
      },
      'ar',
    );

    const editedDraft = {
      ...bilingualDraft,
      summary: updateLocalizedFieldValue(bilingualDraft.summary, 'en', 'Edited summary'),
    };

    const mergedDraft = mergeDraftWithProfileDefaults(editedDraft, {
      fullNameAr: 'أحمد صالح',
      fullNameEn: 'Ahmed Saleh',
      email: 'ahmed.saleh@example.com',
      phone: '+966500000000',
      addressAr: 'الرياض',
      addressEn: 'Riyadh',
      titleAr: 'مهندس برمجيات',
      titleEn: 'Software Engineer',
    });

    expect(mergedDraft.fullName.ar).toBe('أحمد صالح');
    expect(mergedDraft.fullName.en).toBe('Ahmed Saleh');
    expect(mergedDraft.contact.email.ar).toBe('ahmed.saleh@example.com');
    expect(mergedDraft.contact.email.en).toBe('ahmed.saleh@example.com');
    expect(mergedDraft.contact.address.en).toBe('Riyadh');
    expect(mergedDraft.summary.en).toBe('Edited summary');
  });

  it('saves and reloads the bilingual draft snapshot for the authenticated profile on device', async () => {
    const bilingualDraft = createBilingualDraftFromDraft(createArabicDraft(), 'ar');
    mockedAsyncStorage.setItem.mockResolvedValue();
    mockedAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        profileId: 77,
        userId: 12,
        savedAt: '2026-04-17T12:00:00.000Z',
        draft: bilingualDraft,
      }),
    );

    await saveStoredCVDraft(bilingualDraft, 77, 12);
    const restored = await loadStoredCVDraft(77, 12);

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      'cv_bilingual_draft:profile:77',
      expect.stringContaining('"profileId":77'),
    );
    expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('cv_bilingual_draft:profile:77');
    expect(restored?.draft.fullName.ar).toBe('أحمد صالح');
    expect(restored?.draft.contact.email.ar).toBe('ahmed.saleh@example.com');
  });

  it('upgrades legacy bilingual drafts that predate the LinkedIn contact field', () => {
    const bilingualDraft = createBilingualDraftFromDraft(createArabicDraft(), 'ar');
    const legacyDraft = {
      ...bilingualDraft,
      contact: {
        email: bilingualDraft.contact.email,
        phone: bilingualDraft.contact.phone,
        address: bilingualDraft.contact.address,
        title: bilingualDraft.contact.title,
      },
    } as typeof bilingualDraft;

    const upgraded = upgradeBilingualDraft(legacyDraft);

    expect(upgraded.contact.linkedin).toEqual(
      expect.objectContaining({
        ar: '',
        en: '',
        lastEditedLanguage: 'ar',
      }),
    );
  });

  it('copies generated PDFs into cache before opening the Android share sheet', async () => {
    mockedRNFS.exists.mockImplementation(async path => path === '/generated/cv-أحمد-صالح.pdf');
    mockedRNFS.copyFile.mockResolvedValue();
    mockedShareOpen.mockResolvedValue({
      success: true,
      message: 'OK',
    });

    const result = await exportGeneratedCV(
      {
        fileName: 'cv-أحمد-صالح',
        filePath: '/generated/cv-أحمد-صالح.pdf',
        mimeType: 'application/pdf',
        language: 'ar',
        status: 'generated',
        lastError: null,
      },
      'share',
    );

    expect(mockedRNFS.copyFile).toHaveBeenCalledWith(
      '/generated/cv-أحمد-صالح.pdf',
      '/cache/cv-أحمد-صالح.pdf',
    );
    expect(mockedShareOpen).toHaveBeenCalledWith({
      title: 'مشاركة السيرة الذاتية',
      url: 'file:///cache/cv-أحمد-صالح.pdf',
      type: 'application/pdf',
      filename: 'cv-أحمد-صالح.pdf',
      saveToFiles: false,
    });
    expect(result).toEqual({
      ok: true,
      status: 'exported',
      artifact: {
        fileName: 'cv-أحمد-صالح',
        filePath: '/generated/cv-أحمد-صالح.pdf',
        mimeType: 'application/pdf',
        language: 'ar',
        status: 'exported',
        lastError: null,
      },
    });
  });

  it('saves generated PDFs directly into device storage for the save action', async () => {
    mockedFileSaveModule.savePdfToDownloads.mockResolvedValue({
      destination: 'content://downloads/public_downloads/17',
      label: 'Downloads/TanamiTrain/cv-أحمد-صالح.pdf',
    });

    const result = await exportGeneratedCV(
      {
        fileName: 'cv-أحمد-صالح',
        filePath: '/generated/cv-أحمد-صالح.pdf',
        mimeType: 'application/pdf',
        language: 'ar',
        status: 'generated',
        lastError: null,
      },
      'save',
    );

    expect(mockedFileSaveModule.savePdfToDownloads).toHaveBeenCalledWith(
      '/generated/cv-أحمد-صالح.pdf',
      'cv-أحمد-صالح',
    );
    expect(mockedRNFS.copyFile).not.toHaveBeenCalled();
    expect(mockedShareOpen).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      status: 'exported',
      destination: 'Downloads/TanamiTrain/cv-أحمد-صالح.pdf',
      artifact: {
        fileName: 'cv-أحمد-صالح',
        filePath: '/generated/cv-أحمد-صالح.pdf',
        mimeType: 'application/pdf',
        language: 'ar',
        status: 'exported',
        lastError: null,
      },
    });
  });
});

describe('cvHtmlRenderer', () => {
  it('renders Arabic HTML with the same ATS visual system and local fonts', () => {
    const html = renderArabicCVHtml({
      fullName: 'أحمد صالح',
      contact: {
        email: 'ahmed.saleh@example.com',
        phone: '+966500000000',
        address: 'الرياض',
        title: 'مهندس برمجيات',
      },
      summary: 'مطوّر تطبيقات',
      experiences: [],
      education: [],
      skills: [{ id: '1', value: 'TypeScript & React Native' }],
      certifications: [
        { id: '2', name: 'شهادة', issuer: 'جهة', date: '2024', details: 'تفاصيل' },
      ],
      volunteerExperiences: [
        { id: '3', role: 'منظم', organization: 'مجتمع', duration: '2023', description: 'نشاط' },
      ],
    });

    expect(html).toContain('NotoKufiArabic-Regular');
    expect(html).toContain('الشهادات والدورات');
    expect(html).toContain('الخبرة التطوعية');
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('<h1>أحمد صالح</h1>');
    expect(html).toContain('<p class="ats-title">مهندس برمجيات</p>');
    expect(html).toContain('ahmed.saleh@example.com');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).toContain('TypeScript &amp; React Native');
    expect(html).toContain('border-bottom: 1px solid #1F4E79;');
    expect(html).toContain('margin-bottom: 9pt;');
    expect(html).toContain('break-inside: avoid-page');
    expect(html).not.toContain('column-count');
  });

  it('renders English HTML with the reference-matched ATS layout', () => {
    const html = renderEnglishCVHtml({
      fullName: 'Ahmed Saleh',
      contact: {
        email: 'ahmed.saleh@example.com',
        phone: '+966500000000',
        address: 'Riyadh',
        linkedin: 'https://www.linkedin.com/in/ahmed-saleh',
        title: 'Senior Software Engineer',
      },
      summary: 'Senior mobile engineer',
      experiences: [
        {
          id: 'exp-1',
          title: 'Senior Engineer',
          organization: 'Tanami',
          duration: '2024 - Present',
          description: 'Built mobile products',
        },
      ],
      education: [{ id: 'edu-1', degree: 'BSc Computer Science', institution: 'University', year: '2020' }],
      skills: [{ id: '1', value: 'TypeScript' }],
      certifications: [
        { id: '2', name: 'Mobile Certificate', issuer: 'Platform', date: '2024', details: 'Details' },
      ],
      volunteerExperiences: [
        { id: '3', role: 'Organizer', organization: 'Community', duration: '2023', description: 'Workshops' },
      ],
    });

    expect(html).toContain('<html lang="en" dir="ltr">');
    expect(html).toContain('Objective');
    expect(html).toContain('Education:');
    expect(html).toContain('Experiences:');
    expect(html).toContain('Professional Development');
    expect(html).toContain('Volunteer Experience');
    expect(html).toContain('<h1>Ahmed Saleh</h1>');
    expect(html).toContain('<p class="ats-title">Senior Software Engineer</p>');
    expect(html).toContain('Senior Software Engineer');
    expect(html).toContain('Email:</strong> ahmed.saleh@example.com');
    expect(html).toContain('Phone:</strong> +966500000000');
    expect(html).toContain('Address:</strong> Riyadh');
    expect(html).toContain('LinkedIn:</strong> https://www.linkedin.com/in/ahmed-saleh');
    expect(html).toContain("font-family: 'Roboto', Arial, sans-serif;");
    expect(html).toContain('font-size: 18pt;');
    expect(html).toContain('color: #1F4E79;');
    expect(html).toContain('border-bottom: 1px solid #1F4E79;');
    expect(html).toContain('margin-bottom: 9pt;');
    expect(html).toContain('<ul class="ats-bullets"><li>TypeScript</li></ul>');
    expect(html.indexOf('Education')).toBeLessThan(html.indexOf('Experiences'));
    expect(html.indexOf('Professional Development')).toBeLessThan(html.indexOf('Skills'));
    expect(html).toContain('break-inside: avoid-page');
    expect(html).not.toContain('column-count');
  });

  it('omits missing English contact values cleanly in the reference-matched header', () => {
    const html = renderEnglishCVHtml({
      fullName: 'Ahmed Saleh',
      contact: {
        email: 'ahmed.saleh@example.com',
        phone: '',
        address: '',
        linkedin: '',
        title: 'Senior Software Engineer',
      },
      summary: '',
      experiences: [],
      education: [],
      skills: [],
      certifications: [],
      volunteerExperiences: [],
    });

    expect(html).toContain('<h1>Ahmed Saleh</h1>');
    expect(html).toContain('<p class="ats-title">Senior Software Engineer</p>');
    expect(html).toContain('Email:</strong> ahmed.saleh@example.com');
    expect(html).not.toContain('Phone:</strong>');
    expect(html).not.toContain('Address:</strong>');
    expect(html).not.toContain('LinkedIn:</strong>');
    expect(html).not.toContain(',,');
  });
});
