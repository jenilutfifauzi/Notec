import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput as RNTextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeInDown,
  FadeOutUp,
  ReduceMotion,
} from 'react-native-reanimated';
import { motionTokens } from '@/lib/motion';
import { useLocalSearchParams, router } from 'expo-router';
import {
  getSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionErrorCode,
  type ExpoSpeechRecognitionResultEvent,
  type ExpoSpeechRecognitionErrorEvent,
} from '../lib/speechRecognition';
import { Icon, Calendar01Icon, Mic01Icon } from '@/lib/icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Category } from '../db/schema';
import {
  insertTransaction,
  updateTransaction,
  getTransactionById,
} from '../db/queries/transactions';
import { getActiveCategories } from '../db/queries/categories';
import CategoryPickerModal from '@/components/organisms/CategoryPickerModal';
import { MAX_AMOUNT, MAX_NOTE_LENGTH } from '../lib/constants';
import {
  rupiahFormatter,
  formatDate,
  getTodayDateString,
} from '../lib/format';
import { parseVoiceTransaction } from '../lib/voiceTransactionParser';
import { useTheme } from '@/lib/theme';
import {
  radii,
  spacing,
  typography,
  fontFamilies,
  ScreenHeader,
  SegmentedControl,
  SelectField,
  TextInput,
  Button,
  CategoryDot,
} from '@/components/ui';

function mapSpeechError(
  error: ExpoSpeechRecognitionErrorCode,
  rawMessage?: string
): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Izin mikrofon atau pengenalan ucapan belum diberikan.';
    case 'audio-capture':
      return 'Mikrofon tidak dapat diakses atau sedang digunakan aplikasi lain.';
    case 'language-not-supported':
      return 'Bahasa Indonesia (id-ID) tidak didukung oleh layanan ucapan pada perangkat ini.';
    case 'network':
      return 'Gagal terhubung ke layanan pengenalan ucapan. Periksa koneksi internet.';
    case 'no-speech':
      return 'Tidak ada suara yang terdeteksi. Silakan coba lagi.';
    case 'speech-timeout':
      return 'Waktu bicara habis tanpa input suara. Silakan coba lagi.';
    case 'busy':
      return 'Layanan pengenalan ucapan sedang sibuk. Silakan coba sesaat lagi.';
    default:
      return rawMessage || 'Terjadi kesalahan saat mengenali suara.';
  }
}

export default function RecordScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : null;
  const isEditing = Boolean(editId && !isNaN(editId));

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [rawAmount, setRawAmount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [dateStr, setDateStr] = useState<string>(getTodayDateString());
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // transitions.dev 12-error-state-shake for nominal field
  const nominalShakeX = useSharedValue(0);
  const triggerNominalShake = () => {
    nominalShakeX.value = withSequence(
      withTiming(motionTokens.presets.shake.distance, {
        duration: motionTokens.presets.shake.durA,
        easing: motionTokens.presets.shake.easing,
        reduceMotion: ReduceMotion.System,
      }),
      withTiming(-motionTokens.presets.shake.distance, {
        duration: motionTokens.presets.shake.durA,
        easing: motionTokens.presets.shake.easing,
        reduceMotion: ReduceMotion.System,
      }),
      withTiming(motionTokens.presets.shake.overshoot, {
        duration: motionTokens.presets.shake.durB,
        easing: motionTokens.presets.shake.easing,
        reduceMotion: ReduceMotion.System,
      }),
      withTiming(0, {
        duration: motionTokens.presets.shake.durB,
        easing: motionTokens.presets.shake.easing,
        reduceMotion: ReduceMotion.System,
      })
    );
  };

  const nominalShakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nominalShakeX.value }],
  }));
  // Voice input state & refs
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSuccess, setVoiceSuccess] = useState<string | null>(null);

  const finalTranscriptRef = useRef<string>('');
  const currentTranscriptRef = useRef<string>('');
  const sessionFailedRef = useRef<boolean>(false);
  const activeCategoriesRef = useRef<Category[]>([]);
  const dateStrRef = useRef<string>(dateStr);
  dateStrRef.current = dateStr;

  // Abort speech recognition on unmount if active
  useEffect(() => {
    return () => {
      try {
        const mod = getSpeechRecognitionModule();
        mod?.abort();
      } catch {
        // no-op if module not active
      }
    };
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent('result', (event: ExpoSpeechRecognitionResultEvent) => {
    const currentText = event.results.map((r) => r.transcript).join(' ').trim();
    if (event.isFinal) {
      if (currentText) {
        if (finalTranscriptRef.current) {
          finalTranscriptRef.current += ' ' + currentText;
        } else {
          finalTranscriptRef.current = currentText;
        }
      }
      currentTranscriptRef.current = finalTranscriptRef.current;
      setVoiceTranscript(finalTranscriptRef.current);
    } else {
      const interimDisplay = finalTranscriptRef.current
        ? `${finalTranscriptRef.current} ${currentText}`.trim()
        : currentText;
      currentTranscriptRef.current = interimDisplay;
      setVoiceTranscript(interimDisplay);
    }
  });

  useSpeechRecognitionEvent('error', (event: ExpoSpeechRecognitionErrorEvent) => {
    sessionFailedRef.current = true;
    setIsListening(false);
    const mapped = mapSpeechError(event.error, event.message);
    setVoiceError(mapped);
    setVoiceSuccess(null);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    if (sessionFailedRef.current) {
      return;
    }

    const rawFinal =
      finalTranscriptRef.current.trim() || currentTranscriptRef.current.trim();
    if (!rawFinal) {
      setVoiceError('Tidak ada ucapan yang terdeteksi.');
      setVoiceSuccess(null);
      return;
    }

    const parseResult = parseVoiceTransaction(
      rawFinal,
      activeCategoriesRef.current,
      dateStrRef.current
    );

    if (!parseResult.ok) {
      setVoiceError(parseResult.error);
      setVoiceSuccess(null);
      return;
    }

    const {
      type: parsedType,
      amount,
      category,
      note: parsedNote,
      dateStr: parsedDateStr,
    } = parseResult.value;

    setType(parsedType);
    setRawAmount(amount);
    setAmountStr(rupiahFormatter.format(amount));
    setSelectedCategory(category);
    setNote(parsedNote);
    setDateStr(parsedDateStr);
    const [y, m, d] = parsedDateStr.split('-').map(Number);
    setDateObj(new Date(y, m - 1, d));

    setVoiceTranscript(rawFinal);
    setVoiceError(null);
    setErrorText(null);
    setVoiceSuccess('Hasil suara dimasukkan. Periksa sebelum menyimpan.');
  });

  const handleVoiceToggle = useCallback(async () => {
    const mod = getSpeechRecognitionModule();

    if (isListening) {
      try {
        await mod?.stop();
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
      }
      return;
    }

    Keyboard.dismiss();
    setVoiceTranscript('');
    setVoiceError(null);
    setVoiceSuccess(null);
    finalTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    sessionFailedRef.current = false;

    if (!mod) {
      if (Platform.OS === 'web') {
        setVoiceError(
          'Browser ini tidak mendukung Web Speech Recognition. Gunakan browser seperti Google Chrome.'
        );
      } else {
        setVoiceError(
          'Fitur pengenalan suara memerlukan development build native (tidak didukung di Expo Go). Jalankan npx expo run:android atau npx expo run:ios.'
        );
      }
      return;
    }

    try {
      const cats = await getActiveCategories();
      activeCategoriesRef.current = cats;

      const perm = await mod.requestPermissionsAsync();
      if (!perm.granted) {
        setVoiceError('Izin mikrofon atau pengenalan ucapan belum diberikan.');
        return;
      }

      mod.start({
        lang: 'id-ID',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal memulai pengenalan suara. Silakan coba lagi.';
      setVoiceError(msg);
    }
  }, [isListening]);
  // Load transaction if in edit mode
  useEffect(() => {
    if (!editId) return;

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const tx = await getTransactionById(editId);
        if (!isMounted) return;

        if (tx) {
          setType(tx.type);
          setRawAmount(tx.amount_idr);
          setAmountStr(rupiahFormatter.format(tx.amount_idr));
          setDateStr(tx.transaction_date);
          const [y, m, d] = tx.transaction_date.split('-').map(Number);
          setDateObj(new Date(y, m - 1, d));
          setNote(tx.note || '');
          setSelectedCategory({
            id: tx.category_id,
            name: tx.categoryName,
            type: tx.type,
            color: tx.categoryColor,
            archived_at: null,
            created_at: tx.created_at,
            updated_at: tx.updated_at,
          });
        }
      } catch (err) {
        console.error('Failed to load transaction for edit:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [editId]);

  // Handle amount change with formatting
  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 13);
    if (!digitsOnly) {
      setAmountStr('');
      setRawAmount(0);
      return;
    }

    const num = parseInt(digitsOnly, 10);
    setRawAmount(num);
    setAmountStr(rupiahFormatter.format(num));
    if (errorText) setErrorText(null);
  };

  // Handle type change
  const handleTypeChange = (newType: 'income' | 'expense') => {
    if (newType !== type) {
      setType(newType);
      // Clear category if it doesn't match the new type
      if (selectedCategory && selectedCategory.type !== newType) {
        setSelectedCategory(null);
      }
    }
  };

  // Handle Date picker change
  const handleDateValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    setDateObj(selected);
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, '0');
    const day = String(selected.getDate()).padStart(2, '0');
    setDateStr(`${year}-${month}-${day}`);
  };

  const handleDateDismiss = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  // Save Transaction
  const handleSave = async () => {
    if (rawAmount <= 0) {
      triggerNominalShake();
      setErrorText('Isi nominal lebih dari Rp0');
      return;
    }
    if (rawAmount > MAX_AMOUNT) {
      setErrorText('Nominal melebihi batas maksimal');
      return;
    }
    if (!selectedCategory) {
      setErrorText('Pilih kategori');
      return;
    }

    try {
      setSubmitting(true);
      setErrorText(null);

      if (isEditing && editId) {
        await updateTransaction(editId, {
          category_id: selectedCategory.id,
          type,
          amount_idr: rawAmount,
          transaction_date: dateStr,
          note: note.trim() || null,
        });
      } else {
        await insertTransaction({
          category_id: selectedCategory.id,
          type,
          amount_idr: rawAmount,
          transaction_date: dateStr,
          note: note.trim() || null,
        });
      }

      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan transaksi';
      setErrorText(msg);
      Alert.alert('Gagal', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.white }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.white }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={isEditing ? 'Perbarui transaksi' : 'Catat transaksi'}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Income / Expense Segmented Control */}
        <SegmentedControl
          segments={[
            { value: 'expense', label: '↗ Keluar' },
            { value: 'income', label: '↙ Masuk' },
          ]}
          selected={type}
          onChange={handleTypeChange}
          colorMap={{ expense: colors.ink, income: colors.ink }}
          style={styles.segmented}
        />

        {/* Voice Input Control */}
        <View style={styles.voiceSection}>
          <Button
            title={isListening ? 'Berhenti mendengarkan' : 'Isi dengan suara'}
            onPress={handleVoiceToggle}
            variant={isListening ? 'destructive' : 'outline'}
            size="md"
            icon={
              <Icon
                icon={Mic01Icon}
                size={18}
                color={isListening ? colors.white : colors.ink}
              />
            }
            accessibilityLabel={
              isListening
                ? 'Berhenti mendengarkan suara'
                : 'Isi formulir transaksi dengan suara'
            }
            fullWidth
            style={styles.voiceBtn}
          />

          {isListening || Boolean(voiceTranscript) || Boolean(voiceError) || Boolean(voiceSuccess) ? (
            <Animated.View
              entering={FadeInDown.duration(200)}
              exiting={FadeOutUp.duration(150)}
              style={[
                styles.voiceStatusCard,
                {
                  backgroundColor: voiceError
                    ? colors.errorBg
                    : isListening
                    ? colors.surfaceInput
                    : colors.surfaceDashed,
                  borderColor: voiceError
                    ? colors.errorBorder
                    : isListening
                    ? colors.primary
                    : colors.borderSecondary,
                },
              ]}
            >
              {isListening ? (
                <View style={styles.voiceListeningRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.voiceStatusTitle, { color: colors.primary }]}>
                    Mendengarkan ucapan...
                  </Text>
                </View>
              ) : null}

              {voiceTranscript ? (
                <Text
                  style={[
                    styles.voiceTranscriptText,
                    { color: isListening ? colors.muted : colors.ink },
                  ]}
                  numberOfLines={3}
                >
                  "{voiceTranscript}"
                </Text>
              ) : null}

              {voiceSuccess ? (
                <Text style={[styles.voiceSuccessText, { color: colors.primary }]}>
                  {voiceSuccess}
                </Text>
              ) : null}

              {voiceError ? (
                <Text style={[styles.voiceErrorText, { color: colors.red }]}>
                  {voiceError}
                </Text>
              ) : null}
            </Animated.View>
          ) : null}
        </View>
        {/* Nominal Field */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.ink }]}>Nominal</Text>
          <Animated.View style={[styles.moneyInputWrap, { borderBottomColor: colors.border }, nominalShakeAnimatedStyle]}>
            <Text style={[styles.moneyPrefix, { color: colors.muted }]}>Rp</Text>
            <RNTextInput
              style={[styles.moneyInput, { color: colors.ink }]}
              value={amountStr}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              inputMode="numeric"
              accessibilityLabel="Nominal dalam rupiah"
              autoFocus={!isEditing}
            />
          </Animated.View>
        </View>

        {/* Category Field */}
        <View style={styles.field}>
          <SelectField
            label="Kategori"
            value={selectedCategory?.name}
            placeholder="Pilih kategori"
            onPress={() => setPickerModalVisible(true)}
            leftIcon={
              selectedCategory ? (
                <CategoryDot
                  color={selectedCategory.color || colors.primary}
                  size="sm"
                />
              ) : null
            }
          />
        </View>

        {/* Date Field */}
        <View style={styles.field}>
          <SelectField
            label="Tanggal"
            value={formatDate(dateStr)}
            onPress={() => setShowDatePicker(true)}
            leftIcon={
              <Icon icon={Calendar01Icon} size={18} color={colors.muted} />
            }
          />
        </View>

        {/* Date Picker Component */}
        {showDatePicker ? (
          Platform.OS === 'ios' ? (
            <View style={[styles.iosDatePickerContainer, { backgroundColor: colors.surfaceInput, borderColor: colors.borderInput }]}>
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="spinner"
                onValueChange={handleDateValueChange}
                onDismiss={handleDateDismiss}
              />
              <Button
                title="Selesai"
                onPress={() => setShowDatePicker(false)}
                size="sm"
                style={styles.doneDateBtn}
              />
            </View>
          ) : (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              onValueChange={handleDateValueChange}
              onDismiss={handleDateDismiss}
            />
          )
        ) : null}

        {/* Note Field */}
        <View style={styles.field}>
          <TextInput
            label="Catatan (opsional)"
            value={note}
            onChangeText={setNote}
            placeholder="Contoh: Kopi sore, Gaji bulanan"
            maxLength={MAX_NOTE_LENGTH}
            charCount={{ current: note.length, max: MAX_NOTE_LENGTH }}
          />
        </View>

        {/* Error Text Banner */}
        {errorText ? (
          <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(150)}
            style={[styles.errorBanner, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
          >
            <Text style={[styles.errorBannerText, { color: colors.red }]}>{errorText}</Text>
          </Animated.View>
        ) : null}
        <Button
          title={isEditing ? 'Perbarui transaksi' : 'Simpan transaksi'}
          onPress={handleSave}
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          style={styles.saveBtn}
        />
      </ScrollView>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={pickerModalVisible}
        type={type}
        selectedId={selectedCategory?.id}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          if (errorText) setErrorText(null);
        }}
        onClose={() => setPickerModalVisible(false)}
        onManageCategories={() => router.push('/categories')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing['8'],
    paddingBottom: spacing['20'],
  },
  segmented: {
    marginBottom: spacing['12'],
  },
  field: {
    marginBottom: spacing['8'],
  },
  label: {
    ...typography.captionBold,
    marginBottom: spacing['3'],
  },
  moneyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    paddingBottom: spacing['4'],
    gap: spacing['4'],
  },
  moneyPrefix: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
  },
  moneyInput: {
    ...typography.displayLarge,
    flex: 1,
    letterSpacing: -0.5,
    padding: 0,
  },
  iosDatePickerContainer: {
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: spacing['5'],
    marginTop: -spacing['4'],
    marginBottom: spacing['8'],
    borderWidth: 1,
  },
  doneDateBtn: {
    marginTop: spacing['3'],
  },
  errorBanner: {
    marginBottom: spacing['8'],
    padding: spacing['5'],
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  errorBannerText: {
    ...typography.caption,
  },
  saveBtn: {
    marginTop: spacing['4'],
  },
  voiceSection: {
    marginBottom: spacing['6'],
  },
  voiceBtn: {
    marginBottom: spacing['3'],
  },
  voiceStatusCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    padding: spacing['4'],
    gap: spacing['2'],
  },
  voiceListeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  voiceStatusTitle: {
    ...typography.captionBold,
  },
  voiceTranscriptText: {
    ...typography.body,
    fontStyle: 'italic',
  },
  voiceSuccessText: {
    ...typography.captionBold,
  },
  voiceErrorText: {
    ...typography.caption,
  },
});
