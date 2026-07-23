import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import AppLoading from '../components/AppLoading';
import ThemedBackground from '../components/ThemedBackground';
import {
  buildDraftForLanguage,
  createBilingualDraftFromDraft,
  createEmptyBilingualDraft,
  createLocalizedField,
  exportGeneratedCV,
  generateCV,
  getTranslationAvailability,
  mergeDraftWithProfileDefaults,
  preserveLocalizedField,
  syncDraftForLanguage,
  upgradeBilingualDraft,
  updateLocalizedFieldValue,
  type CVBilingualCertification,
  type CVBilingualContactSection,
  type CVBilingualDraft,
  type CVBilingualEducation,
  type CVBilingualExperience,
  type CVBilingualSkill,
  type CVBilingualVolunteerExperience,
  type CVDraftSyncOptions,
  type CVLocalizedField,
  type CVOperationError,
  type CVOutputLanguage,
  type CVProfileDefaults,
  type CVTranslationAvailability,
  type GeneratedCVArtifact,
} from '../../services/cvService';
import { loadStoredCVDraft, saveStoredCVDraft } from '../../storage/cvDraftStorage';

const COLORS = {
  green: '#0f4f30',
  greenDark: '#0c2a20',
  gold: '#cbae82',
  sand: '#fff8ef',
  cream: '#fbf3e7',
  sage: '#e8f1ea',
  border: '#e6e2d8',
  ink: '#151515',
  muted: '#6b7280',
  white: '#ffffff',
  danger: '#d9534f',
};

const LANGUAGE_COPY = {
  ar: {
    pageDescription:
      'حرّر السيرة الذاتية بالعربية أو الإنجليزية من نفس المسودة. عند تبديل اللغة ستتم مزامنة الحقول القابلة للترجمة تلقائياً، ويمكنك تعديل أي قيمة يدوياً قبل التصدير.',
    languageLabel: 'لغة التحرير والتصدير',
    languageHelper:
      'اللغة المحددة هنا هي اللغة الظاهرة في النموذج حالياً، وهي نفسها اللغة المستخدمة عند إنشاء ملف PDF.',
    languageOptionArabicTitle: 'العربية',
    languageOptionArabicText: 'اللغة الافتراضية للمسودة',
    languageOptionEnglishTitle: 'English',
    languageOptionEnglishText: 'يمكن تعديلها مباشرة بعد المزامنة',
    sampleModeButton: 'تعبئة بيانات تجريبية',
    sampleModeHint: 'للاختبار فقط: يعيد تعبئة الحقول بسيرة ذاتية وهمية.',
    sampleModeLoaded: 'تمت تعبئة الحقول ببيانات سيرة ذاتية تجريبية.',
    fullNameLabel: 'الاسم الكامل',
    fullNamePlaceholder: 'أدخل اسمك الكامل',
    contactTitle: 'معلومات التواصل',
    contactEmailLabel: 'البريد الإلكتروني',
    contactPhoneLabel: 'رقم الجوال',
    contactAddressLabel: 'العنوان',
    contactLinkedinLabel: 'رابط لينكدإن',
    contactJobTitleLabel: 'المسمى المهني',
    summaryLabel: 'الملخص المهني',
    summaryPlaceholder: 'اكتب نبذة قصيرة عن خبراتك أو أهدافك المهنية',
    experiencesTitle: 'الخبرات',
    experienceTitleLabel: 'المسمى الوظيفي',
    experienceOrgLabel: 'جهة العمل',
    experienceDurationLabel: 'المدة (مثال: 2020 - 2023)',
    experienceDescriptionLabel: 'الوصف (اختياري)',
    educationTitle: 'التعليم',
    educationDegreeLabel: 'الدرجة العلمية',
    educationInstitutionLabel: 'المؤسسة / الجامعة',
    educationYearLabel: 'سنة التخرج',
    skillsTitle: 'المهارات',
    skillsPlaceholder: 'أدخل مهارة',
    certificationsTitle: 'الشهادات والدورات',
    certificationNameLabel: 'اسم الشهادة أو الدورة',
    certificationIssuerLabel: 'الجهة المانحة',
    certificationDateLabel: 'التاريخ',
    certificationDetailsLabel: 'تفاصيل إضافية (اختياري)',
    volunteerTitle: 'الخبرة التطوعية',
    volunteerRoleLabel: 'الدور التطوعي',
    volunteerOrgLabel: 'الجهة',
    volunteerDurationLabel: 'المدة',
    volunteerDescriptionLabel: 'وصف العمل التطوعي',
    addButton: 'إضافة',
    successReadyTitle: 'الملف جاهز',
    statusTitle: 'حالة العملية',
    errorTitle: 'تعذر إكمال العملية',
    shareButtonLabel: 'مشاركة النسخة',
    saveButtonLabel: 'حفظ النسخة',
    savedLocationTitle: 'تم حفظ الملف في',
    saveInProgress: 'جارٍ حفظ الملف على الجهاز...',
    shareInProgress: 'جارٍ تجهيز المشاركة...',
    saveSuccessAlertTitle: 'تم حفظ الملف',
    generateArabic: 'إنشاء النسخة العربية',
    regenerateArabic: 'إعادة إنشاء النسخة العربية',
    generateEnglish: 'إنشاء النسخة الإنجليزية',
    retryButton: 'إعادة المحاولة',
    fieldAuto: 'تمت تعبئة هذه القيمة تلقائياً من النسخة الأخرى ويمكنك تعديلها.',
    fieldPreserved: 'تم الإبقاء على هذه القيمة الحالية دون استبدالها تلقائياً.',
    fieldFailed: 'تعذر مزامنة هذا الحقل تلقائياً. يمكنك تعديله يدوياً.',
    sectionHint:
      'الحد الأدنى المطلوب هو الاسم الكامل. بقية الأقسام اختيارية ويمكن استكمالها في أي لغة ثم مزامنتها عند التبديل.',
  },
  en: {
    pageDescription:
      'Edit the resume in Arabic or English from the same draft. Switching languages syncs translatable fields automatically, and every visible value remains editable before export.',
    languageLabel: 'Editing and export language',
    languageHelper:
      'The selected language controls the visible form fields and is also used for PDF generation.',
    languageOptionArabicTitle: 'العربية',
    languageOptionArabicText: 'Default draft language',
    languageOptionEnglishTitle: 'English',
    languageOptionEnglishText: 'Editable after sync',
    sampleModeButton: 'Load sample CV',
    sampleModeHint: 'Testing only: refill the form with dummy resume data.',
    sampleModeLoaded: 'The form was refilled with sample CV data.',
    fullNameLabel: 'Full name',
    fullNamePlaceholder: 'Enter your full name',
    contactTitle: 'Contact',
    contactEmailLabel: 'Email',
    contactPhoneLabel: 'Phone',
    contactAddressLabel: 'Address',
    contactLinkedinLabel: 'LinkedIn profile link',
    contactJobTitleLabel: 'Professional title',
    summaryLabel: 'Professional summary',
    summaryPlaceholder: 'Write a short professional summary',
    experiencesTitle: 'Experience',
    experienceTitleLabel: 'Job title',
    experienceOrgLabel: 'Organization',
    experienceDurationLabel: 'Duration (e.g. 2020 - 2023)',
    experienceDescriptionLabel: 'Description (optional)',
    educationTitle: 'Education',
    educationDegreeLabel: 'Degree',
    educationInstitutionLabel: 'Institution / University',
    educationYearLabel: 'Graduation year',
    skillsTitle: 'Skills',
    skillsPlaceholder: 'Enter a skill',
    certificationsTitle: 'Certifications and Courses',
    certificationNameLabel: 'Certification or course name',
    certificationIssuerLabel: 'Issuer',
    certificationDateLabel: 'Date',
    certificationDetailsLabel: 'Additional details (optional)',
    volunteerTitle: 'Volunteer Experience',
    volunteerRoleLabel: 'Volunteer role',
    volunteerOrgLabel: 'Organization',
    volunteerDurationLabel: 'Duration',
    volunteerDescriptionLabel: 'Description',
    addButton: 'Add',
    successReadyTitle: 'File ready',
    statusTitle: 'Status',
    errorTitle: 'Unable to complete the action',
    shareButtonLabel: 'Share copy',
    saveButtonLabel: 'Save copy',
    savedLocationTitle: 'Saved to',
    saveInProgress: 'Saving the file to device storage...',
    shareInProgress: 'Preparing share options...',
    saveSuccessAlertTitle: 'File saved',
    generateArabic: 'Generate Arabic PDF',
    regenerateArabic: 'Regenerate Arabic PDF',
    generateEnglish: 'Generate English PDF',
    retryButton: 'Retry',
    fieldAuto: 'This value was auto-populated from the other language and can still be edited.',
    fieldPreserved: 'This value was intentionally kept without automatic replacement.',
    fieldFailed: 'This field could not be synced automatically. You can edit it manually.',
    sectionHint:
      'Full name is the minimum required field. All other sections are optional and can be completed in either language.',
  },
} as const;

const DEV_SAMPLE_DRAFT = createBilingualDraftFromDraft(
  {
    fullName: 'أحمد صالح العتيبي',
    contact: {
      email: 'ahmed.saleh@example.com',
      phone: '+966500000000',
      address: 'الرياض، المملكة العربية السعودية',
      linkedin: 'https://www.linkedin.com/in/ahmed-saleh',
      title: 'مهندس برمجيات أول',
    },
    summary:
      'مهندس برمجيات متخصص في تطوير تطبيقات الجوال باستخدام React Native وTypeScript، مع خبرة في تحسين الأداء، دعم العربية وRTL، وبناء واجهات قابلة للقراءة من أنظمة تتبع المتقدمين.',
    experiences: [
      {
        id: 'dev-exp-1',
        title: 'مطور React Native أول',
        organization: 'شركة تنامي للحلول الرقمية',
        duration: '2023 - حتى الآن',
        description:
          'تطوير تطبيقات جوال عربية متعددة الشاشات، تحسين زمن الإقلاع، بناء خدمات تصدير PDF، والتكامل مع واجهات برمجة التطبيقات ونظم المصادقة.',
      },
    ],
    education: [
      {
        id: 'dev-edu-1',
        degree: 'بكالوريوس علوم الحاسب',
        institution: 'جامعة الملك سعود',
        year: '2020',
      },
    ],
    skills: [
      { id: 'dev-skill-1', value: 'React Native' },
      { id: 'dev-skill-2', value: 'TypeScript' },
      { id: 'dev-skill-3', value: 'RTL Layout' },
    ],
    certifications: [
      {
        id: 'dev-cert-1',
        name: 'شهادة تطوير تطبيقات الجوال',
        issuer: 'منصة تدريبية',
        date: '2024',
        details: 'تركز على أفضل الممارسات في بناء تطبيقات React Native.',
      },
    ],
    volunteerExperiences: [
      {
        id: 'dev-vol-1',
        role: 'منظم تقني',
        organization: 'مجتمع المطورين',
        duration: '2023',
        description: 'تنسيق ورش عمل تقنية مجانية للطلاب وحديثي التخرج.',
      },
    ],
  },
  'ar',
);

const INITIAL_DRAFT = __DEV__ ? DEV_SAMPLE_DRAFT : createEmptyBilingualDraft('ar');

function cloneDevSampleDraft(): CVBilingualDraft {
  return JSON.parse(JSON.stringify(DEV_SAMPLE_DRAFT)) as CVBilingualDraft;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFieldValue(field: CVLocalizedField, language: CVOutputLanguage): string {
  return language === 'ar' ? field.ar : field.en;
}

function getLanguageLabel(language: CVOutputLanguage): string {
  return language === 'en' ? 'English' : 'العربية';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function buildProfileDefaults(
  profile: ReturnType<typeof useAuth>['profile'],
  phone: string | null | undefined,
  displayName: string | null,
): CVProfileDefaults {
  return {
    fullNameAr: profile?.fullname_ar ?? displayName ?? null,
    fullNameEn: profile?.fullname_en ?? null,
    email: profile?.email ?? null,
    phone: phone ?? null,
    addressAr: profile?.address_ar ?? null,
    addressEn: profile?.address_en ?? null,
    titleAr: profile?.title_ar ?? null,
    titleEn: profile?.title_en ?? null,
  };
}

export default function CVFormScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { displayName, isAuthenticated, loading, profile, user } = useAuth();

  const [draft, setDraft] = useState<CVBilingualDraft>(() =>
    __DEV__ ? cloneDevSampleDraft() : createEmptyBilingualDraft('ar'),
  );
  const [artifact, setArtifact] = useState<GeneratedCVArtifact | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<CVOperationError | null>(null);
  const [busyStage, setBusyStage] = useState<'sync' | 'generation' | 'export' | null>(null);
  const [activeExportAction, setActiveExportAction] = useState<'share' | 'save' | null>(null);
  const [lastExportAction, setLastExportAction] = useState<'share' | 'save' | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [savedLocation, setSavedLocation] = useState<string | null>(null);
  const [pairAvailability, setPairAvailability] = useState<CVTranslationAvailability | null>(null);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<CVDraftSyncOptions | null>(null);
  const [isDraftHydrated, setDraftHydrated] = useState(false);

  const [isExpExpanded, setExpExpanded] = useState(INITIAL_DRAFT.experiences.length > 0);
  const [isEduExpanded, setEduExpanded] = useState(INITIAL_DRAFT.education.length > 0);
  const [isSkillsExpanded, setSkillsExpanded] = useState(INITIAL_DRAFT.skills.length > 0);
  const [isCertExpanded, setCertExpanded] = useState(INITIAL_DRAFT.certifications.length > 0);
  const [isVolunteerExpanded, setVolunteerExpanded] = useState(
    INITIAL_DRAFT.volunteerExperiences.length > 0,
  );

  const activeLanguage = draft.editingLanguage;
  const copy = LANGUAGE_COPY[activeLanguage];
  const isArabic = activeLanguage === 'ar';
  const languageTextStyle = isArabic ? styles.textArabic : styles.textEnglish;
  const languageInputStyle = isArabic ? styles.inputArabic : styles.inputEnglish;

  useEffect(() => {
    if (loading || !isAuthenticated) {
      return;
    }

    let mounted = true;

    const restoreDraft = async () => {
      try {
        const stored = await loadStoredCVDraft(profile?.id ?? null, user?.id ?? null);
        const fallbackDraft = __DEV__ ? cloneDevSampleDraft() : createEmptyBilingualDraft('ar');
        const defaults = buildProfileDefaults(profile, user?.username, displayName);
        const restoredDraft = stored?.draft ? upgradeBilingualDraft(stored.draft) : fallbackDraft;
        const nextDraft = mergeDraftWithProfileDefaults(restoredDraft, defaults);

        if (!mounted) {
          return;
        }

        setDraft(nextDraft);
        setExpExpanded(nextDraft.experiences.length > 0);
        setEduExpanded(nextDraft.education.length > 0);
        setSkillsExpanded(nextDraft.skills.length > 0);
        setCertExpanded(nextDraft.certifications.length > 0);
        setVolunteerExpanded(nextDraft.volunteerExperiences.length > 0);
        setDraftHydrated(true);
      } catch (error) {
        console.error('Failed to restore bilingual CV draft:', error);

        if (!mounted) {
          return;
        }

        const fallbackDraft = mergeDraftWithProfileDefaults(
          __DEV__ ? cloneDevSampleDraft() : createEmptyBilingualDraft('ar'),
          buildProfileDefaults(profile, user?.username, displayName),
        );

        setDraft(fallbackDraft);
        setDraftHydrated(true);
      }
    };

    setDraftHydrated(false);
    restoreDraft().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [displayName, isAuthenticated, loading, profile, profile?.id, user?.id, user?.username]);

  useEffect(() => {
    if (!isAuthenticated || !isDraftHydrated) {
      return;
    }

    const defaults = buildProfileDefaults(profile, user?.username, displayName);
    setDraft(current => mergeDraftWithProfileDefaults(current, defaults));
  }, [
    displayName,
    isAuthenticated,
    isDraftHydrated,
    profile?.address_ar,
    profile?.address_en,
    profile?.email,
    profile?.fullname_ar,
    profile?.fullname_en,
    profile?.title_ar,
    profile?.title_en,
    profile,
    user?.username,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isDraftHydrated) {
      return;
    }

    saveStoredCVDraft(draft, profile?.id ?? null, user?.id ?? null).catch(error => {
      console.error('Failed to persist bilingual CV draft:', error);
    });
  }, [draft, isAuthenticated, isDraftHydrated, profile?.id, user?.id]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigation.navigate('AuthStack', { screen: 'SignIn' });
    }
  }, [isAuthenticated, loading, navigation]);

  useEffect(() => {
    let mounted = true;

    getTranslationAvailability('ar', 'en')
      .then(result => {
        if (mounted) {
          setPairAvailability(result);
        }
      })
      .catch(error => {
        console.error('Translation availability failed:', error);

        if (mounted) {
          setPairAvailability({
            supported: false,
            reason: 'availability_check_failed',
            message: 'تعذر التحقق من توفر الترجمة التلقائية حالياً. يمكنك متابعة التحرير اليدوي.',
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (busyStage !== 'export' || !activeExportAction) {
      setExportProgress(0);
      return;
    }

    setExportProgress(14);

    const timer = setInterval(() => {
      setExportProgress(current => {
        if (current >= 88) {
          return current;
        }

        return current < 44 ? current + 14 : current + 7;
      });
    }, 160);

    return () => {
      clearInterval(timer);
    };
  }, [activeExportAction, busyStage]);

  const clearGeneratedState = () => {
    setArtifact(null);
    setStatusMessage(null);
    setOperationError(null);
    setSavedLocation(null);
    setActiveExportAction(null);
    setExportProgress(0);
  };

  const applyDraft = (nextDraft: CVBilingualDraft) => {
    clearGeneratedState();
    setDraft(nextDraft);
    setExpExpanded(nextDraft.experiences.length > 0);
    setEduExpanded(nextDraft.education.length > 0);
    setSkillsExpanded(nextDraft.skills.length > 0);
    setCertExpanded(nextDraft.certifications.length > 0);
    setVolunteerExpanded(nextDraft.volunteerExperiences.length > 0);
  };

  const updateDraft = (updater: (current: CVBilingualDraft) => CVBilingualDraft) => {
    clearGeneratedState();
    setDraft(current => updater(current));
  };

  const handleLoadSampleDraft = () => {
    if (!__DEV__ || busyStage !== null) {
      return;
    }

    const defaults = buildProfileDefaults(profile, user?.username, displayName);
    const sampleDraft = mergeDraftWithProfileDefaults(cloneDevSampleDraft(), defaults);

    applyDraft(sampleDraft);
    setStatusMessage(copy.sampleModeLoaded);
  };

  const updateRootField = (key: 'fullName' | 'summary', value: string) => {
    updateDraft(current => ({
      ...current,
      [key]: updateLocalizedFieldValue(current[key], current.editingLanguage, value),
    }));
  };

  const updateContactField = (fieldName: keyof CVBilingualContactSection, value: string) => {
    updateDraft(current => ({
      ...current,
      contact: {
        ...current.contact,
        [fieldName]: updateLocalizedFieldValue(current.contact[fieldName], current.editingLanguage, value),
      },
    }));
  };

  const updateExperienceField = (
    id: string,
    fieldName: keyof Omit<CVBilingualExperience, 'id'>,
    value: string,
  ) => {
    updateDraft(current => ({
      ...current,
      experiences: current.experiences.map(item =>
        item.id === id
          ? {
              ...item,
              [fieldName]: updateLocalizedFieldValue(item[fieldName], current.editingLanguage, value),
            }
          : item,
      ),
    }));
  };

  const updateEducationField = (
    id: string,
    fieldName: keyof Omit<CVBilingualEducation, 'id'>,
    value: string,
  ) => {
    updateDraft(current => ({
      ...current,
      education: current.education.map(item =>
        item.id === id
          ? {
              ...item,
              [fieldName]: updateLocalizedFieldValue(item[fieldName], current.editingLanguage, value),
            }
          : item,
      ),
    }));
  };

  const updateSkillField = (id: string, value: string) => {
    updateDraft(current => ({
      ...current,
      skills: current.skills.map(item =>
        item.id === id
          ? { ...item, value: updateLocalizedFieldValue(item.value, current.editingLanguage, value) }
          : item,
      ),
    }));
  };

  const updateCertificationField = (
    id: string,
    fieldName: keyof Omit<CVBilingualCertification, 'id'>,
    value: string,
  ) => {
    updateDraft(current => ({
      ...current,
      certifications: current.certifications.map(item =>
        item.id === id
          ? {
              ...item,
              [fieldName]: updateLocalizedFieldValue(item[fieldName], current.editingLanguage, value),
            }
          : item,
      ),
    }));
  };

  const updateVolunteerField = (
    id: string,
    fieldName: keyof Omit<CVBilingualVolunteerExperience, 'id'>,
    value: string,
  ) => {
    updateDraft(current => ({
      ...current,
      volunteerExperiences: current.volunteerExperiences.map(item =>
        item.id === id
          ? {
              ...item,
              [fieldName]: updateLocalizedFieldValue(item[fieldName], current.editingLanguage, value),
            }
          : item,
      ),
    }));
  };

  const addExperience = () => {
    updateDraft(current => ({
      ...current,
      experiences: [
        ...current.experiences,
        {
          id: createId('exp'),
          title: createLocalizedField('', current.editingLanguage),
          organization: createLocalizedField('', current.editingLanguage),
          duration: createLocalizedField('', current.editingLanguage),
          description: createLocalizedField('', current.editingLanguage),
        },
      ],
    }));
    setExpExpanded(true);
  };

  const addEducation = () => {
    updateDraft(current => ({
      ...current,
      education: [
        ...current.education,
        {
          id: createId('edu'),
          degree: createLocalizedField('', current.editingLanguage),
          institution: createLocalizedField('', current.editingLanguage),
          year: createLocalizedField('', current.editingLanguage),
        },
      ],
    }));
    setEduExpanded(true);
  };

  const addSkill = () => {
    updateDraft(current => ({
      ...current,
      skills: [
        ...current.skills,
        {
          id: createId('skill'),
          value: createLocalizedField('', current.editingLanguage),
        },
      ],
    }));
    setSkillsExpanded(true);
  };

  const addCertification = () => {
    updateDraft(current => ({
      ...current,
      certifications: [
        ...current.certifications,
        {
          id: createId('cert'),
          name: createLocalizedField('', current.editingLanguage),
          issuer: createLocalizedField('', current.editingLanguage),
          date: createLocalizedField('', current.editingLanguage),
          details: createLocalizedField('', current.editingLanguage),
        },
      ],
    }));
    setCertExpanded(true);
  };

  const addVolunteerExperience = () => {
    updateDraft(current => ({
      ...current,
      volunteerExperiences: [
        ...current.volunteerExperiences,
        {
          id: createId('volunteer'),
          role: createLocalizedField('', current.editingLanguage),
          organization: createLocalizedField('', current.editingLanguage),
          duration: createLocalizedField('', current.editingLanguage),
          description: createLocalizedField('', current.editingLanguage),
        },
      ],
    }));
    setVolunteerExpanded(true);
  };

  const removeExperience = (id: string) => {
    updateDraft(current => ({
      ...current,
      experiences: current.experiences.filter(item => item.id !== id),
    }));
  };

  const removeEducation = (id: string) => {
    updateDraft(current => ({
      ...current,
      education: current.education.filter(item => item.id !== id),
    }));
  };

  const removeSkill = (id: string) => {
    updateDraft(current => ({
      ...current,
      skills: current.skills.filter(item => item.id !== id),
    }));
  };

  const removeCertification = (id: string) => {
    updateDraft(current => ({
      ...current,
      certifications: current.certifications.filter(item => item.id !== id),
    }));
  };

  const removeVolunteerExperience = (id: string) => {
    updateDraft(current => ({
      ...current,
      volunteerExperiences: current.volunteerExperiences.filter(item => item.id !== id),
    }));
  };

  const preserveVisibleField = (
    collection:
      | 'root'
      | 'contact'
      | 'experiences'
      | 'education'
      | 'skills'
      | 'certifications'
      | 'volunteerExperiences',
    id: string | null,
    fieldName: string,
  ) => {
    updateDraft(current => {
      if (collection === 'root') {
        return {
          ...current,
          [fieldName]: preserveLocalizedField(current[fieldName as 'fullName' | 'summary']),
        };
      }

      if (collection === 'experiences') {
        return {
          ...current,
          experiences: current.experiences.map(item =>
            item.id === id
              ? {
                  ...item,
                  [fieldName]: preserveLocalizedField(
                    item[fieldName as keyof Omit<CVBilingualExperience, 'id'>],
                  ),
                }
              : item,
          ),
        };
      }

      if (collection === 'contact') {
        return {
          ...current,
          contact: {
            ...current.contact,
            [fieldName]: preserveLocalizedField(
              current.contact[fieldName as keyof CVBilingualContactSection],
            ),
          },
        };
      }

      if (collection === 'education') {
        return {
          ...current,
          education: current.education.map(item =>
            item.id === id
              ? {
                  ...item,
                  [fieldName]: preserveLocalizedField(
                    item[fieldName as keyof Omit<CVBilingualEducation, 'id'>],
                  ),
                }
              : item,
          ),
        };
      }

      if (collection === 'skills') {
        return {
          ...current,
          skills: current.skills.map(item =>
            item.id === id
              ? {
                  ...item,
                  [fieldName]: preserveLocalizedField(
                    item[fieldName as keyof Omit<CVBilingualSkill, 'id'>],
                  ),
                }
              : item,
          ),
        };
      }

      if (collection === 'certifications') {
        return {
          ...current,
          certifications: current.certifications.map(item =>
            item.id === id
              ? {
                  ...item,
                  [fieldName]: preserveLocalizedField(
                    item[fieldName as keyof Omit<CVBilingualCertification, 'id'>],
                  ),
                }
              : item,
          ),
        };
      }

      return {
        ...current,
        volunteerExperiences: current.volunteerExperiences.map(item =>
          item.id === id
            ? {
                ...item,
                [fieldName]: preserveLocalizedField(
                  item[fieldName as keyof Omit<CVBilingualVolunteerExperience, 'id'>],
                ),
              }
            : item,
        ),
      };
    });
  };

  const executeSyncAttempt = async (attempt: CVDraftSyncOptions, options?: { allowSameTarget?: boolean }) => {
    if (busyStage !== null) {
      return;
    }

    if (!options?.allowSameTarget && attempt.targetLanguage === draft.editingLanguage) {
      return;
    }

    clearGeneratedState();
    setLastSyncAttempt(attempt);
    setBusyStage('sync');

    const result = await syncDraftForLanguage(draft, attempt);

    setBusyStage(null);
    setDraft(result.draft);

    if (!result.ok) {
      setOperationError(result.error);
      setStatusMessage(
        result.failedFieldIds.length
          ? `تم التبديل إلى ${getLanguageLabel(attempt.targetLanguage)}، لكن بعض الحقول تحتاج إلى مراجعة أو تعديل يدوي.`
          : null,
      );
      return;
    }

    setStatusMessage(result.sync.message ?? null);
  };

  const handleLanguageSwitch = async (language: CVOutputLanguage) => {
    await executeSyncAttempt({
      sourceLanguage: draft.editingLanguage,
      targetLanguage: language,
    });
  };

  const handleGenerate = async () => {
    setBusyStage('generation');
    setStatusMessage(null);
    setOperationError(null);
    setSavedLocation(null);

    const result = await generateCV(
      buildDraftForLanguage(draft, draft.editingLanguage),
      {
        isAuthenticated,
        userId: user?.id ?? null,
        profileId: profile?.id ?? null,
        displayName,
      },
      {
        outputLanguage: draft.editingLanguage,
      },
    );

    setBusyStage(null);

    if (!result.ok) {
      setOperationError(result.error);
      return;
    }

    setArtifact(result.artifact);
    setStatusMessage(
      `${draft.editingLanguage === 'en' ? 'تم إنشاء النسخة الإنجليزية' : 'تم إنشاء النسخة العربية'} ${result.artifact.fileName}.pdf بنجاح.`,
    );
  };

  const handleExport = async (action: 'share' | 'save') => {
    if (!artifact) {
      return;
    }

    const exportStartedAt = Date.now();

    setBusyStage('export');
    setActiveExportAction(action);
    setLastExportAction(action);
    setExportProgress(12);
    setStatusMessage(action === 'save' ? copy.saveInProgress : copy.shareInProgress);
    setOperationError(null);
    setSavedLocation(null);

    const result = await exportGeneratedCV(artifact, action);
    const elapsed = Date.now() - exportStartedAt;
    const remainingProgressTime = Math.max(0, 700 - elapsed);

    if (remainingProgressTime > 0) {
      await delay(remainingProgressTime);
    }

    setBusyStage(null);
    setActiveExportAction(null);
    setArtifact(result.artifact);

    if (!result.ok) {
      setExportProgress(0);
      setOperationError(result.error);
      return;
    }

    setExportProgress(100);

    if (result.status === 'cancelled') {
      setStatusMessage(
        activeLanguage === 'en'
          ? action === 'save'
            ? 'The save dialog was closed without losing the generated file.'
            : 'The share sheet was closed without losing the generated file.'
          : action === 'save'
            ? 'تم إغلاق نافذة الحفظ دون فقدان الملف.'
            : 'تم إغلاق خيارات المشاركة دون فقدان الملف.',
      );
      return;
    }

    if (action === 'save' && result.destination) {
      setSavedLocation(result.destination);
      Alert.alert(copy.saveSuccessAlertTitle, result.destination);
    }

    setStatusMessage(
      activeLanguage === 'en'
        ? action === 'save'
          ? result.destination
            ? `The file was saved to ${result.destination}.`
            : 'The file was saved to device storage.'
          : 'System share options are now open for the generated file.'
        : action === 'save'
          ? result.destination
            ? `تم حفظ الملف في ${result.destination}.`
            : 'تم حفظ الملف على الجهاز.'
          : 'تم فتح خيارات النظام للملف. يمكنك مشاركته من التطبيق الذي اخترته.',
    );
  };

  const handleRetry = () => {
    if (operationError?.stage === 'export' && artifact) {
      handleExport(lastExportAction ?? 'share').catch(() => undefined);
      return;
    }

    if (operationError?.stage === 'translation' && lastSyncAttempt) {
      executeSyncAttempt(lastSyncAttempt, { allowSameTarget: true }).catch(() => undefined);
      return;
    }

    handleGenerate().catch(() => undefined);
  };

  const renderFieldStatus = (field: CVLocalizedField) => {
    if (field.syncState === 'failed' && field.failureReason) {
      return <Text style={[styles.fieldNote, styles.fieldNoteError, languageTextStyle]}>{field.failureReason}</Text>;
    }

    if (
      field.syncState === 'auto_populated' &&
      field.lastSyncSourceLanguage &&
      getFieldValue(field, activeLanguage).trim()
    ) {
      return (
        <Text style={[styles.fieldNote, styles.fieldNoteSuccess, languageTextStyle]}>
          {copy.fieldAuto} {`(${getLanguageLabel(field.lastSyncSourceLanguage)})`}
        </Text>
      );
    }

    if (field.syncState === 'preserved' && getFieldValue(field, activeLanguage).trim()) {
      return <Text style={[styles.fieldNote, styles.fieldNoteMuted, languageTextStyle]}>{copy.fieldPreserved}</Text>;
    }

    return null;
  };

  const renderLocalizedInput = ({
    label,
    placeholder,
    field,
    onChangeText,
    onPreserve,
    multiline = false,
  }: {
    label: string;
    placeholder: string;
    field: CVLocalizedField;
    onChangeText: (value: string) => void;
    onPreserve: () => void;
    multiline?: boolean;
  }) => (
    <View style={styles.localizedInputBlock}>
      <View style={[styles.inputLabelRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <Text style={[styles.label, languageTextStyle]}>{label}</Text>
        {field.lastEditedLanguage !== activeLanguage && getFieldValue(field, activeLanguage).trim() ? (
          <TouchableOpacity onPress={onPreserve} style={styles.keepChip}>
            <Text style={styles.keepChipText}>{activeLanguage === 'en' ? 'Keep current' : 'احتفظ بالقيمة'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TextInput
        style={[styles.input, multiline && styles.textArea, languageInputStyle]}
        value={getFieldValue(field, activeLanguage)}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
      {renderFieldStatus(field)}
    </View>
  );

  const renderHeader = (
    title: string,
    isExpanded: boolean,
    onToggle: () => void,
    onAdd: () => void,
  ) => (
    <View style={styles.sectionHeader}>
      <TouchableOpacity style={styles.headerTitleContainer} onPress={onToggle}>
        <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={COLORS.greenDark} />
        <Text style={[styles.sectionTitle, languageTextStyle]}>{title}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAdd} style={styles.addButton}>
        <Icon name="add" size={20} color={COLORS.white} />
        <Text style={styles.addButtonText}>{copy.addButton}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading || (isAuthenticated && !isDraftHydrated)) {
    return (
      <ThemedBackground>
        <AppLoading
          text={loading ? 'جارٍ تجهيز بيانات الدخول...' : 'جارٍ استعادة مسودة السيرة الذاتية...'}
          style={{ paddingBottom: insets.bottom, backgroundColor: 'transparent' }}
        />
      </ThemedBackground>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemedBackground style={[styles.centerState, { paddingBottom: insets.bottom }]}>
        <Icon name="lock-outline" size={42} color={COLORS.gold} />
        <Text style={styles.stateTitle}>هذه الميزة متاحة للمستخدمين المسجلين فقط</Text>
        <Text style={styles.stateText}>
          سيتم تحويلك إلى شاشة تسجيل الدخول لمتابعة إنشاء السيرة الذاتية.
        </Text>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('AuthStack', { screen: 'SignIn' })}
        >
          <Text style={styles.secondaryBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </ThemedBackground>
    );
  }

  const generatedLanguageLabel = artifact?.language === 'en' ? 'English' : 'العربية';
  const exportProgressMessage =
    activeExportAction === 'save' ? copy.saveInProgress : copy.shareInProgress;
  const generateButtonText =
    draft.editingLanguage === 'en'
      ? copy.generateEnglish
      : artifact
        ? copy.regenerateArabic
        : copy.generateArabic;

  return (
    <ThemedBackground style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageDescription, languageTextStyle]}>
          {copy.pageDescription}
        </Text>

        <View style={styles.card}>
          <Text style={[styles.label, languageTextStyle]}>{copy.languageLabel}</Text>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              style={[styles.languageOption, draft.editingLanguage === 'ar' && styles.languageOptionActive]}
              onPress={() => handleLanguageSwitch('ar')}
              disabled={busyStage !== null}
            >
              <Text
                style={[
                  styles.languageOptionTitle,
                  draft.editingLanguage === 'ar' && styles.languageOptionTitleActive,
                ]}
              >
                {copy.languageOptionArabicTitle}
              </Text>
              <Text style={styles.languageOptionText}>{copy.languageOptionArabicText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.languageOption, draft.editingLanguage === 'en' && styles.languageOptionActive]}
              onPress={() => handleLanguageSwitch('en')}
              disabled={busyStage !== null}
            >
              <Text
                style={[
                  styles.languageOptionTitle,
                  draft.editingLanguage === 'en' && styles.languageOptionTitleActive,
                ]}
              >
                {copy.languageOptionEnglishTitle}
              </Text>
              <Text style={styles.languageOptionText}>{copy.languageOptionEnglishText}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.helperText, languageTextStyle]}>{copy.languageHelper}</Text>

          {__DEV__ && (
            <View style={styles.sampleModeRow}>
              <Text style={[styles.helperText, languageTextStyle]}>{copy.sampleModeHint}</Text>
              <TouchableOpacity
                style={[styles.sampleModeButton, busyStage !== null && styles.disabledBtn]}
                onPress={handleLoadSampleDraft}
                disabled={busyStage !== null}
              >
                <Icon name="science" size={18} color={COLORS.greenDark} />
                <Text style={styles.sampleModeButtonText}>{copy.sampleModeButton}</Text>
              </TouchableOpacity>
            </View>
          )}

          {draft.editingLanguage === 'en' && pairAvailability?.message && !pairAvailability.supported && (
            <View style={[styles.inlineNotice, styles.inlineNoticeError]}>
              <Text style={[styles.inlineNoticeText, languageTextStyle]}>{pairAvailability.message}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {renderLocalizedInput({
            label: copy.fullNameLabel,
            placeholder: copy.fullNamePlaceholder,
            field: draft.fullName,
            onChangeText: value => updateRootField('fullName', value),
            onPreserve: () => preserveVisibleField('root', null, 'fullName'),
          })}
          <Text style={[styles.helperText, languageTextStyle]}>{copy.sectionHint}</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitleStandalone, languageTextStyle]}>
            {copy.contactTitle}
          </Text>
          {renderLocalizedInput({
            label: copy.contactEmailLabel,
            placeholder: copy.contactEmailLabel,
            field: draft.contact.email,
            onChangeText: value => updateContactField('email', value),
            onPreserve: () => preserveVisibleField('contact', null, 'email'),
          })}
          {renderLocalizedInput({
            label: copy.contactPhoneLabel,
            placeholder: copy.contactPhoneLabel,
            field: draft.contact.phone,
            onChangeText: value => updateContactField('phone', value),
            onPreserve: () => preserveVisibleField('contact', null, 'phone'),
          })}
          {renderLocalizedInput({
            label: copy.contactAddressLabel,
            placeholder: copy.contactAddressLabel,
            field: draft.contact.address,
            onChangeText: value => updateContactField('address', value),
            onPreserve: () => preserveVisibleField('contact', null, 'address'),
          })}
          {renderLocalizedInput({
            label: copy.contactLinkedinLabel,
            placeholder: copy.contactLinkedinLabel,
            field: draft.contact.linkedin,
            onChangeText: value => updateContactField('linkedin', value),
            onPreserve: () => preserveVisibleField('contact', null, 'linkedin'),
          })}
          {renderLocalizedInput({
            label: copy.contactJobTitleLabel,
            placeholder: copy.contactJobTitleLabel,
            field: draft.contact.title,
            onChangeText: value => updateContactField('title', value),
            onPreserve: () => preserveVisibleField('contact', null, 'title'),
          })}
        </View>

        <View style={styles.card}>
          {renderLocalizedInput({
            label: copy.summaryLabel,
            placeholder: copy.summaryPlaceholder,
            field: draft.summary,
            onChangeText: value => updateRootField('summary', value),
            onPreserve: () => preserveVisibleField('root', null, 'summary'),
            multiline: true,
          })}
        </View>

        <View style={styles.card}>
          {renderHeader(copy.experiencesTitle, isExpExpanded, () => setExpExpanded(!isExpExpanded), addExperience)}
          {isExpExpanded &&
            draft.experiences.map((item, index) => (
              <View key={item.id} style={styles.itemBox}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, languageTextStyle]}>
                    {copy.experiencesTitle} {index + 1}
                  </Text>
                  <TouchableOpacity onPress={() => removeExperience(item.id)}>
                    <Icon name="delete" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
                {renderLocalizedInput({
                  label: copy.experienceTitleLabel,
                  placeholder: copy.experienceTitleLabel,
                  field: item.title,
                  onChangeText: value => updateExperienceField(item.id, 'title', value),
                  onPreserve: () => preserveVisibleField('experiences', item.id, 'title'),
                })}
                {renderLocalizedInput({
                  label: copy.experienceOrgLabel,
                  placeholder: copy.experienceOrgLabel,
                  field: item.organization,
                  onChangeText: value => updateExperienceField(item.id, 'organization', value),
                  onPreserve: () => preserveVisibleField('experiences', item.id, 'organization'),
                })}
                {renderLocalizedInput({
                  label: copy.experienceDurationLabel,
                  placeholder: copy.experienceDurationLabel,
                  field: item.duration,
                  onChangeText: value => updateExperienceField(item.id, 'duration', value),
                  onPreserve: () => preserveVisibleField('experiences', item.id, 'duration'),
                })}
                {renderLocalizedInput({
                  label: copy.experienceDescriptionLabel,
                  placeholder: copy.experienceDescriptionLabel,
                  field: item.description,
                  onChangeText: value => updateExperienceField(item.id, 'description', value),
                  onPreserve: () => preserveVisibleField('experiences', item.id, 'description'),
                  multiline: true,
                })}
              </View>
            ))}
        </View>

        <View style={styles.card}>
          {renderHeader(copy.educationTitle, isEduExpanded, () => setEduExpanded(!isEduExpanded), addEducation)}
          {isEduExpanded &&
            draft.education.map((item, index) => (
              <View key={item.id} style={styles.itemBox}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, languageTextStyle]}>
                    {copy.educationTitle} {index + 1}
                  </Text>
                  <TouchableOpacity onPress={() => removeEducation(item.id)}>
                    <Icon name="delete" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
                {renderLocalizedInput({
                  label: copy.educationDegreeLabel,
                  placeholder: copy.educationDegreeLabel,
                  field: item.degree,
                  onChangeText: value => updateEducationField(item.id, 'degree', value),
                  onPreserve: () => preserveVisibleField('education', item.id, 'degree'),
                })}
                {renderLocalizedInput({
                  label: copy.educationInstitutionLabel,
                  placeholder: copy.educationInstitutionLabel,
                  field: item.institution,
                  onChangeText: value => updateEducationField(item.id, 'institution', value),
                  onPreserve: () => preserveVisibleField('education', item.id, 'institution'),
                })}
                {renderLocalizedInput({
                  label: copy.educationYearLabel,
                  placeholder: copy.educationYearLabel,
                  field: item.year,
                  onChangeText: value => updateEducationField(item.id, 'year', value),
                  onPreserve: () => preserveVisibleField('education', item.id, 'year'),
                })}
              </View>
            ))}
        </View>

        <View style={styles.card}>
          {renderHeader(copy.skillsTitle, isSkillsExpanded, () => setSkillsExpanded(!isSkillsExpanded), addSkill)}
          {isSkillsExpanded &&
            draft.skills.map(item => (
              <View key={item.id} style={[styles.itemBox, styles.skillBox]}>
                <View style={styles.skillFieldWrapper}>
                  {renderLocalizedInput({
                    label: copy.skillsTitle,
                    placeholder: copy.skillsPlaceholder,
                    field: item.value,
                    onChangeText: value => updateSkillField(item.id, value),
                    onPreserve: () => preserveVisibleField('skills', item.id, 'value'),
                  })}
                </View>
                <TouchableOpacity onPress={() => removeSkill(item.id)}>
                  <Icon name="delete" size={24} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
        </View>

        <View style={styles.card}>
          {renderHeader(
            copy.certificationsTitle,
            isCertExpanded,
            () => setCertExpanded(!isCertExpanded),
            addCertification,
          )}
          {isCertExpanded &&
            draft.certifications.map((item, index) => (
              <View key={item.id} style={styles.itemBox}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, languageTextStyle]}>
                    {copy.certificationsTitle} {index + 1}
                  </Text>
                  <TouchableOpacity onPress={() => removeCertification(item.id)}>
                    <Icon name="delete" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
                {renderLocalizedInput({
                  label: copy.certificationNameLabel,
                  placeholder: copy.certificationNameLabel,
                  field: item.name,
                  onChangeText: value => updateCertificationField(item.id, 'name', value),
                  onPreserve: () => preserveVisibleField('certifications', item.id, 'name'),
                })}
                {renderLocalizedInput({
                  label: copy.certificationIssuerLabel,
                  placeholder: copy.certificationIssuerLabel,
                  field: item.issuer,
                  onChangeText: value => updateCertificationField(item.id, 'issuer', value),
                  onPreserve: () => preserveVisibleField('certifications', item.id, 'issuer'),
                })}
                {renderLocalizedInput({
                  label: copy.certificationDateLabel,
                  placeholder: copy.certificationDateLabel,
                  field: item.date,
                  onChangeText: value => updateCertificationField(item.id, 'date', value),
                  onPreserve: () => preserveVisibleField('certifications', item.id, 'date'),
                })}
                {renderLocalizedInput({
                  label: copy.certificationDetailsLabel,
                  placeholder: copy.certificationDetailsLabel,
                  field: item.details,
                  onChangeText: value => updateCertificationField(item.id, 'details', value),
                  onPreserve: () => preserveVisibleField('certifications', item.id, 'details'),
                  multiline: true,
                })}
              </View>
            ))}
        </View>

        <View style={styles.card}>
          {renderHeader(
            copy.volunteerTitle,
            isVolunteerExpanded,
            () => setVolunteerExpanded(!isVolunteerExpanded),
            addVolunteerExperience,
          )}
          {isVolunteerExpanded &&
            draft.volunteerExperiences.map((item, index) => (
              <View key={item.id} style={styles.itemBox}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, languageTextStyle]}>
                    {copy.volunteerTitle} {index + 1}
                  </Text>
                  <TouchableOpacity onPress={() => removeVolunteerExperience(item.id)}>
                    <Icon name="delete" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
                {renderLocalizedInput({
                  label: copy.volunteerRoleLabel,
                  placeholder: copy.volunteerRoleLabel,
                  field: item.role,
                  onChangeText: value => updateVolunteerField(item.id, 'role', value),
                  onPreserve: () => preserveVisibleField('volunteerExperiences', item.id, 'role'),
                })}
                {renderLocalizedInput({
                  label: copy.volunteerOrgLabel,
                  placeholder: copy.volunteerOrgLabel,
                  field: item.organization,
                  onChangeText: value => updateVolunteerField(item.id, 'organization', value),
                  onPreserve: () => preserveVisibleField('volunteerExperiences', item.id, 'organization'),
                })}
                {renderLocalizedInput({
                  label: copy.volunteerDurationLabel,
                  placeholder: copy.volunteerDurationLabel,
                  field: item.duration,
                  onChangeText: value => updateVolunteerField(item.id, 'duration', value),
                  onPreserve: () => preserveVisibleField('volunteerExperiences', item.id, 'duration'),
                })}
                {renderLocalizedInput({
                  label: copy.volunteerDescriptionLabel,
                  placeholder: copy.volunteerDescriptionLabel,
                  field: item.description,
                  onChangeText: value => updateVolunteerField(item.id, 'description', value),
                  onPreserve: () => preserveVisibleField('volunteerExperiences', item.id, 'description'),
                  multiline: true,
                })}
              </View>
            ))}
        </View>

        {artifact && (
          <View style={[styles.feedbackCard, styles.successCard]}>
            <Text style={[styles.feedbackTitle, languageTextStyle]}>{copy.successReadyTitle}</Text>
            <Text style={[styles.feedbackText, languageTextStyle]}>
              {activeLanguage === 'en' ? 'File language' : 'لغة الملف'}: {generatedLanguageLabel}
            </Text>
            <Text style={[styles.feedbackText, languageTextStyle]}>
              {activeLanguage === 'en' ? 'File name' : 'اسم الملف'}: {artifact.fileName}.pdf
            </Text>
            {savedLocation && (
              <Text style={[styles.feedbackText, languageTextStyle]}>
                {copy.savedLocationTitle}: {savedLocation}
              </Text>
            )}
          </View>
        )}

        {busyStage === 'export' && activeExportAction && (
          <View style={[styles.feedbackCard, styles.progressCard]}>
            <Text style={[styles.feedbackTitle, languageTextStyle]}>{exportProgressMessage}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${exportProgress}%` }]} />
            </View>
          </View>
        )}

        {statusMessage && (
          <View style={[styles.feedbackCard, styles.successCard]}>
            <Text style={[styles.feedbackTitle, languageTextStyle]}>{copy.statusTitle}</Text>
            <Text style={[styles.feedbackText, languageTextStyle]}>{statusMessage}</Text>
          </View>
        )}

        {savedLocation && (
          <View style={[styles.feedbackCard, styles.successCard]}>
            <Text style={[styles.feedbackTitle, languageTextStyle]}>{copy.savedLocationTitle}</Text>
            <Text style={[styles.feedbackText, languageTextStyle]}>{savedLocation}</Text>
          </View>
        )}

        {operationError && (
          <View style={[styles.feedbackCard, styles.errorCard]}>
            <Text style={[styles.feedbackTitle, languageTextStyle]}>{copy.errorTitle}</Text>
            <Text style={[styles.feedbackText, languageTextStyle]}>{operationError.message}</Text>
            {operationError.retryable && (
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} disabled={busyStage !== null}>
                <Text style={styles.retryBtnText}>{copy.retryButton}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {artifact && (
          <View style={styles.exportActionsRow}>
            <TouchableOpacity
              style={[styles.secondaryFooterBtn, styles.exportActionBtn, busyStage !== null && styles.disabledBtn]}
              onPress={() => handleExport('save')}
              disabled={busyStage !== null}
            >
              {busyStage === 'export' && activeExportAction === 'save' ? (
                <View style={styles.buttonProgressWrap}>
                  <Text style={styles.secondaryFooterBtnText}>{copy.saveButtonLabel}</Text>
                  <View style={styles.buttonProgressTrack}>
                    <View style={[styles.buttonProgressFill, { width: `${exportProgress}%` }]} />
                  </View>
                </View>
              ) : (
                <>
                  <Icon name="save-alt" size={22} color="#0c2a20" style={styles.secondaryBtnIcon} />
                  <Text style={styles.secondaryFooterBtnText}>
                    {copy.saveButtonLabel} {generatedLanguageLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryFooterBtn, styles.exportActionBtn, busyStage !== null && styles.disabledBtn]}
              onPress={() => handleExport('share')}
              disabled={busyStage !== null}
            >
              {busyStage === 'export' && activeExportAction === 'share' ? (
                <View style={styles.buttonProgressWrap}>
                  <Text style={styles.secondaryFooterBtnText}>{copy.shareButtonLabel}</Text>
                  <View style={styles.buttonProgressTrack}>
                    <View style={[styles.buttonProgressFill, { width: `${exportProgress}%` }]} />
                  </View>
                </View>
              ) : (
                <>
                  <Icon name="share" size={22} color="#0c2a20" style={styles.secondaryBtnIcon} />
                  <Text style={styles.secondaryFooterBtnText}>
                    {copy.shareButtonLabel} {generatedLanguageLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateBtn, busyStage !== null && styles.disabledBtn]}
          onPress={handleGenerate}
          disabled={busyStage !== null}
        >
          {busyStage === 'generation' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="picture-as-pdf" size={24} color="#fff" style={styles.btnIcon} />
              <Text style={styles.generateBtnText}>{generateButtonText}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  stateTitle: {
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  stateText: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 13,
    color: 'rgba(255, 248, 239, 0.78)',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  pageDescription: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 13,
    color: 'rgba(255, 248, 239, 0.78)',
    marginBottom: 16,
    textAlign: 'auto',
    lineHeight: 22,
  },
  textArabic: {
    textAlign: 'auto',
    writingDirection: 'rtl',
    direction: 'rtl',
  },
  textEnglish: {
    textAlign: 'auto',
    writingDirection: 'ltr',
    direction: 'ltr',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  languageOptions: { flexDirection: 'row-reverse', gap: 10, marginBottom: 12 },
  languageOption: {
    flex: 1,
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  languageOptionActive: { borderColor: COLORS.green, backgroundColor: COLORS.sage },
  languageOptionTitle: {
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 14,
    color: COLORS.greenDark,
    textAlign: 'center',
  },
  languageOptionTitleActive: { color: COLORS.green },
  languageOptionText: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  sampleModeRow: {
    marginTop: 8,
    gap: 10,
  },
  sampleModeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cream,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sampleModeButtonText: {
    color: COLORS.greenDark,
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 12,
  },
  inlineNotice: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  inlineNoticeError: { backgroundColor: '#fff4f4', borderColor: '#f1b2b2' },
  inlineNoticeText: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 12,
    color: '#7a3535',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  localizedInputBlock: { marginBottom: 10 },
  inputLabelRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  rowLtr: {
    flexDirection: 'row',
  },
  label: {
    flex: 1,
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 14,
    color: COLORS.greenDark,
  },
  keepChip: {
    backgroundColor: COLORS.cream,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  keepChipText: {
    color: COLORS.greenDark,
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 11,
  },
  helperText: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: 6,
    textAlign: 'auto',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputArabic: {
    textAlign: 'auto',
    writingDirection: 'rtl',
    direction: 'rtl',
  },
  inputEnglish: {
    textAlign: 'auto',
    writingDirection: 'ltr',
    direction: 'ltr',
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  fieldNote: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 4,
  },
  fieldNoteSuccess: { color: '#1f6e43', textAlign: 'right', writingDirection: 'rtl' },
  fieldNoteMuted: { color: COLORS.muted, textAlign: 'right', writingDirection: 'rtl' },
  fieldNoteError: { color: '#a33434', textAlign: 'right', writingDirection: 'rtl' },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  sectionTitle: {
    flex: 1,
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 16,
    color: COLORS.greenDark,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  sectionTitleStandalone: {
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 16,
    color: COLORS.greenDark,
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  addButtonText: { color: COLORS.white, fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 },
  itemBox: {
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    flex: 1,
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 13,
    color: COLORS.greenDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  skillBox: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  skillFieldWrapper: { flex: 1 },
  feedbackCard: { borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  successCard: { backgroundColor: '#f4f8f3', borderColor: '#a9c8a9' },
  errorCard: { backgroundColor: '#fff4f4', borderColor: '#f1b2b2' },
  progressCard: { backgroundColor: COLORS.cream, borderColor: COLORS.gold },
  feedbackTitle: {
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 14,
    color: COLORS.greenDark,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  feedbackText: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e3ddd1',
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.green,
  },
  retryBtn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.greenDark,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  retryBtnText: { color: COLORS.white, fontFamily: 'NotoKufiArabic-Bold', fontSize: 13 },
  footer: {
    padding: 16,
    backgroundColor: COLORS.greenDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.gold,
    gap: 10,
  },
  exportActionsRow: {
    gap: 10,
  },
  generateBtn: {
    backgroundColor: COLORS.greenDark,
    paddingVertical: 14,
    borderRadius: 999,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryFooterBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 999,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  exportActionBtn: {
    width: '100%',
  },
  secondaryFooterBtnText: { color: COLORS.greenDark, fontFamily: 'NotoKufiArabic-Bold', fontSize: 15 },
  buttonProgressWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  buttonProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#d9d2c5',
    overflow: 'hidden',
  },
  buttonProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.green,
  },
  btnIcon: { transform: [{ scaleX: -1 }] },
  secondaryBtnIcon: { transform: [{ scaleX: -1 }] },
  generateBtnText: { color: COLORS.gold, fontFamily: 'NotoKufiArabic-Bold', fontSize: 16 },
  secondaryBtn: { backgroundColor: COLORS.greenDark, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  secondaryBtnText: { color: COLORS.white, fontFamily: 'NotoKufiArabic-Bold', fontSize: 14 },
  disabledBtn: { opacity: 0.7 },
});
