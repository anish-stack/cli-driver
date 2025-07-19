import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import logo from '../../../assets/images/logo.png';
import { APP_NAME } from '../../../constant/details';
import { COLORS, SIZES, WEIGHTS, SPACING, RADIUS } from '../../../constant/ui';
import { loginWithOtp, verifyOtp } from '../../../Store/slices/loginSlice';
import { getFCMToken } from '../../../utility/NotificationService';
import UniversalInput from '../../components/common/Input';
import UniversalDivider from '../../components/common/Divider';
import { validateAndFormatPhone } from '../../../utility/Validations';

const { width: screenWidth } = Dimensions.get('window');

export default function Login() {
  const { token, isAuthenticated, loading: authLoading, error: authError } = useSelector((state: any) => state.login);
  const [loading, setLoading] = useState<boolean>(false);
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState("8059025804");
  const [error, setError] = useState("");
  const [otpType, setOtpType] = useState<"text" | "whatsapp">("text");
  // Fix: Initial state should be false
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [modalOtpType, setModalOtpType] = useState<"text" | "whatsapp">("text");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (isAuthenticated && token) {
      navigation.navigate('Home' as never);
    }
  }, [isAuthenticated, token, navigation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const showToast = (message: string) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (error) setError("");
  };

  const handleOtpChange = (text: string) => {
    setOtp(text);
    if (otpError) setOtpError("");
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError("");

      const validationResult = validateAndFormatPhone(phone);
      console.log("validationResult", validationResult)
      if (!validationResult.isValid) {
        setError(validationResult.error || "Invalid phone number");
        setLoading(false);
        return;
      }

      const fcmToken = await getFCMToken();

      const result = await dispatch(loginWithOtp({
        formattedPhone: validationResult.formattedPhone,
        otpType,
        fcmToken,
        isGranted: !!fcmToken
      }));

      console.log("result", result)

      if (loginWithOtp.fulfilled.match(result)) {
        setFormattedPhone(validationResult.formattedPhone);
        setModalOtpType(otpType); // Maintain otpType for modal
        // Fix: Ensure modal opens after state is set
        setTimeout(() => {
          setShowOtpModal(true);
        }, 100);
        setResendTimer(30); // 30 second timer for resend
        showToast("OTP sent successfully!");
      } else {
        setError(result.payload || "Failed to send OTP");
      }
    } catch (err) {
      console.log("err", err)
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      setOtpError("");

      const fcmToken = await getFCMToken();

      const result = await dispatch(loginWithOtp({
        formattedPhone: formattedPhone,
        otpType: modalOtpType, // Use modal's otpType
        fcmToken,
        isGranted: !!fcmToken
      }));
      console.log("result", result)
      if (loginWithOtp.fulfilled.match(result)) {
        setResendTimer(30);
        showToast("OTP resent successfully!");
      } else {
        setOtpError(result.payload || "Failed to resend OTP");
      }
    } catch (err) {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setOtpLoading(true);
      setOtpError("");

      if (!otp || otp.length < 4) {
        setOtpError("Please enter a valid OTP");
        setOtpLoading(false);
        return;
      }

      const result = await dispatch(verifyOtp({
        number: formattedPhone,
        otp: otp,
        type: modalOtpType
      }));

      console.log("result", result)

      if (verifyOtp.fulfilled.match(result)) {
        setShowOtpModal(false);
        showToast("Login successful!");
        navigation.navigate('Home' as never);
      } else {
        setOtpError(result.payload || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp("");
    setOtpError("");
    setResendTimer(0);
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>{APP_NAME}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>
        </View>

        <View style={styles.formContainer}>
          <UniversalInput
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={15}
            error={error}
          />

          <View style={styles.otpTypeContainer}>
            <Text style={styles.otpTypeLabel}>Receive OTP via:</Text>
            <View style={styles.otpTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.otpTypeButton,
                  otpType === "text" && styles.otpTypeButtonActive
                ]}
                onPress={() => setOtpType("text")}
              >
                <Text style={[
                  styles.otpTypeButtonText,
                  otpType === "text" && styles.otpTypeButtonTextActive
                ]}>
                  SMS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.otpTypeButton,
                  otpType === "whatsapp" && styles.otpTypeButtonActive
                ]}
                onPress={() => setOtpType("whatsapp")}
              >
                <Text style={[
                  styles.otpTypeButtonText,
                  otpType === "whatsapp" && styles.otpTypeButtonTextActive
                ]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendOtpButton, (loading || authLoading) && styles.sendOtpButtonDisabled]}
            onPress={handleSendOtp}
            disabled={loading || authLoading}
          >
            {loading || authLoading ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.sendOtpButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          {authError && (
            <Text style={styles.errorText}>{authError}</Text>
          )}
        </View>

        <UniversalDivider />

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeOtpModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify OTP</Text>
              <TouchableOpacity onPress={closeOtpModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the 4-digit code sent to {formattedPhone} via {modalOtpType === "text" ? "SMS" : "WhatsApp"}
            </Text>

            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={handleOtpChange}
                placeholder="Enter OTP"
                keyboardType="numeric"
                maxLength={6}
                autoFocus={true}
              />
            </View>

            {otpError && (
              <Text style={styles.errorText}>{otpError}</Text>
            )}

            <TouchableOpacity
              style={[styles.verifyButton, otpLoading && styles.verifyButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={otpLoading}
            >
              {otpLoading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>
                  Resend OTP in {resendTimer}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendLoading}
                  style={styles.resendButton}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: verticalScale(SPACING.xl),
    paddingHorizontal: scale(SPACING.large),
  },
  logo: {
    width: scale(60),
    height: scale(60),
    marginBottom: verticalScale(SPACING.small),
  },
  appName: {
    fontSize: moderateScale(SIZES.xl),
    fontWeight: WEIGHTS.bold,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(SPACING.xl),
    paddingVertical: verticalScale(SPACING.large),
  },
  titleContainer: {
    marginBottom: verticalScale(SPACING.xxl),
  },
  title: {
    fontSize: moderateScale(SIZES.title),
    fontWeight: WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: verticalScale(SPACING.small),
  },
  subtitle: {
    fontSize: moderateScale(SIZES.medium),
    fontWeight: WEIGHTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: verticalScale(SPACING.xl),
  },
  otpTypeContainer: {
    marginVertical: verticalScale(SPACING.large),
  },
  otpTypeLabel: {
    fontSize: moderateScale(SIZES.small),
    fontWeight: WEIGHTS.medium,
    color: COLORS.text,
    marginBottom: verticalScale(SPACING.small),
  },
  otpTypeButtons: {
    flexDirection: 'row',
    gap: scale(SPACING.small),
  },
  otpTypeButton: {
    flex: 1,
    paddingVertical: verticalScale(SPACING.small),
    paddingHorizontal: scale(SPACING.medium),
    borderRadius: moderateScale(RADIUS.small),
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  otpTypeButtonText: {
    fontSize: moderateScale(SIZES.small),
    fontWeight: WEIGHTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  otpTypeButtonTextActive: {
    color: COLORS.background,
  },
  sendOtpButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(SPACING.medium),
    paddingHorizontal: scale(SPACING.large),
    borderRadius: moderateScale(RADIUS.medium),
    marginTop: verticalScale(SPACING.large),
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendOtpButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  sendOtpButtonText: {
    fontSize: moderateScale(SIZES.medium),
    fontWeight: WEIGHTS.semiBold,
    color: COLORS.background,
    textAlign: 'center',
  },
  errorText: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.error,
    textAlign: 'center',
    marginTop: verticalScale(SPACING.small),
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(SPACING.large),
  },
  footerText: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.textSecondary,
    marginRight: scale(SPACING.small),
  },
  footerLink: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.primary,
    fontWeight: WEIGHTS.semiBold,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fix: Ensure overlay has proper transparency
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(SPACING.large),
  },
  modalContainer: {
    width: '100%',
    maxWidth: screenWidth * 0.9,
    backgroundColor: COLORS.card || COLORS.background, // Fix: Fallback color
    borderRadius: moderateScale(RADIUS.large),
    paddingHorizontal: scale(SPACING.large),
    paddingVertical: verticalScale(SPACING.large),
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(SPACING.medium),
  },
  modalTitle: {
    fontSize: moderateScale(SIZES.large),
    fontWeight: WEIGHTS.bold,
    color: COLORS.text,
  },
  closeButton: {
    width: scale(30),
    height: scale(30),
    borderRadius: moderateScale(15),
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: moderateScale(SIZES.xl),
    color: COLORS.textSecondary,
    fontWeight: WEIGHTS.bold,
  },
  modalSubtitle: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(SPACING.large),
    lineHeight: moderateScale(20),
  },
  otpInputContainer: {
    marginBottom: verticalScale(SPACING.large),
  },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: moderateScale(RADIUS.medium),
    paddingHorizontal: scale(SPACING.medium),
    paddingVertical: verticalScale(SPACING.medium),
    fontSize: moderateScale(SIZES.medium),
    color: COLORS.text,
    textAlign: 'center',
    backgroundColor: COLORS.secondary,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(SPACING.medium),
    borderRadius: moderateScale(RADIUS.medium),
    marginBottom: verticalScale(SPACING.large),
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  verifyButtonText: {
    fontSize: moderateScale(SIZES.medium),
    fontWeight: WEIGHTS.semiBold,
    color: COLORS.background,
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendTimer: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.textSecondary,
  },
  resendButton: {
    paddingVertical: verticalScale(SPACING.small),
    paddingHorizontal: scale(SPACING.medium),
  },
  resendButtonText: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.primary,
    fontWeight: WEIGHTS.semiBold,
  },
});