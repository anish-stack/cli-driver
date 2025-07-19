
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
import FastImage from 'react-native-fast-image';
import logo from '../../../assets/images/logo.webp';
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import axios, { type AxiosError } from "axios"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/Ionicons"
import { API_ENDPOINT, LOCAL_API_ENDPOINT } from "../../../constant/url"
import { useAuth } from "../../../context/AuthContext"
import UniversalInput from "../../common/Input"
import UniversalButton from "../../common/Button"
import UniversalDivider from "../../common/Divider"
import GoogleButton from "../../common/GoogleButton";

const BASE_URL = process.env.NODE_ENV === "development" ? LOCAL_API_ENDPOINT : API_ENDPOINT

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  [key: string]: string
}

interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export default function Login({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" })
  const [errors, setErrors] = useState<FormErrors>({})

  const [generalError, setGeneralError] = useState("")
  const { saveTokenToStorage, fetchUserDetails, setGuestMode } = useAuth()

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "288816992569-issuocqql1e0ssgs93ir8b2u6c9ihtdi.apps.googleusercontent.com",
      offlineAccess: true,
    })
  }, [])

  const clearErrors = () => {
    setErrors({})
    setGeneralError("")
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
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
    setGoogleLoading(true);
    clearErrors();

    try {
      console.log("Checking Play Services...");
      try {
        const hasServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        console.log("Play Services Available:", hasServices);
      } catch (playServiceError) {
        console.error("Play Services Error:", playServiceError);
        throw new Error("Google Play Services are not available or outdated.");
      }

      let userInfo = null;
      try {
        console.log("Attempting to sign in...");
        userInfo = await GoogleSignin.signIn();
        console.log("Signed in user info:", userInfo);
      } catch (signInError) {
        console.error("Sign-in Error:", signInError);
        throw new Error("Google Sign-In failed.");
      }

      let idToken = null;
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken;
        console.log("Fetched ID Token:", idToken);
      } catch (tokenError) {
        console.error("Token Error:", tokenError);
        throw new Error("Failed to get Google authentication token.");
      }

      if (!idToken) throw new Error("Google ID Token not found.");

      let response;
      try {
        console.log("Sending token to backend...");
        response = await axios.post(
          `${BASE_URL}/user/verify-token-google-auth`,
          { token: idToken },
          { timeout: 10000 },
        );
        console.log("Backend Response:", response?.data);
      } catch (apiError) {
        console.error("API Error:", apiError);
        throw new Error("Failed to verify token with server.");
      }

      const token = response?.data?.token;
      if (!token) throw new Error("Authentication failed. No token received.");

      try {
        await saveTokenToStorage(token);
        console.log("Token saved to storage.");
      } catch (storageError) {
        console.error("Storage Error:", storageError);
        throw new Error("Failed to save token locally.");
      }

      try {
        await fetchUserDetails();
        console.log("User details fetched.");
      } catch (fetchError) {
        console.error("Fetch User Details Error:", fetchError);
      }

      Alert.alert(
        "Success",
        "Welcome! You've been logged in successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      const errorMessage = handleApiError(error);
      setGeneralError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return
    setLoading(true)
    clearErrors()
      console.log("BASE_URL", BASE_URL)

    try {
      const response = await axios.post(
        `${BASE_URL}/user/login-user`,
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      const { success, token, case: loginCase, message } = response.data
      console.log("response.data", response.data)

      if (!success) {
        throw new Error(message || "Login failed")
      }

      if (loginCase === "verify-otp") {
        navigation.navigate("verify-otp", { email: formData.email })
        return
      }

      await saveTokenToStorage(token)
      await fetchUserDetails()
      Alert.alert(
        "Success",
        "Welcome! You've been logged in successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          },
        ],
        { cancelable: false }
      );
      setLoading(false)
    } catch (error) {
      const errorMessage = handleApiError(error)
      console.log(error)
      setLoading(false)
      setGeneralError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    if (generalError) {
      setGeneralError("")
    }
  }

  const navigateToForgotPassword = () => {
    navigation.navigate("forgot-password")
  }

  const navigateToHomeAsAGuest = () => {
    setGuestMode(true)
    navigation.navigate("Home")
  }

  const navigateToRegister = () => {
    navigation.navigate("register")
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
              <View style={styles.logoContainer}>
                <FastImage
                  source={logo}
                  style={styles.logo}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>

              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>Sign in to your account to continue your healthcare journey</Text>
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
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                inputType="password"
                leftIcon="lock"
                showPasswordToggle={true}
                error={errors.password}
                required
              />

              {/* Forgot Password Link */}
              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={navigateToForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <UniversalButton
                title="Sign In"
                size={'small'}
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                variant="primary"
                style={styles.loginButton}
                leftIcon="login"
              />

              {/* Divider */}
              <UniversalDivider text="or continue with" />

              {/* Google Sign In Button */}


              <GoogleButton loading={googleLoading}
                disabled={googleLoading} onPress={handleGoogleAuth} />
              <UniversalDivider text="or continue as a Guest" />

              <UniversalButton
                title="Welcome Guest"
                onPress={navigateToHomeAsAGuest}

                leftIcon="person"
                variant="primary"
                size={'small'}
                fullWidth

              />
            </View>

            {/* Footer Section */}
            <View style={styles.footerContainer}>
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={navigateToRegister}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* Additional Links */}
              <View style={styles.additionalLinksContainer}>
                <TouchableOpacity style={styles.linkButton}>
                  <Icon name="help-circle" size={moderateScale(16)} color="#64748b" />
                  <Text style={styles.linkText}>Help & Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkButton}>
                  <Icon name="at" size={moderateScale(16)} color="#64748b" />
                  <Text style={styles.linkText}>Privacy Policy</Text>
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
    backgroundColor: "#fff",
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
    marginBottom: verticalScale(40),
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
    fontFamily: 'Poppins-Regular',
    color: "#1e293b",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  welcomeSubtitle: {
    fontSize: moderateScale(16),
    color: "#64748b",
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Regular',

    lineHeight: moderateScale(20),
    marginLeft: scale(8),
  },
  formContainer: {
    marginBottom: verticalScale(32),
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: verticalScale(24),
    marginTop: verticalScale(-8),
  },
  forgotPasswordText: {
    fontSize: moderateScale(14),
    color: "#2563eb",
    fontFamily: 'Poppins-Regular',
    fontWeight: "600",
  },
  loginButton: {
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
    fontFamily: 'Poppins-Regular',
  },
  signUpLink: {
    fontSize: moderateScale(14),
    color: "#2563eb",
    fontFamily: 'Poppins-Regular',
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
  logo: {
    borderRadius: 360,
    width: "100%",
    height: "100%"
  }
})
