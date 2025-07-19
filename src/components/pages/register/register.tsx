"use client"

import { useEffect, useState } from "react"
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
} from "react-native"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import axios, { type AxiosError } from "axios"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import { API_ENDPOINT, LOCAL_API_ENDPOINT } from "../../../constant/url"
import { useAuth } from "../../../context/AuthContext"
import UniversalInput from "../../common/Input"
import UniversalButton from "../../common/Button"
import UniversalDivider from "../../common/Divider"
import GoogleButton from "../../common/GoogleButton"

const BASE_URL = process.env.NODE_ENV === "development" ? LOCAL_API_ENDPOINT : API_ENDPOINT

interface FormData {
  email: string
  password: string
  name: string
  phone: string
  termsAccepted: boolean
}

interface FormErrors {
  [key: string]: string
}

interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export default function Register({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
    phone: "",
    termsAccepted: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState("")
  const { saveTokenToStorage, fetchUserDetails } = useAuth()

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "288816992569-issuocqql1e0ssgs93ir8b2u6c9ihtdi.apps.googleusercontent.com",
    })
  }, [])

  const clearErrors = () => {
    setErrors({})
    setGeneralError("")
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[0-9]{10,15}$/.test(formData.phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Please enter a valid phone number"
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    // Terms validation
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
          return "Invalid request. Please check your input."
        case 401:
          return "Invalid credentials. Please try again."
        case 403:
          return "Access forbidden. Please contact support."
        case 404:
          return "Service not found. Please contact support."
        case 409:
          return "Account already exists with this email."
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

  const handleGoogleAuth = async () => {
    setGoogleLoading(true)
    clearErrors()
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      await GoogleSignin.signIn()
      const idToken = (await GoogleSignin.getTokens()).idToken
      if (!idToken) throw new Error("Unable to get Google authentication token")

      const response = await axios.post(
        `${BASE_URL}/user/verify-token-google-auth`,
        { token: idToken },
        { timeout: 10000 },
      )

      const token = response?.data?.token
      if (!token) throw new Error("Authentication failed. Please try again.")

      await saveTokenToStorage(token)
      await fetchUserDetails()
      Alert.alert("Success", "Welcome! You've been registered successfully.")
    } catch (error: any) {
      console.error("Google Sign-In error:", error)
      const errorMessage = handleApiError(error)
      setGeneralError(errorMessage)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleRegister = async (): Promise<void> => {
    clearErrors()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(
        `${BASE_URL}/user/register`,
        {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          termsAccepted: formData.termsAccepted,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      console.log(response.data)

      if (response.data.success) {
        Alert.alert(
          "Success",
          "Registration successful! Please check your email to verify your account.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("verify-otp", {
                  email: formData.email,
                  phone: formData.phone,
                  name: formData.name,
                })
              },
            },
          ],
          { cancelable: false },
        )
      } else {
        throw new Error(response.data.message || "Registration failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      const errorMessage = handleApiError(error)
      setGeneralError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    if (generalError) {
      setGeneralError("")
    }
  }

  const navigateToLogin = () => {
    navigation.navigate("Login")
  }

  const toggleTermsAcceptance = () => {
    handleInputChange("termsAccepted", !formData.termsAccepted)
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

              <Text style={styles.brandText}>DR. RAJNEES KANT CARE</Text>
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>Join us to start your healthcare journey</Text>
            </View>

            {/* Error Message */}
            {generalError ? (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={moderateScale(20)} color="#ef4444" />
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            ) : null}

            {/* Form Section */}
            <View style={styles.formContainer}>
              <UniversalInput
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                inputType="text"
                leftIcon="person"
                error={errors.name}
                required
              />

              <UniversalInput
                label="Phone Number"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(text) => handleInputChange("phone", text)}
                inputType="text"
                leftIcon="phone"
                keyboardType="phone-pad"
                error={errors.phone}
                required
              />

              <UniversalInput
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                inputType="email"
                leftIcon="email"
                error={errors.email}
                required
              />

              <UniversalInput
                label="Password"
                placeholder="Create a strong password"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                inputType="password"
                leftIcon="lock"
                showPasswordToggle={true}
                error={errors.password}
                required
              />

              {/* Terms and Conditions */}
              <TouchableOpacity style={styles.termsContainer} onPress={toggleTermsAcceptance} activeOpacity={0.7}>
                <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
                  {formData.termsAccepted && <Icon name="check" size={moderateScale(16)} color="#ffffff" />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {errors.termsAccepted && <Text style={styles.termsError}>{errors.termsAccepted}</Text>}

              {/* Register Button */}
              <UniversalButton
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                variant="primary"
                style={styles.registerButton}
                leftIcon="person-add"
              />

              {/* Divider */}
              <UniversalDivider text="or continue with" />



              <GoogleButton text="Sign Up With Google" loading={googleLoading}
                disabled={googleLoading} onPress={handleGoogleAuth} />
            </View>

            {/* Footer Section */}
            <View style={styles.footerContainer}>
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Already have an account? </Text>
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text style={styles.signUpLink}>Sign In</Text>
                </TouchableOpacity>
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
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(24),
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: verticalScale(32),
  },
  logoContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(16),
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
    marginBottom: verticalScale(8),
  },
  welcomeSubtitle: {
    fontSize: moderateScale(16),
    color: "#64748b",
    textAlign: "center",
    lineHeight: moderateScale(24),
    paddingHorizontal: scale(20),
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
  formContainer: {
    marginBottom: verticalScale(32),
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(24),
    paddingHorizontal: scale(4),
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: scale(4),
    marginRight: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(2),
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  termsText: {
    fontSize: moderateScale(14),
    color: "#64748b",
    flex: 1,
    lineHeight: moderateScale(20),
  },
  termsLink: {
    color: "#2563eb",
    fontWeight: "600",
  },
  termsError: {
    color: "#dc2626",
    fontSize: moderateScale(12),
    marginTop: verticalScale(-16),
    marginBottom: verticalScale(16),
    marginLeft: scale(4),
  },
  registerButton: {
    marginBottom: verticalScale(24),
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footerContainer: {
    alignItems: "center",
    marginTop: "auto",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(24),
  },
  signUpText: {
    fontSize: moderateScale(14),
    color: "#64748b",
  },
  signUpLink: {
    fontSize: moderateScale(14),
    color: "#2563eb",
    fontWeight: "600",
  },
  additionalLinksContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: scale(20),
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
  },
  linkText: {
    fontSize: moderateScale(12),
    color: "#64748b",
    marginLeft: scale(4),
  },
})
