import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import Clinic from "./steps/clinic"
import Sessions from "./steps/sessions"
import DateAndTime from "./steps/dateAndTime"

import Layout from "../../layout/Layout"
import { useBooking } from "../../../context/BookingContext"
import PatientInfo from "./steps/paitent.info"
import Summary from "./steps/Summery"

const BookingContent = () => {
  const { state, nextStep, prevStep } = useBooking()

  const renderStepComponent = () => {
    switch (state.currentStep) {
      case 1:
        return <Clinic />
      case 2:
        return <Sessions />
      case 3:
        return <DateAndTime />
      case 4:
        return <PatientInfo />
      case 5:
        return <Summary />
      default:
        return <Text>Invalid Step</Text>
    }
  }

  const getStepTitle = () => {
    switch (state.currentStep) {
      case 1:
        return "Select Clinic"
      case 2:
        return "Choose Sessions"
      case 3:
        return "Date & Time"
      case 4:
        return "Patient Information"
      case 5:
        return "Booking Summary"
      default:
        return "Booking"
    }
  }

  return (
    <Layout>
      <View style={styles.container}>
        {/* Progress Header */}
        <View style={styles.header}>
          <Text style={styles.stepTitle}>{getStepTitle()}</Text>
          <Text style={styles.stepCounter}>Step {state.currentStep} of 5</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(state.currentStep / 5) * 100}%` }]} />
          </View>
        </View>

        {/* Step Content */}
        <View style={styles.content}>{renderStepComponent()}</View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <View style={styles.buttonRow}>
            {state.currentStep > 1 && (
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={prevStep}>
                <Icon name="arrow-back" size={moderateScale(16)} color="#6366f1" />
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}

            {state.currentStep < 5 && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, state.currentStep === 1 && { flex: 1 }]}
                onPress={nextStep}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
                <Icon name="arrow-forward" size={moderateScale(16)} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Layout>
  )
}

export default function BookingNow() {
  return <BookingContent />
  
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  stepTitle: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: verticalScale(4),
  },
  stepCounter: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    marginBottom: verticalScale(12),
  },
  progressContainer: {
    height: verticalScale(4),
    backgroundColor: "#e5e7eb",
    borderRadius: scale(2),
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: scale(2),
  },
  content: {
    flex: 1,
  },
  navigationContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(12),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(8),
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#6366f1",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: moderateScale(16),
    fontWeight: "600",
    marginRight: scale(8),
  },
  secondaryButtonText: {
    color: "#6366f1",
    fontSize: moderateScale(16),
    fontWeight: "600",
    marginLeft: scale(8),
  },
})
