jest.mock('react-native-html-to-pdf', () => ({
  __esModule: true,
  generatePDF: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  TemporaryDirectoryPath: '/tmp',
  exists: jest.fn(),
  unlink: jest.fn(),
  copyFile: jest.fn(),
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));

import { NativeModules } from 'react-native';
import { renderArabicCVHtml, renderEnglishCVHtml } from '../src/services/cvHtmlRenderer';
import { generatePDF } from 'react-native-html-to-pdf';
import * as RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { exportGeneratedCV, generateCV, prepareCVDraft, sanitizeCvFileName } from '../src/services/cvService';

const mockedGeneratePDF = jest.mocked(generatePDF);
const mockedRNFS = jest.mocked(RNFS);
const mockedShareOpen = jest.mocked(Share.open);
type TranslationModuleMock = {
  getAvailability: jest.Mock;
  translateBatch: jest.Mock;
};

const mockedTranslationModule: TranslationModuleMock = {
  getAvailability: jest.fn(),
  translateBatch: jest.fn(),
};

describe('cvService helpers', () => {
  beforeEach(() => {
    mockedGeneratePDF.mockReset();
    mockedRNFS.exists.mockReset();
    mockedRNFS.unlink.mockReset();
    mockedRNFS.copyFile.mockReset();
    mockedShareOpen.mockReset();
    mockedTranslationModule.getAvailability.mockReset();
    mockedTranslationModule.translateBatch.mockReset();
    mockedTranslationModule.getAvailability.mockResolvedValue({ supported: true });
    (NativeModules as Record<string, unknown>).CVTranslationModule = mockedTranslationModule;
  });

  it('requires a full name before generation', () => {
    const result = prepareCVDraft(
      {
        fullName: '   ',
        summary: '',
        experiences: [],
        education: [],
        skills: [],
      },
      { isAuthenticated: true },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('missing_full_name');
    }
  });

  it('filters empty rows and trims values', () => {
    const result = prepareCVDraft(
      {
        fullName: '  أحمد صالح  ',
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
      },
      { isAuthenticated: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.fullName).toBe('أحمد صالح');
      expect(result.draft.summary).toBe('مطور تطبيقات React Native');
      expect(result.draft.experiences).toHaveLength(1);
      expect(result.draft.experiences[0].organization).toBe('شركة تنامي');
      expect(result.draft.skills).toEqual([{ id: '4', value: 'TypeScript' }]);
    }
  });

  it('sanitizes filenames without dropping Arabic names', () => {
    expect(sanitizeCvFileName(' أحمد/صالح: Senior Dev ')).toBe('cv-أحمد-صالح-Senior-Dev');
  });

  it('uses the installed PDF module API to generate the file artifact', async () => {
    mockedGeneratePDF.mockResolvedValue({ filePath: '/tmp/cv-أحمد-صالح.pdf' });

    const result = await generateCV(
      {
        fullName: 'أحمد صالح',
        summary: '',
        experiences: [],
        education: [],
        skills: [],
      },
      { isAuthenticated: true },
    );

    expect(mockedGeneratePDF).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'cv-أحمد-صالح',
        directory: 'Documents',
      }),
    );
    expect(result).toEqual({
      ok: true,
      artifact: {
        fileName: 'cv-أحمد-صالح',
        filePath: '/tmp/cv-أحمد-صالح.pdf',
        mimeType: 'application/pdf',
        language: 'ar',
        status: 'generated',
        lastError: null,
      },
    });
  });

  it('translates the Arabic draft on-device before generating the English PDF', async () => {
    mockedGeneratePDF.mockResolvedValue({ filePath: '/tmp/cv-en-أحمد-صالح.pdf' });
    mockedTranslationModule.translateBatch.mockResolvedValue([
      'Senior mobile engineer',
      'Lead React Native Developer',
      'Tanami Digital Solutions',
      '2023 - Present',
      'Built Arabic-first mobile products.',
      'Computer Science',
      'King Saud University',
      '2020',
      'TypeScript',
    ]);

    const result = await generateCV(
      {
        fullName: 'أحمد صالح',
        summary: 'مهندس جوال أول',
        experiences: [
          {
            id: '1',
            title: 'مطور React Native أول',
            organization: 'شركة تنامي للحلول الرقمية',
            duration: '2023 - حتى الآن',
            description: 'بناء تطبيقات عربية.',
          },
        ],
        education: [{ id: '2', degree: 'علوم الحاسب', institution: 'جامعة الملك سعود', year: '2020' }],
        skills: [{ id: '3', value: 'تايب سكربت' }],
      },
      { isAuthenticated: true },
      { outputLanguage: 'en' },
    );

    expect(mockedTranslationModule.getAvailability).toHaveBeenCalledWith('ar', 'en');
    expect(mockedTranslationModule.translateBatch).toHaveBeenCalled();
    expect(mockedGeneratePDF).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'cv-en-أحمد-صالح',
        html: expect.stringContaining('Professional Summary'),
      }),
    );
    expect(result).toEqual({
      ok: true,
      artifact: {
        fileName: 'cv-en-أحمد-صالح',
        filePath: '/tmp/cv-en-أحمد-صالح.pdf',
        mimeType: 'application/pdf',
        language: 'en',
        status: 'generated',
        lastError: null,
      },
    });
  });

  it('returns a translation-specific error when English generation is unavailable', async () => {
    mockedTranslationModule.getAvailability.mockResolvedValue({
      supported: false,
      reason: 'platform_unsupported',
      message: 'النسخة الإنجليزية غير متاحة على هذا الجهاز.',
    });

    const result = await generateCV(
      {
        fullName: 'أحمد صالح',
        summary: 'ملخص',
        experiences: [],
        education: [],
        skills: [],
      },
      { isAuthenticated: true },
      { outputLanguage: 'en' },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'translation_unavailable',
        message: 'النسخة الإنجليزية غير متاحة على هذا الجهاز.',
        retryable: false,
        stage: 'translation',
      },
    });
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
});

describe('renderArabicCVHtml', () => {
  it('renders local-font HTML without remote dependencies', () => {
    const html = renderArabicCVHtml({
      fullName: 'أحمد صالح',
      summary: 'مطوّر تطبيقات',
      experiences: [],
      education: [],
      skills: [{ id: '1', value: 'TypeScript & React Native' }],
    });

    expect(html).toContain('NotoKufiArabic-Regular');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).toContain('TypeScript &amp; React Native');
  });

  it('renders English HTML with LTR structure and local copy', () => {
    const html = renderEnglishCVHtml({
      fullName: 'أحمد صالح',
      summary: 'Senior mobile engineer',
      experiences: [],
      education: [],
      skills: [{ id: '1', value: 'TypeScript' }],
    });

    expect(html).toContain('<html lang="en" dir="ltr">');
    expect(html).toContain('Professional Summary');
    expect(html).toContain('font-family: \'Helvetica Neue\', Arial, sans-serif;');
  });
});
