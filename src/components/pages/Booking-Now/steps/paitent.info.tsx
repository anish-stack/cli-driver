"use client"

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { useState, useEffect } from "react"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import axios from "axios"
import { __DEV__ } from "react-native"
import { usePatientInfo, useBooking } from "../../../../context/BookingContext"
import { useAuth } from "../../../../context/AuthContext"

export default function PatientInfo() {

  const { patientInfo, updatePatientField, setPatientInfo } = usePatientInfo()
  const { getPatientInfo } = useBooking()
  const { profileData, isAuthenticated ,saveTokenToStorage, fetchUserDetails } = useAuth()


  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [serverOtp, setServerOtp] = useState("")
  const [isBookingForSelf, setIsBookingForSelf] = useState(true)
  const [needsDetailedConsultation, setNeedsDetailedConsultation] = useState(false)

  // Populate form data from authenticated user profile
  useEffect(() => {
    if (isAuthenticated && profileData?.data) {
      const user = profileData.data
      const updates: any = {}

      if (user.name && !patientInfo.name) {
        updates.name = user.name
      }
      if (user.phone && !patientInfo.phone) {
        updates.phone = user.phone
      }
      if (user.email && !patientInfo.email) {
        updates.email = user.email
      }

      if (Object.keys(updates).length > 0) {
        setPatientInfo(updates)
      }
    }
  }, [isAuthenticated, profileData, patientInfo, setPatientInfo])

  // Safe input change handler
  const handleInputChange = (field: keyof typeof patientInfo, value: string) => {
    updatePatientField(field, value || "")
  }
console.log(isAuthenticated)
  useEffect(()=>{
       fetchUserDetails()
  },[])

  const handleSendOtp = async () => {
    // Safe access to phone number
    const phoneNumber = patientInfo.phone || ""
    if (phoneNumber.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number")
      return
    }

    const name = patientInfo.name || ""
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name")
      return
    }

    setIsRegistering(true)
    try {
      const { data } = await axios.post("https://drkm.api.adsdigitalmedia.com/api/v1/user/register-via-number", {
        phone: phoneNumber,
        name: name.trim(),
      })
      setServerOtp(data?.otp || "")
      setIsOtpSent(true)
      Alert.alert("Success", `OTP sent to +91-${phoneNumber}`)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to send OTP"
      Alert.alert("Error", errorMessage)
      console.error("Error sending OTP:", error)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpValue = otp || ""
    if (otpValue.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP")
      return
    }

    setIsVerifyingOtp(true)
    try {
      const response = await axios.post("https://drkm.api.adsdigitalmedia.com/api/v1/user/verify-email-otp", {
        number: patientInfo.phone || "",
        otp: otpValue,
      })
      if (response.data.success && response.data.token) {
        await saveTokenToStorage(response.data.token)
        await fetchUserDetails()
      setIsOtpVerified(true)
            Alert.alert("Success", "Phone number verified successfully!")

      } else {
        throw new Error(response.data.message || "OTP verification failed")
      }

    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Invalid OTP"
      Alert.alert("Error", errorMessage)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      await handleSendOtp()
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP")
    }
  }

  // Enhanced form validation
  const isFormValid = () => {
    const info = getPatientInfo();
    return (
      !!info.name?.trim() &&
      info.phone?.length === 10 &&
      !!info.email?.trim() &&
      (!isAuthenticated || isOtpVerified)
    );
  };

  // Safe getter functions
  const getPhoneLength = () => (patientInfo.phone || "").length
  const getOtpLength = () => (otp || "").length

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Icon name="person" size={moderateScale(24)} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Patient Information</Text>
            <Text style={styles.headerSubtitle}>Enter your contact details to complete the booking</Text>
            {__DEV__ && serverOtp && <Text style={styles.devOtpText}>Dev OTP: {serverOtp}</Text>}
          </View>
        </View>

        {/* Booking Preferences */}
        <View style={styles.preferencesSection}>
          <Text style={styles.preferencesTitle}>Booking Preferences</Text>

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsBookingForSelf(!isBookingForSelf)}>
            <View style={[styles.checkbox, isBookingForSelf && styles.checkedCheckbox]}>
              {isBookingForSelf && <Icon name="check" size={moderateScale(16)} color="#ffffff" />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>Booking for myself</Text>
              <Text style={styles.checkboxSubtext}>I am the patient</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setNeedsDetailedConsultation(!needsDetailedConsultation)}
          >
            <View style={[styles.checkbox, needsDetailedConsultation && styles.checkedCheckbox]}>
              {needsDetailedConsultation && <Icon name="check" size={moderateScale(16)} color="#ffffff" />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>Detailed consultation needed</Text>
              <Text style={styles.checkboxSubtext}>Requires comprehensive examination</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Icon name="person" size={moderateScale(16)} color="#10b981" />{" "}
              {isBookingForSelf ? "Your Name" : "Patient Name"}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={isBookingForSelf ? "Enter your full name" : "Enter patient's full name"}
              value={patientInfo.name}
              onChangeText={(value) => handleInputChange("name", value)}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Icon name="email" size={moderateScale(16)} color="#10b981" /> Email Address
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter email address"
              value={patientInfo.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Icon name="phone" size={moderateScale(16)} color="#10b981" /> Phone Number
            </Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.phoneInput}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.phoneTextInput}
                  placeholder="Enter 10-digit number"
                  value={patientInfo.phone}
                  onChangeText={(value) => handleInputChange("phone", value.replace(/\D/g, "").slice(0, 10))}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              {(!isAuthenticated || isOtpVerified) && (
                <TouchableOpacity
                  style={[styles.otpButton, (getPhoneLength() !== 10 || isOtpSent) && styles.disabledButton]}
                  onPress={handleSendOtp}
                  disabled={getPhoneLength() !== 10 || isOtpSent || isRegistering}
                >
                  {isRegistering ? (
                    <Text style={styles.buttonText}>Sending...</Text>
                  ) : isOtpSent ? (
                    <Icon name="check" size={moderateScale(16)} color="#ffffff" />
                  ) : (
                    <Icon name="send" size={moderateScale(16)} color="#ffffff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* OTP Verification */}
          {isOtpSent && !isOtpVerified && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Icon name="security" size={moderateScale(16)} color="#10b981" /> Enter OTP
              </Text>
              <View style={styles.otpInputContainer}>
                <TextInput
                  style={styles.otpTextInput}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  style={[styles.verifyButton, (getOtpLength() !== 6 || isOtpVerified) && styles.disabledButton]}
                  onPress={handleVerifyOtp}
                  disabled={getOtpLength() !== 6 || isOtpVerified || isVerifyingOtp}
                >
                  {isVerifyingOtp ? (
                    <Text style={styles.buttonText}>Verifying...</Text>
                  ) : isOtpVerified ? (
                    <Icon name="check" size={moderateScale(16)} color="#ffffff" />
                  ) : (
                    <Icon name="security" size={moderateScale(16)} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp}>
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Verification Success */}
          {isOtpVerified && (
            <View style={styles.verificationSuccess}>
              <Icon name="check-circle" size={moderateScale(20)} color="#10b981" />
              <Text style={styles.verificationSuccessText}>Phone number verified successfully!</Text>
            </View>
          )}


        </View>

        {/* Summary */}
        {isFormValid() && (
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Icon name="person-outline" size={moderateScale(20)} color="#10b981" />
              <Text style={styles.summaryTitle}>Patient Summary</Text>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Name:</Text>
                <Text style={styles.summaryValue}>{patientInfo.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phone:</Text>
                <Text style={styles.summaryValue}>+91-{patientInfo.phone}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Email:</Text>
                <Text style={styles.summaryValue}>{patientInfo.email}</Text>
              </View>

              {/* Preferences */}
              <View style={styles.preferencesRow}>
                {isBookingForSelf && (
                  <View style={styles.preferenceBadge}>
                    <Icon name="person" size={moderateScale(12)} color="#3b82f6" />
                    <Text style={styles.preferenceBadgeText}>Self Booking</Text>
                  </View>
                )}
                {needsDetailedConsultation && (
                  <View style={styles.preferenceBadge}>
                    <Icon name="description" size={moderateScale(12)} color="#8b5cf6" />
                    <Text style={styles.preferenceBadgeText}>Detailed Consultation</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: scale(20),
    borderRadius: scale(12),
    marginBottom: verticalScale(16),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerIconContainer: {
    width: scale(48),
    height: scale(48),
    backgroundColor: "#10b981",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(16),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    marginTop: verticalScale(4),
  },
  devOtpText: {
    fontSize: moderateScale(12),
    color: "#ef4444",
    marginTop: verticalScale(4),
    fontWeight: "600",
  },
  preferencesSection: {
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: verticalScale(16),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  preferencesTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: verticalScale(12),
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: scale(4),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  checkedCheckbox: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    color: "#1f2937",
  },
  checkboxSubtext: {
    fontSize: moderateScale(12),
    color: "#6b7280",
    marginTop: verticalScale(2),
  },
  formSection: {
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: verticalScale(16),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#374151",
    marginBottom: verticalScale(8),
  },
  textInput: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  textArea: {
    height: verticalScale(100),
    textAlignVertical: "top",
  },
  phoneInputContainer: {
    flexDirection: "row",
    gap: scale(12),
  },
  phoneInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: scale(12),
    backgroundColor: "#ffffff",
  },
  countryCode: {
    paddingLeft: scale(16),
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#6b7280",
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: "#1f2937",
  },
  otpButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    minWidth: scale(60),
  },
  verifyButton: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    minWidth: scale(80),
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  otpInputContainer: {
    flexDirection: "row",
    gap: scale(12),
  },
  otpTextInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: "#1f2937",
    backgroundColor: "#ffffff",
    textAlign: "center",
    fontFamily: "monospace",
  },
  resendButton: {
    alignSelf: "center",
    marginTop: verticalScale(8),
  },
  resendButtonText: {
    color: "#3b82f6",
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  verificationSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: verticalScale(12),
  },
  verificationSuccessText: {
    color: "#166534",
    fontSize: moderateScale(14),
    fontWeight: "500",
    marginLeft: scale(8),
  },
  genderContainer: {
    flexDirection: "row",
    gap: scale(8),
  },
  genderOption: {
    flex: 1,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: scale(12),
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  selectedGenderOption: {
    borderColor: "#10b981",
    backgroundColor: "#dcfce7",
  },
  genderOptionText: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    fontWeight: "500",
  },
  selectedGenderOptionText: {
    color: "#166534",
    fontWeight: "600",
  },
  summarySection: {
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: verticalScale(16),
    borderWidth: 2,
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  summaryTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1f2937",
    marginLeft: scale(8),
  },
  summaryContent: {
    gap: verticalScale(12),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    backgroundColor: "#f8fafc",
    borderRadius: scale(8),
  },
  summaryLabel: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: moderateScale(14),
    color: "#1f2937",
    fontWeight: "600",
  },
  preferencesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: verticalScale(8),
  },
  preferenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    backgroundColor: "#f3f4f6",
    borderRadius: scale(16),
  },
  preferenceBadgeText: {
    fontSize: moderateScale(12),
    color: "#374151",
    fontWeight: "500",
    marginLeft: scale(4),
  },
})
