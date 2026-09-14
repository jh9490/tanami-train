import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { authStyles } from '../../auth/ui';
import ThemedBackground from '../components/ThemedBackground';

export default function TraineeTypeScreen({ navigation }: any) {
  const continueToPhone = () => navigation.navigate('PhoneEntry');

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <View style={authStyles.hero}>
          <View style={authStyles.pill}>
            <Text style={authStyles.pillText}>إنشاء حساب جديد</Text>
          </View>
          <Text style={authStyles.title}>اختر نوع المتدرب</Text>
          <Text style={authStyles.subtitle}>
            اختر الخيار المناسب لك للمتابعة إلى التحقق من رقم الجوال.
          </Text>
        </View>

        <View style={authStyles.card}>
          <TouchableOpacity
            testID="new-trainee-option"
            accessibilityRole="button"
            accessibilityLabel="متدرب جديد / New trainee"
            onPress={continueToPhone}
            style={authStyles.optionCard}
          >
            <Text style={authStyles.optionTitle}>متدرب جديد</Text>
            <Text style={authStyles.optionDescription}>لم أتدرب لدى تنامي من قبل.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="previous-trainee-option"
            accessibilityRole="button"
            accessibilityLabel="متدرب سابق / Previous trainee"
            onPress={continueToPhone}
            style={authStyles.optionCard}
          >
            <Text style={authStyles.optionTitle}>متدرب سابق</Text>
            <Text style={authStyles.optionDescription}>
              لدي دورات سابقة لدى تنامي. إذا لم تظهر دوراتي بعد إكمال التسجيل، يمكنني التواصل مع الدعم.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedBackground>
  );
}
