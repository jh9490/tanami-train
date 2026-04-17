import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  exportGeneratedCV,
  generateCV,
  getEnglishTranslationAvailability,
  type CVDraft,
  type CVEducation,
  type CVExperience,
  type CVOperationError,
  type CVOutputLanguage,
  type CVSkill,
  type CVTranslationAvailability,
  type GeneratedCVArtifact,
} from '../../services/cvService';

const DEV_SAMPLE_DRAFT: CVDraft = {
  fullName: 'أحمد صالح العتيبي',
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
    {
      id: 'dev-exp-2',
      title: 'مطور واجهات أمامية',
      organization: 'شركة مسار التقنية',
      duration: '2021 - 2023',
      description:
        'تنفيذ لوحات معلومات داخلية، تحسين تجربة المستخدم على الأجهزة المحمولة، وكتابة مكونات قابلة لإعادة الاستخدام مع اختبارات وحدات أساسية.',
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
    { id: 'dev-skill-3', value: 'JavaScript' },
    { id: 'dev-skill-4', value: 'REST APIs' },
    { id: 'dev-skill-5', value: 'Git' },
    { id: 'dev-skill-6', value: 'RTL Layout' },
  ],
};

const INITIAL_DRAFT = __DEV__
  ? DEV_SAMPLE_DRAFT
  : {
      fullName: '',
      summary: '',
      experiences: [],
      education: [],
      skills: [],
    };

export default function CVFormScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { displayName, isAuthenticated, loading, user } = useAuth();
  const [fullName, setFullName] = useState(INITIAL_DRAFT.fullName);
  const [summary, setSummary] = useState(INITIAL_DRAFT.summary);
  const [experiences, setExperiences] = useState<CVExperience[]>(INITIAL_DRAFT.experiences);
  const [education, setEducation] = useState<CVEducation[]>(INITIAL_DRAFT.education);
  const [skills, setSkills] = useState<CVSkill[]>(INITIAL_DRAFT.skills);
  const [outputLanguage, setOutputLanguage] = useState<CVOutputLanguage>('ar');

  const [isExpExpanded, setExpExpanded] = useState(INITIAL_DRAFT.experiences.length > 0);
  const [isEduExpanded, setEduExpanded] = useState(INITIAL_DRAFT.education.length > 0);
  const [isSkillsExpanded, setSkillsExpanded] = useState(INITIAL_DRAFT.skills.length > 0);
  const [artifact, setArtifact] = useState<GeneratedCVArtifact | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<CVOperationError | null>(null);
  const [busyStage, setBusyStage] = useState<'generation' | 'export' | null>(null);
  const [englishAvailability, setEnglishAvailability] = useState<CVTranslationAvailability | null>(null);

  useEffect(() => {
    if (!displayName) {
      return;
    }

    setFullName(currentFullName => (currentFullName.trim() ? currentFullName : displayName));
  }, [displayName]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigation.navigate('AuthStack', { screen: 'SignIn' });
    }
  }, [isAuthenticated, loading, navigation]);

  useEffect(() => {
    let mounted = true;

    getEnglishTranslationAvailability()
      .then(result => {
        if (mounted) {
          setEnglishAvailability(result);
        }
      })
      .catch(error => {
        console.error('English translation availability failed:', error);

        if (mounted) {
          setEnglishAvailability({
            supported: false,
            reason: 'availability_check_failed',
            message: 'تعذر التحقق من توفر النسخة الإنجليزية حالياً. يمكنك الاستمرار في إنشاء النسخة العربية.',
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const clearGeneratedState = () => {
    setArtifact(null);
    setStatusMessage(null);
    setOperationError(null);
  };

  const setSelectedLanguage = (language: CVOutputLanguage) => {
    clearGeneratedState();
    setOutputLanguage(language);
  };

  const addExperience = () => {
    clearGeneratedState();
    setExperiences([
      ...experiences,
      { id: Date.now().toString(), title: '', organization: '', duration: '', description: '' },
    ]);
    if (!isExpExpanded) setExpExpanded(true);
  };

  const removeExperience = (id: string) => {
    clearGeneratedState();
    setExperiences(experiences.filter(experience => experience.id !== id));
  };

  const updateExperience = (id: string, field: Exclude<keyof CVExperience, 'id'>, value: string) => {
    clearGeneratedState();
    setExperiences(experiences.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addEducation = () => {
    clearGeneratedState();
    setEducation([...education, { id: Date.now().toString(), degree: '', institution: '', year: '' }]);
    if (!isEduExpanded) setEduExpanded(true);
  };

  const removeEducation = (id: string) => {
    clearGeneratedState();
    setEducation(education.filter(item => item.id !== id));
  };

  const updateEducation = (id: string, field: Exclude<keyof CVEducation, 'id'>, value: string) => {
    clearGeneratedState();
    setEducation(education.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addSkill = () => {
    clearGeneratedState();
    setSkills([...skills, { id: Date.now().toString(), value: '' }]);
    if (!isSkillsExpanded) setSkillsExpanded(true);
  };

  const removeSkill = (id: string) => {
    clearGeneratedState();
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const updateSkill = (id: string, value: string) => {
    clearGeneratedState();
    setSkills(skills.map(skill => (skill.id === id ? { ...skill, value } : skill)));
  };

  const handleGenerate = async () => {
    const draft: CVDraft = {
      fullName,
      summary,
      experiences,
      education,
      skills,
    };

    setBusyStage('generation');
    setStatusMessage(null);
    setOperationError(null);

    const result = await generateCV(draft, {
      isAuthenticated,
      userId: user?.id ?? null,
      displayName,
    }, {
      outputLanguage,
    });

    setBusyStage(null);

    if (!result.ok) {
      setOperationError(result.error);
      return;
    }

    setArtifact(result.artifact);
    setStatusMessage(
      `تم إنشاء ${result.artifact.language === 'en' ? 'النسخة الإنجليزية' : 'النسخة العربية'} ${result.artifact.fileName}.pdf بنجاح. يمكنك الآن حفظها أو مشاركتها.`,
    );
  };

  const handleExport = async () => {
    if (!artifact) {
      return;
    }

    setBusyStage('export');
    setStatusMessage(null);
    setOperationError(null);

    const result = await exportGeneratedCV(artifact, 'share');

    setBusyStage(null);
    setArtifact(result.artifact);

    if (!result.ok) {
      setOperationError(result.error);
      return;
    }

    if (result.status === 'cancelled') {
      setStatusMessage('تم إغلاق خيارات المشاركة دون فقدان الملف. يمكنك المحاولة مرة أخرى في أي وقت.');
      return;
    }

    setStatusMessage('تم فتح خيارات النظام للملف. يمكنك مشاركة السيرة الذاتية أو حفظها من التطبيق الذي اخترته.');
  };

  const handleRetry = () => {
    if (operationError?.stage === 'export' && artifact) {
      handleExport().catch(() => undefined);
      return;
    }

    handleGenerate().catch(() => undefined);
  };

  const renderHeader = (title: string, isExpanded: boolean, onToggle: () => void, onAdd: () => void) => (
    <View style={styles.sectionHeader}>
      <TouchableOpacity style={styles.headerTitleContainer} onPress={onToggle}>
        <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color="#0c2a20" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAdd} style={styles.addButton}>
        <Icon name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>إضافة</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centerState, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color="#0c2a20" />
        <Text style={styles.stateText}>جارٍ تجهيز بيانات الدخول...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.centerState, { paddingBottom: insets.bottom }]}>
        <Icon name="lock-outline" size={42} color="#0c2a20" />
        <Text style={styles.stateTitle}>هذه الميزة متاحة للمستخدمين المسجلين فقط</Text>
        <Text style={styles.stateText}>سيتم تحويلك إلى شاشة تسجيل الدخول لمتابعة إنشاء السيرة الذاتية.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('AuthStack', { screen: 'SignIn' })}>
          <Text style={styles.secondaryBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isEnglishUnsupported = outputLanguage === 'en' && englishAvailability !== null && !englishAvailability.supported;
  const generatedLanguageLabel = artifact?.language === 'en' ? 'الإنجليزية' : 'العربية';
  const generateButtonText =
    outputLanguage === 'en'
      ? 'إنشاء النسخة الإنجليزية'
      : artifact
        ? 'إعادة إنشاء النسخة العربية'
        : 'إنشاء النسخة العربية';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageDescription}>
          املأ الحقول أدناه مرة واحدة بالعربية. تبقى العربية هي الخيار الافتراضي، ويمكنك إنشاء نسخة إنجليزية من نفس البيانات على الأجهزة المدعومة.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>لغة ملف السيرة الذاتية</Text>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              style={[styles.languageOption, outputLanguage === 'ar' && styles.languageOptionActive]}
              onPress={() => setSelectedLanguage('ar')}
              disabled={busyStage !== null}
            >
              <Text style={[styles.languageOptionTitle, outputLanguage === 'ar' && styles.languageOptionTitleActive]}>العربية</Text>
              <Text style={styles.languageOptionText}>الافتراضية وفق الميزة 001</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.languageOption, outputLanguage === 'en' && styles.languageOptionActive]}
              onPress={() => setSelectedLanguage('en')}
              disabled={busyStage !== null}
            >
              <Text style={[styles.languageOptionTitle, outputLanguage === 'en' && styles.languageOptionTitleActive]}>English</Text>
              <Text style={styles.languageOptionText}>من نفس البيانات العربية</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            {outputLanguage === 'en'
              ? 'سيتم إنشاء النسخة الإنجليزية على الجهاز نفسه، وقد تتطلب المحاولة الأولى تجهيز نموذج الترجمة محلياً.'
              : 'يمكنك لاحقاً التبديل إلى الإنجليزية دون إعادة تعبئة النموذج.'}
          </Text>

          {outputLanguage === 'en' && englishAvailability?.message && !englishAvailability.supported && (
            <View style={[styles.inlineNotice, styles.inlineNoticeError]}>
              <Text style={styles.inlineNoticeText}>{englishAvailability.message}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={value => {
              clearGeneratedState();
              setFullName(value);
            }}
            placeholder="أدخل اسمك الكامل"
            placeholderTextColor="#999"
          />
          <Text style={styles.helperText}>الحد الأدنى المطلوب هو الاسم الكامل. بقية الأقسام اختيارية ويمكن إضافتها عند الحاجة.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>الملخص المهني</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={summary}
            onChangeText={value => {
              clearGeneratedState();
              setSummary(value);
            }}
            multiline
            placeholder="اكتب نبذة قصيرة عن خبراتك أو أهدافك المهنية"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.card}>
          {renderHeader('الخبرات', isExpExpanded, () => setExpExpanded(!isExpExpanded), addExperience)}
          {isExpExpanded && experiences.map((exp, index) => (
            <View key={exp.id} style={styles.itemBox}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>خبرة {index + 1}</Text>
                <TouchableOpacity onPress={() => removeExperience(exp.id)}>
                  <Icon name="delete" size={20} color="#d9534f" />
                </TouchableOpacity>
              </View>
              <TextInput style={styles.input} placeholder="المسمى الوظيفي" placeholderTextColor="#aaa" value={exp.title} onChangeText={t => updateExperience(exp.id, 'title', t)} />
              <TextInput style={styles.input} placeholder="جهة العمل" placeholderTextColor="#aaa" value={exp.organization} onChangeText={t => updateExperience(exp.id, 'organization', t)} />
              <TextInput style={styles.input} placeholder="المدة (مثال: 2020 - 2023)" placeholderTextColor="#aaa" value={exp.duration} onChangeText={t => updateExperience(exp.id, 'duration', t)} />
              <TextInput style={[styles.input, styles.textArea]} multiline placeholder="الوصف (اختياري)" placeholderTextColor="#aaa" value={exp.description} onChangeText={t => updateExperience(exp.id, 'description', t)} />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          {renderHeader('التعليم', isEduExpanded, () => setEduExpanded(!isEduExpanded), addEducation)}
          {isEduExpanded && education.map((edu, index) => (
            <View key={edu.id} style={styles.itemBox}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>تعليم {index + 1}</Text>
                <TouchableOpacity onPress={() => removeEducation(edu.id)}>
                  <Icon name="delete" size={20} color="#d9534f" />
                </TouchableOpacity>
              </View>
              <TextInput style={styles.input} placeholder="الدرجة العلمية" placeholderTextColor="#aaa" value={edu.degree} onChangeText={t => updateEducation(edu.id, 'degree', t)} />
              <TextInput style={styles.input} placeholder="المؤسسة / الجامعة" placeholderTextColor="#aaa" value={edu.institution} onChangeText={t => updateEducation(edu.id, 'institution', t)} />
              <TextInput style={styles.input} placeholder="سنة التخرج" placeholderTextColor="#aaa" value={edu.year} onChangeText={t => updateEducation(edu.id, 'year', t)} />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          {renderHeader('المهارات', isSkillsExpanded, () => setSkillsExpanded(!isSkillsExpanded), addSkill)}
          {isSkillsExpanded && skills.map(skill => (
            <View key={skill.id} style={[styles.itemBox, styles.skillBox]}>
              <TextInput 
                style={[styles.input, styles.skillInput]} 
                placeholder="أدخل مهارة" 
                placeholderTextColor="#aaa"
                value={skill.value} 
                onChangeText={t => updateSkill(skill.id, t)} 
              />
              <TouchableOpacity onPress={() => removeSkill(skill.id)}>
                <Icon name="delete" size={24} color="#d9534f" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {artifact && (
          <View style={[styles.feedbackCard, styles.successCard]}>
            <Text style={styles.feedbackTitle}>الملف جاهز</Text>
            <Text style={styles.feedbackText}>لغة الملف: {generatedLanguageLabel}</Text>
            <Text style={styles.feedbackText}>اسم الملف: {artifact.fileName}.pdf</Text>
            <Text style={styles.feedbackText}>يمكنك فتح خيارات النظام لمشاركة الملف أو حفظه دون إعادة تعبئة النموذج.</Text>
          </View>
        )}

        {statusMessage && (
          <View style={[styles.feedbackCard, styles.successCard]}>
            <Text style={styles.feedbackTitle}>حالة العملية</Text>
            <Text style={styles.feedbackText}>{statusMessage}</Text>
          </View>
        )}

        {operationError && (
          <View style={[styles.feedbackCard, styles.errorCard]}>
            <Text style={styles.feedbackTitle}>تعذر إكمال العملية</Text>
            <Text style={styles.feedbackText}>{operationError.message}</Text>
            {operationError.retryable && (
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} disabled={busyStage !== null}>
                <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {artifact && (
          <TouchableOpacity style={[styles.secondaryFooterBtn, busyStage !== null && styles.disabledBtn]} onPress={handleExport} disabled={busyStage !== null}>
            {busyStage === 'export' ? (
              <ActivityIndicator color="#0c2a20" />
            ) : (
              <>
                <Icon name="share" size={22} color="#0c2a20" style={styles.secondaryBtnIcon} />
                <Text style={styles.secondaryFooterBtnText}>مشاركة / حفظ النسخة {generatedLanguageLabel}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.generateBtn, (busyStage !== null || isEnglishUnsupported) && styles.disabledBtn]}
          onPress={handleGenerate}
          disabled={busyStage !== null || isEnglishUnsupported}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff1e2' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff1e2', paddingHorizontal: 24, gap: 12 },
  stateTitle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, color: '#0c2a20', textAlign: 'center', writingDirection: 'rtl' },
  stateText: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 13, color: '#666', textAlign: 'center', writingDirection: 'rtl', lineHeight: 22 },
  pageDescription: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 13, color: '#666', marginBottom: 16, textAlign: 'left', writingDirection: 'rtl', lineHeight: 22 },
  card: { backgroundColor: '#eceadf', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  languageOptions: { flexDirection: 'row-reverse', gap: 10, marginBottom: 12 },
  languageOption: { flex: 1, backgroundColor: '#f7f5ef', borderRadius: 10, borderWidth: 1, borderColor: '#d3cec3', padding: 12 },
  languageOptionActive: { borderColor: '#0c2a20', backgroundColor: '#e5efe9' },
  languageOptionTitle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#0c2a20', textAlign: 'center' },
  languageOptionTitleActive: { color: '#0f4f30' },
  languageOptionText: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 11, color: '#5f6b65', marginTop: 6, textAlign: 'center', writingDirection: 'rtl', lineHeight: 18 },
  inlineNotice: { marginTop: 10, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  inlineNoticeError: { backgroundColor: '#fff4f4', borderColor: '#f1b2b2' },
  inlineNoticeText: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 12, color: '#7a3535', textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },
  label: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#0c2a20', marginBottom: 8, writingDirection: 'rtl', textAlign: 'left' },
  helperText: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 11, color: '#6b7280', lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'NotoKufiArabic-Regular', fontSize: 14, color: '#333', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl', borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 80, textAlignVertical: 'top' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitleContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  sectionTitle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, color: '#0c2a20' },
  addButton: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#0f4f30', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  addButtonText: { color: '#fff', fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 },
  itemBox: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e1e1e1' },
  itemHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 13, color: '#444' },
  skillBox: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 8 },
  skillInput: { flex: 1, marginBottom: 0, marginLeft: 12 },
  feedbackCard: { borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  successCard: { backgroundColor: '#f4f8f3', borderColor: '#a9c8a9' },
  errorCard: { backgroundColor: '#fff4f4', borderColor: '#f1b2b2' },
  feedbackTitle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#0c2a20', marginBottom: 6, textAlign: 'right', writingDirection: 'rtl' },
  feedbackText: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 12, color: '#444', lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
  retryBtn: { alignSelf: 'flex-end', backgroundColor: '#0c2a20', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginTop: 10 },
  retryBtnText: { color: '#fff', fontFamily: 'NotoKufiArabic-Bold', fontSize: 13 },
  footer: { padding: 16, backgroundColor: '#fff1e2', borderTopWidth: 1, borderTopColor: '#e0dcd3', gap: 10 },
  generateBtn: { backgroundColor: '#0c2a20', paddingVertical: 14, borderRadius: 8, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryFooterBtn: { backgroundColor: '#eceadf', paddingVertical: 14, borderRadius: 8, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#cbae82' },
  secondaryFooterBtnText: { color: '#0c2a20', fontFamily: 'NotoKufiArabic-Bold', fontSize: 15 },
  btnIcon: { transform: [{ scaleX: -1 }] },
  secondaryBtnIcon: { transform: [{ scaleX: -1 }] },
  generateBtnText: { color: '#cbae82', fontFamily: 'NotoKufiArabic-Bold', fontSize: 16 },
  secondaryBtn: { backgroundColor: '#0c2a20', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12 },
  secondaryBtnText: { color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold', fontSize: 14 },
  disabledBtn: { opacity: 0.7 },
});
