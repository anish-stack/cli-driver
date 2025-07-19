"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  BackHandler,
} from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import RazorpayCheckout from "react-native-razorpay"
import axios from "axios"
import { useBooking } from "../../../../context/BookingContext"
import { useAuth } from "../../../../context/AuthContext"
import { API_ENDPOINT, LOCAL_API_ENDPOINT } from "../../../../constant/url"
import { useSettings } from "../../../../hooks/use-settings"
const BASE_URL = process.env.NODE_ENV === "development" ? LOCAL_API_ENDPOINT : API_ENDPOINT

// Types
type PaymentMethod = "online" | "card"
type BookingStatus =
  | "idle"
  | "booking"
  | "payment_processing"
  | "payment_success"
  | "payment_failed"
  | "payment_cancelled"
  | "booking_confirmed"

interface PaymentConfig {
  tax_percentage: number
  credit_card_fee: number
}

interface Settings {
  payment_config: PaymentConfig
}

interface BookingData {
  clinic_id: string
  patient_details: {
    name: string
    phone: string
    email: string
  }
  date: string
  time: string
  sessions: number
  payment_method: PaymentMethod
  amount: number
}

interface BookingResponse {
  success: boolean
  message?: string
  data: {
    booking: {
      id: string
      clinic_id: string
      patient_details: {
        name: string
        phone: string
      }
      date: string
      time: string
      sessions: number
      amount: number
      status: string
    }
    payment: {
      id: string
      key: string
      amount: number
      orderId: string
      currency: string
    }
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
  bookingId: string
  paymentId: string
}

interface RazorpayError {
  code: string
  description: string
  source: string
  step: string
  reason: string
  metadata: {
    order_id: string
    payment_id: string
  }
}

export default function Summary() {
  const { state, getPatientInfo, resetBooking } = useBooking()
  const { fetchUserDetails, token } = useAuth()

  // Local state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online")
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("idle")
  const [bookingId, setBookingId] = useState<string>("")
  const [paymentId, setPaymentId] = useState<string>("")
  const [transactionId, setTransactionId] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))
  const {settings} = useSettings()
  // Mock settings - replace with actual settings hook/context


  // Animation effect
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (bookingStatus === "payment_processing") {
        // Prevent back during payment
        return true
      }
      return false
    })

    return () => backHandler.remove()
  }, [bookingStatus])

  // Calculate amounts
  const sessionPrice = state.sessionPrice || 10000
  const totalAmount = sessionPrice * state.selectedSessions
  const taxAmount = Math.round((totalAmount * settings?.payment_config.tax_percentage) / 100)
  const cardFee =
    paymentMethod === "card"
      ? Math.round(((totalAmount + taxAmount) * settings?.payment_config.credit_card_fee) / 100)
      : 0
  const finalAmount = totalAmount + taxAmount + cardFee

  const patientInfo = getPatientInfo()

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Not selected"
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  useEffect(() => {
    fetchUserDetails()
  }, [token])



  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("en-IN")
  }

  const createBooking = async (): Promise<BookingResponse> => {
    console.log("token", token ? token : null)
    const bookingData: BookingData = {
      clinic_id: state.selectedClinic!._id,
      patient_details: {
        name: patientInfo.name,
        phone: patientInfo.phone,
        email: patientInfo.email,
      },
      date: state.selectedDate,
      time: state.selectedTime,
      sessions: state.selectedSessions,
      payment_method: paymentMethod,
      amount: finalAmount,
    }

    const response = await axios.post(
      `${BASE_URL}/user/bookings/sessions`,
      bookingData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    return response.data
  }

  const verifyPayment = async (paymentResponse: RazorpayResponse) => {
    try {

      const verificationData = {
        platform: 'app',
        booking_id: paymentResponse?.bookingId,
        payment_id: paymentResponse?.paymentId,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      }

      const response = await axios.post(
        `${BASE_URL}/user/bookings/verify-payment`,

        verificationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        setBookingStatus("booking_confirmed")
        setTransactionId(paymentResponse.razorpay_payment_id)
      } else {
        throw new Error(response.data.message || "Payment verification failed")
      }
    } catch (error: any) {
      console.error("Payment verification error:", error)
      setErrorMessage(error?.response?.data?.message || "Payment verification failed")
      setBookingStatus("payment_failed")
    }
  }

  const handlePaymentFailure = async (error: RazorpayError) => {
    try {
      const failureData = {
        booking_id: bookingId,
        payment_id: paymentId,
        error_code: error.code,
        error_description: error.description,
        error_source: error.source,
        error_step: error.step,
        error_reason: error.reason,
        timestamp: new Date().toISOString(),
      }

      await axios.post(`${BASE_URL}/user/bookings/payment-failed`, failureData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (err) {
      console.error("Error logging payment failure:", err)
    }
  }

  const handlePaymentCancellation = async () => {
    try {
      const cancellationData = {
        booking_id: bookingId,
        payment_id: paymentId,
        cancellation_reason: "user_cancelled",
        timestamp: new Date().toISOString(),
      }

      await axios.post(
        `${BASE_URL}/user/bookings/payment-cancelled`,
        cancellationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
    } catch (err) {
      console.error("Error logging payment cancellation:", err)
    }
  }

  const handlePayment = async () => {
    if (!state.selectedClinic?._id) {
      Alert.alert("Error", "Invalid clinic selection. Please try again.")
      return
    }

    if (!patientInfo.name || !patientInfo.phone || !patientInfo.email) {
      Alert.alert("Error", "Patient information is incomplete. Please go back and fill all details.")
      return
    }

    setBookingStatus("booking")
    setErrorMessage("")

    try {
      // Create booking first
      const bookingResponse = await createBooking()

      if (bookingResponse.success) {
        const { booking, payment } = bookingResponse.data

        setBookingId(booking.id)
        setPaymentId(booking.id)

        // Prepare Razorpay options
        const options = {
          description: `Consultation - ${state.selectedSessions} Session(s)`,
          image: "https://drkm.adsdigitalmedia.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.a5af08b2.webp&w=64&q=75", // Replace with your logo
          currency: "INR",
          key: payment.key,
          amount: payment.amount * 100, 
          order_id: payment.orderId,
          name: "🏥 Dr. Rajneesh Kant Clinic",
          prefill: {
            email: patientInfo.email,
            contact: patientInfo.phone,
            name: patientInfo.name,
          },
          theme: { color: "#84C3FF" },
          method: paymentMethod === "card" ? { card: true } : {},
        }

        setBookingStatus("payment_processing")

        // Open Razorpay
        RazorpayCheckout.open(options)
          .then((data: RazorpayResponse) => {
    
            const dataSend = {
              ...data,
              bookingId: booking.id,
              paymentId: booking.id
            }
            setBookingStatus("payment_success")
            verifyPayment(dataSend)
          })
          .catch((error: RazorpayError) => {
            // Payment Failed or Cancelled
            console.log("Payment Error:", error)

            if (error.code === "payment_cancelled") {
              setBookingStatus("payment_cancelled")
              setErrorMessage("Payment was cancelled by user")
              handlePaymentCancellation()
            } else {
              setBookingStatus("payment_failed")
              setErrorMessage(error.description || "Payment failed")
              handlePaymentFailure(error)
            }
          })
      } else {
        throw new Error(bookingResponse.message || "Booking creation failed")
      }
    } catch (error: any) {
      console.error("Error creating booking:", error)
      setBookingStatus("payment_failed")
      setErrorMessage(error?.response?.data?.message || "Booking creation failed")
    }
  }

  const handleRetryPayment = () => {
    setBookingStatus("idle")
    setErrorMessage("")
    setBookingId("")
    setPaymentId("")
    setTransactionId("")
  }

  const handleNewBooking = () => {
    resetBooking()
    setBookingStatus("idle")
    setErrorMessage("")
    setBookingId("")
    setPaymentId("")
    setTransactionId("")
  }

  const handleGoHome = () => {
    // Navigate to home screen
    // You can use navigation here
    resetBooking()
  }

  // Render different states
  if (bookingStatus === "booking") {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.statusTitle}>Creating Booking...</Text>
        <Text style={styles.statusText}>Please wait while we prepare your booking</Text>
      </View>
    )
  }

  if (bookingStatus === "payment_processing") {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.statusTitle}>Processing Payment...</Text>
        <Text style={styles.statusText}>Please complete the payment in the Razorpay window</Text>
        <Text style={styles.warningText}>⚠️ Do not press back or close the app</Text>
      </View>
    )
  }

  if (bookingStatus === "payment_success") {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.statusTitle}>Verifying Payment...</Text>
        <Text style={styles.statusText}>Please wait while we confirm your payment</Text>
      </View>
    )
  }

  if (bookingStatus === "booking_confirmed") {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <Icon name="check-circle" size={moderateScale(64)} color="#10b981" />
        </View>
        <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
        <Text style={styles.successText}>Your appointment has been successfully booked</Text>

        <View style={styles.confirmationDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID:</Text>
            <Text style={styles.detailValue}>{bookingId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue}>{transactionId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid:</Text>
            <Text style={styles.detailValue}>₹{formatCurrency(finalAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>
              {formatDate(state.selectedDate)} at {state.selectedTime}
            </Text>
          </View>
        </View>

        <View style={styles.successActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
            <Icon name="home" size={moderateScale(20)} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleNewBooking}>
            <Icon name="add" size={moderateScale(20)} color="#10b981" />
            <Text style={styles.secondaryButtonText}>Book Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (bookingStatus === "payment_failed") {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Icon name="error" size={moderateScale(64)} color="#ef4444" />
        </View>
        <Text style={styles.errorTitle}>Payment Failed</Text>
        <Text style={styles.errorText}>{errorMessage || "Something went wrong with your payment"}</Text>

        <View style={styles.errorDetails}>
          <Text style={styles.errorDetailText}>Don't worry, no amount has been deducted from your account.</Text>
          {bookingId && <Text style={styles.errorDetailText}>Booking ID: {bookingId}</Text>}
        </View>

        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetryPayment}>
            <Icon name="refresh" size={moderateScale(20)} color="#ffffff" />
            <Text style={styles.retryButtonText}>Retry Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleNewBooking}>
            <Icon name="close" size={moderateScale(20)} color="#6b7280" />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (bookingStatus === "payment_cancelled") {
    return (
      <View style={styles.cancelContainer}>
        <View style={styles.cancelIconContainer}>
          <Icon name="cancel" size={moderateScale(64)} color="#f59e0b" />
        </View>
        <Text style={styles.cancelTitle}>Payment Cancelled</Text>
        <Text style={styles.cancelText}>You cancelled the payment process</Text>

        <View style={styles.cancelDetails}>
          <Text style={styles.cancelDetailText}>Your booking is still reserved for a few minutes.</Text>
          <Text style={styles.cancelDetailText}>You can complete the payment to confirm your appointment.</Text>
          {bookingId && <Text style={styles.cancelDetailText}>Booking ID: {bookingId}</Text>}
        </View>

        <View style={styles.cancelActions}>
          <TouchableOpacity style={styles.continueButton} onPress={handleRetryPayment}>
            <Icon name="payment" size={moderateScale(20)} color="#ffffff" />
            <Text style={styles.continueButtonText}>Complete Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBookingButton} onPress={handleNewBooking}>
            <Icon name="close" size={moderateScale(20)} color="#6b7280" />
            <Text style={styles.cancelBookingButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Default booking form
  if (!state.selectedClinic) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={moderateScale(48)} color="#ef4444" />
        <Text style={styles.errorText}>No clinic selected</Text>
        <Text style={styles.errorSubtext}>Please go back and select a clinic.</Text>
      </View>
    )
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Icon name="payment" size={moderateScale(24)} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Payment & Confirmation</Text>
            <Text style={styles.headerSubtitle}>Review your booking details and complete the payment</Text>
          </View>
        </View>

        {/* Booking Summary */}
        <View style={styles.summarySection}>
          <View style={styles.sectionHeader}>
            <Icon name="event" size={moderateScale(20)} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Booking Summary</Text>
          </View>

          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location:</Text>
              <Text style={styles.summaryValue}>{state.selectedClinic.clinic_name || state.selectedClinic.name}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sessions:</Text>
              <Text style={styles.summaryValue}>
                {state.selectedSessions} session{state.selectedSessions > 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time:</Text>
              <View style={styles.dateTimeContainer}>
                <Text style={styles.summaryValue}>{formatDate(state.selectedDate)}</Text>
                <Text style={styles.timeText}>{state.selectedTime || "Not selected"}</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Patient:</Text>
              <View style={styles.patientContainer}>
                <Text style={styles.summaryValue}>{patientInfo.name}</Text>
                <Text style={styles.phoneText}>+91-{patientInfo.phone}</Text>
              </View>
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.separator} />

          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal:</Text>
              <Text style={styles.priceValue}>₹{formatCurrency(totalAmount)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tax ({settings?.payment_config.tax_percentage}%):</Text>
              <Text style={styles.priceValue}>₹{formatCurrency(taxAmount)}</Text>
            </View>

            {cardFee > 0 && (
              <View style={[styles.priceRow, styles.cardFeeRow]}>
                <Text style={styles.cardFeeLabel}>
                  Card Processing Fee ({settings?.payment_config.credit_card_fee}%):
                </Text>
                <Text style={styles.cardFeeValue}>₹{formatCurrency(cardFee)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>₹{formatCurrency(finalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <View style={styles.sectionHeader}>
            <Icon name="credit-card" size={moderateScale(20)} color="#10b981" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentOptions}>
            {/* Online Payment */}
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === "online" && styles.selectedPaymentOption]}
              onPress={() => setPaymentMethod("online")}
            >
              <View style={styles.paymentOptionContent}>
                <View style={[styles.paymentIcon, styles.onlinePaymentIcon]}>
                  <Icon name="account-balance-wallet" size={moderateScale(20)} color="#ffffff" />
                </View>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentTitle}>Online Payment</Text>
                  <Text style={styles.paymentSubtitle}>UPI, Net Banking, Digital Wallet</Text>
                  <Text style={styles.paymentBenefit}>✓ Secure & Instant</Text>
                </View>
                {paymentMethod === "online" && (
                  <View style={styles.selectedIndicator}>
                    <Icon name="check" size={moderateScale(16)} color="#ffffff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Card Payment */}
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === "card" && styles.selectedPaymentOption]}
              onPress={() => setPaymentMethod("card")}
            >
              <View style={styles.paymentOptionContent}>
                <View style={[styles.paymentIcon, styles.cardPaymentIcon]}>
                  <Icon name="credit-card" size={moderateScale(20)} color="#ffffff" />
                </View>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
                  <Text style={styles.paymentSubtitle}>Visa, Mastercard, RuPay</Text>
                  <Text style={styles.cardFeeText}>+{settings?.payment_config.credit_card_fee}% processing fee</Text>
                </View>
                <View style={styles.cardPaymentRight}>
                  {paymentMethod === "card" && (
                    <View style={styles.selectedIndicator}>
                      <Icon name="check" size={moderateScale(16)} color="#ffffff" />
                    </View>
                  )}
                  {paymentMethod === "card" && (
                    <View style={styles.cardFeeBadge}>
                      <Text style={styles.cardFeeBadgeText}>+₹{formatCurrency(cardFee)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Icon name="security" size={moderateScale(20)} color="#10b981" />
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Secure Payment</Text>
              <Text style={styles.securityText}>
                Your payment information is encrypted and secure. We use industry-standard security measures to protect
                your data.
              </Text>
            </View>
          </View>

          {/* Payment Button */}
          <TouchableOpacity
            style={[styles.paymentButton, !paymentMethod && styles.disabledButton]}
            onPress={handlePayment}
            disabled={!paymentMethod}
          >
            <Icon name="payment" size={moderateScale(20)} color="#ffffff" />
            <Text style={styles.paymentButtonText}>Complete Payment - ₹{formatCurrency(finalAmount)}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
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
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
    backgroundColor: "#f8fafc",
  },
  statusTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#1f2937",
    marginTop: verticalScale(20),
    textAlign: "center",
  },
  statusText: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    marginTop: verticalScale(8),
    textAlign: "center",
    lineHeight: moderateScale(20),
  },
  warningText: {
    fontSize: moderateScale(12),
    color: "#f59e0b",
    marginTop: verticalScale(16),
    textAlign: "center",
    fontWeight: "600",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
    backgroundColor: "#f8fafc",
  },
  successIconContainer: {
    marginBottom: verticalScale(20),
  },
  successTitle: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: verticalScale(8),
    textAlign: "center",
  },
  successText: {
    fontSize: moderateScale(16),
    color: "#6b7280",
    marginBottom: verticalScale(24),
    textAlign: "center",
  },
  confirmationDetails: {
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: verticalScale(24),
    width: "100%",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailLabel: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: moderateScale(14),
    color: "#1f2937",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  successActions: {
    flexDirection: "row",
    gap: scale(12),
    width: "100%",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    gap: scale(8),
  },
  primaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#ffffff",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: "#10b981",
    gap: scale(8),
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#10b981",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
    backgroundColor: "#f8fafc",
  },
  errorIconContainer: {
    marginBottom: verticalScale(20),
  },
  errorTitle: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: verticalScale(8),
    textAlign: "center",
  },
  errorText: {
    fontSize: moderateScale(16),
    color: "#6b7280",
    marginBottom: verticalScale(16),
    textAlign: "center",
    lineHeight: moderateScale(22),
  },
  errorSubtext: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    marginTop: verticalScale(8),
    textAlign: "center",
  },
  errorDetails: {
    backgroundColor: "#fef2f2",
    borderRadius: scale(8),
    padding: scale(16),
    marginBottom: verticalScale(24),
    width: "100%",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorDetailText: {
    fontSize: moderateScale(14),
    color: "#991b1b",
    textAlign: "center",
    marginBottom: verticalScale(4),
  },
  errorActions: {
    flexDirection: "row",
    gap: scale(12),
    width: "100%",
  },
  retryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    gap: scale(8),
  },
  retryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#ffffff",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: "#6b7280",
    gap: scale(8),
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#6b7280",
  },
  cancelContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
    backgroundColor: "#f8fafc",
  },
  cancelIconContainer: {
    marginBottom: verticalScale(20),
  },
  cancelTitle: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: verticalScale(8),
    textAlign: "center",
  },
  cancelText: {
    fontSize: moderateScale(16),
    color: "#6b7280",
    marginBottom: verticalScale(16),
    textAlign: "center",
  },
  cancelDetails: {
    backgroundColor: "#fffbeb",
    borderRadius: scale(8),
    padding: scale(16),
    marginBottom: verticalScale(24),
    width: "100%",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  cancelDetailText: {
    fontSize: moderateScale(14),
    color: "#92400e",
    textAlign: "center",
    marginBottom: verticalScale(4),
  },
  cancelActions: {
    flexDirection: "row",
    gap: scale(12),
    width: "100%",
  },
  continueButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    gap: scale(8),
  },
  continueButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#ffffff",
  },
  cancelBookingButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: "#6b7280",
    gap: scale(8),
  },
  cancelBookingButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#6b7280",
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
  summarySection: {
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
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
    alignItems: "flex-start",
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: "#f8fafc",
    borderRadius: scale(8),
  },
  summaryLabel: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    fontWeight: "500",
    flex: 1,
  },
  summaryValue: {
    fontSize: moderateScale(14),
    color: "#1f2937",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  dateTimeContainer: {
    flex: 2,
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: moderateScale(12),
    color: "#6b7280",
    marginTop: verticalScale(2),
  },
  patientContainer: {
    flex: 2,
    alignItems: "flex-end",
  },
  phoneText: {
    fontSize: moderateScale(12),
    color: "#6b7280",
    marginTop: verticalScale(2),
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: verticalScale(16),
  },
  priceBreakdown: {
    gap: verticalScale(8),
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    backgroundColor: "#ffffff",
    borderRadius: scale(8),
  },
  priceLabel: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: moderateScale(16),
    color: "#1f2937",
    fontWeight: "600",
  },
  cardFeeRow: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  cardFeeLabel: {
    fontSize: moderateScale(14),
    color: "#92400e",
    fontWeight: "500",
  },
  cardFeeValue: {
    fontSize: moderateScale(14),
    color: "#92400e",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    backgroundColor: "#dcfce7",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#10b981",
  },
  totalLabel: {
    fontSize: moderateScale(16),
    color: "#1f2937",
    fontWeight: "700",
  },
  totalValue: {
    fontSize: moderateScale(20),
    color: "#10b981",
    fontWeight: "700",
  },
  paymentSection: {
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
  paymentOptions: {
    gap: verticalScale(12),
    marginBottom: verticalScale(20),
  },
  paymentOption: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: scale(12),
    backgroundColor: "#ffffff",
  },
  selectedPaymentOption: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  paymentOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(16),
  },
  paymentIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  onlinePaymentIcon: {
    backgroundColor: "#10b981",
  },
  cardPaymentIcon: {
    backgroundColor: "#3b82f6",
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1f2937",
  },
  paymentSubtitle: {
    fontSize: moderateScale(12),
    color: "#6b7280",
    marginTop: verticalScale(2),
  },
  paymentBenefit: {
    fontSize: moderateScale(12),
    color: "#10b981",
    fontWeight: "500",
    marginTop: verticalScale(4),
  },
  cardFeeText: {
    fontSize: moderateScale(12),
    color: "#f59e0b",
    fontWeight: "500",
    marginTop: verticalScale(4),
  },
  cardPaymentRight: {
    alignItems: "flex-end",
    gap: verticalScale(8),
  },
  selectedIndicator: {
    width: scale(24),
    height: scale(24),
    backgroundColor: "#10b981",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  cardFeeBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  cardFeeBadgeText: {
    fontSize: moderateScale(12),
    color: "#92400e",
    fontWeight: "600",
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(16),
    backgroundColor: "#f0fdf4",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#10b981",
    marginBottom: verticalScale(20),
  },
  securityTextContainer: {
    flex: 1,
    marginLeft: scale(12),
  },
  securityTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: verticalScale(4),
  },
  securityText: {
    fontSize: moderateScale(12),
    color: "#6b7280",
    lineHeight: moderateScale(16),
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: verticalScale(16),
    borderRadius: scale(12),
    gap: scale(8),
  },
  disabledButton: {
    opacity: 0.5,
  },
  paymentButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#ffffff",
  },
})
