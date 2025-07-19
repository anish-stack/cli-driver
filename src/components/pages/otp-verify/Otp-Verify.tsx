"use client"

import { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native"
import axios, { type AxiosError } from "axios"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import { API_ENDPOINT, LOCAL_API_ENDPOINT } from "../../../constant/url"
import { useAuth } from "../../../context/AuthContext"
import UniversalButton from "../../common/Button"
import { useRoute } from "@react-navigation/native"

const BASE_URL = process.env.NODE_ENV === "development" ? LOCAL_API_ENDPOINT : API_ENDPOINT

interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

interface FormErrors {
  [key: string]: string
}

export default function OtpVerify({ navigation }: { navigation: any }) {
  const route = useRoute()
  const { email, phone, name } = route.params || {}
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const { saveTokenToStorage, fetchUserDetails } = useAuth()

  // Refs for OTP inputs
  const otpRefs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    startCountdown()
  }, [])

  const startCountdown = () => {
    setCanResend(false)
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const clearErrors = () => {
    setErrors({})
    setGeneralError("")
  }

  const handleApiError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>

      if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
        const validationErrors = axiosError.response.data.errors
        const newErrors: Record<string, string> = {}
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            newErrors[field] = messages[0]
          }
        })
        setErrors(newErrors)
        return "Please fix the validation errors below"
      }

      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message
      }

      if (axiosError.code === "ECONNABORTED") {
        return "Request timeout. Please try again."
      }
      if (axiosError.code === "ERR_NETWORK") {
        return "Network error. Please check your connection."
      }

      switch (axiosError.response?.status) {
        case 400:
          return "Invalid OTP. Please check your input."
        case 401:
          return "Invalid or expired OTP. Please try again."
        case 403:
          return "Access forbidden. Please contact support."
        case 404:
          return "Service not found. Please contact support."
        case 429:
          return "Too many requests. Please wait before trying again."
        case 500:
          return "Server error. Please try again later."
        case 503:
          return "Service temporarily unavailable. Please try again later."
        default:
            return "Oops! Something went wrong. Please try again in a moment."
      }
    }
      return "Oops! Something went wrong. Please try again in a moment."
  }

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Clear errors when user starts typing
    if (generalError) {
      setGeneralError("")
    }

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      otpRefs.current[index - 1]?.focus()
    }
  }

  const validateOtp = (): boolean => {
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setGeneralError("Please enter the complete 6-digit OTP")
      return false
    }
    if (!/^\d{6}$/.test(otpString)) {
      setGeneralError("OTP must contain only numbers")
      return false
    }
    return true
  }

  const handleOTPVerify = async (): Promise<void> => {
    clearErrors()

    if (!validateOtp()) {
      return
    }

    setLoading(true)

    try {
      const otpString = otp.join("")
      const response = await axios.post(
        `${BASE_URL}/user/verify-email-otp`,
        {
          email: email,
          otp: otpString,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data.success && response.data.token) {
        await saveTokenToStorage(response.data.token)
        await fetchUserDetails()

        Alert.alert(
          "Success",
          "Your account has been verified successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Home" }],
                })
              },
            },
          ],
          { cancelable: false },
        )
      } else {
        throw new Error(response.data.message || "OTP verification failed")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      const errorMessage = handleApiError(error)
      setGeneralError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resendOTP = async (): Promise<void> => {
    if (!canResend) return

    setResendLoading(true)
    clearErrors()

    try {
      const response = await axios.post(
        `${BASE_URL}/user/resend-email-otp`,
        {
          email: email,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data.success) {
        Alert.alert("Success", "OTP has been resent to your email address.")
        setOtp(["", "", "", "", "", ""]) // Clear current OTP
        startCountdown() // Restart countdown
        otpRefs.current[0]?.focus() // Focus first input
      } else {
        throw new Error(response.data.message || "Failed to resend OTP")
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      const errorMessage = handleApiError(error)
      setGeneralError(errorMessage)
    } finally {
      setResendLoading(false)
    }
  }

  const navigateBack = () => {
    navigation.goBack()
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
                <Icon name="arrow-back" size={moderateScale(24)} color="#64748b" />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <Icon name="mark-email-read" size={moderateScale(40)} color="#2563eb" />
              </View>
              <Text style={styles.brandText}>DR. RAJNEES KANT CARE</Text>
              <Text style={styles.welcomeTitle}>Verify Your Email</Text>
              <Text style={styles.welcomeSubtitle}>
                We've sent a 6-digit verification code to{"\n"}
                <Text style={styles.emailText}>{email}</Text>
              </Text>
            </View>

            {/* Error Message */}
            {generalError ? (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={moderateScale(20)} color="#ef4444" />
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            ) : null}

            {/* OTP Input Section */}
            <View style={styles.otpContainer}>
              <Text style={styles.otpLabel}>Enter Verification Code</Text>
              <View style={styles.otpInputContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpRefs.current[index] = ref)}
                    style={[styles.otpInput, digit && styles.otpInputFilled, generalError && styles.otpInputError]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>
            </View>

            {/* Verify Button */}
            <UniversalButton
              title="Verify Code"
              onPress={handleOTPVerify}
              loading={loading}
              disabled={loading || otp.join("").length !== 6}
              variant="primary"
              style={styles.verifyButton}
              leftIcon="verified"
            />

            {/* Resend Section */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>

              {canResend ? (
                <TouchableOpacity onPress={resendOTP} disabled={resendLoading}>
                  <Text style={[styles.resendLink, resendLoading && styles.resendLinkDisabled]}>
                    {resendLoading ? "Sending..." : "Resend Code"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.countdownContainer}>
                  <Icon name="schedule" size={moderateScale(16)} color="#64748b" />
                  <Text style={styles.countdownText}>Resend in {formatTime(countdown)}</Text>
                </View>
              )}
            </View>

            {/* Footer Section */}
            <View style={styles.footerContainer}>
              <View style={styles.helpContainer}>
                <Icon name="help-outline" size={moderateScale(16)} color="#64748b" />
                <Text style={styles.helpText}>Having trouble? Contact our support team</Text>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(24),
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: verticalScale(40),
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: scale(8),
    zIndex: 1,
  },
  logoContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(16),
    marginTop: verticalScale(20),
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  brandText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
    marginBottom: verticalScale(8),
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: moderateScale(28),
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: verticalScale(12),
  },
  welcomeSubtitle: {
    fontSize: moderateScale(16),
    color: "#64748b",
    textAlign: "center",
    lineHeight: moderateScale(24),
    paddingHorizontal: scale(20),
  },
  emailText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    padding: scale(16),
    borderRadius: scale(12),
    marginBottom: verticalScale(24),
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: {
    color: "#dc2626",
    fontSize: moderateScale(14),
    flex: 1,
    lineHeight: moderateScale(20),
    marginLeft: scale(8),
  },
  otpContainer: {
    marginBottom: verticalScale(32),
  },
  otpLabel: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: verticalScale(20),
  },
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: scale(10),
  },
  otpInput: {
    width: scale(45),
    height: scale(55),
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: scale(12),
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: "#1e293b",
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otpInputFilled: {
    borderColor: "#2563eb",
    backgroundColor: "#f0f9ff",
  },
  otpInputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  verifyButton: {
    marginBottom: verticalScale(32),
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: verticalScale(40),
  },
  resendText: {
    fontSize: moderateScale(14),
    color: "#64748b",
    marginBottom: verticalScale(8),
  },
  resendLink: {
    fontSize: moderateScale(14),
    color: "#2563eb",
    fontWeight: "600",
  },
  resendLinkDisabled: {
    color: "#94a3b8",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
  },
  countdownText: {
    fontSize: moderateScale(14),
    color: "#64748b",
    fontWeight: "500",
    marginLeft: scale(4),
  },
  footerContainer: {
    alignItems: "center",
    marginTop: "auto",
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    backgroundColor: "#f8fafc",
    borderRadius: scale(8),
  },
  helpText: {
    fontSize: moderateScale(12),
    color: "#64748b",
    marginLeft: scale(6),
    textAlign: "center",
  },
  changeEmailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
  },
  changeEmailText: {
    fontSize: moderateScale(14),
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: scale(4),
  },
})
