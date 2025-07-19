import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useGetAllClinic } from "../../../../hooks/common"
import { useBooking } from "../../../../context/BookingContext"

// Type definitions (same as your original)
interface BookingAvailableAt {
  start_date: string
  end_date: string
}

interface Clinic {
  _id: string
  clinic_name?: string
  name?: string
  address?: string
  city?: string
  state?: string
  phone?: string
  email?: string
  clinic_contact_details?: {
    clinic_address?: string
    phone_numbers?: string[]
  }
  BookingAvailabeAt?: BookingAvailableAt
  isActive: boolean
}

type AvailabilityStatus = "available" | "upcoming" | "expired" | "not_set"

interface AvailabilityInfo {
  status: AvailabilityStatus
  message: string
}

export default function Clinic() {
  const { data, loading } = useGetAllClinic()
  const { state, setClinic } = useBooking()

  // Helper functions (same as your original)
  const isClinicAvailable = (clinic: Clinic): boolean => {
    if (!clinic.BookingAvailabeAt) return false
    const currentDate = new Date()
    const startDate = new Date(clinic.BookingAvailabeAt.start_date)
    const endDate = new Date(clinic.BookingAvailabeAt.end_date)
    return currentDate >= startDate && currentDate <= endDate
  }

  const formatDateRange = (BookingAvailabeAt: BookingAvailableAt): string => {
    const startDate = new Date(BookingAvailabeAt.start_date)
    const endDate = new Date(BookingAvailabeAt.end_date)
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    return `${startDate.toLocaleDateString("en-US", formatOptions)} - ${endDate.toLocaleDateString("en-US", formatOptions)}`
  }

  const getAvailabilityStatus = (clinic: Clinic): AvailabilityInfo => {
    if (!clinic.BookingAvailabeAt) {
      return { status: "not_set", message: "Booking dates not configured" }
    }
    const currentDate = new Date()
    const startDate = new Date(clinic.BookingAvailabeAt.start_date)
    const endDate = new Date(clinic.BookingAvailabeAt.end_date)
    if (currentDate < startDate) {
      return { status: "upcoming", message: "Booking opens soon" }
    } else if (currentDate > endDate) {
      return { status: "expired", message: "Booking period ended" }
    } else {
      return { status: "available", message: "Available for booking" }
    }
  }

  const handleSelected = (clinicId: string) => {
    const selectedClinicData = Object.values(data).find((clinic) => clinic._id === clinicId)
    if (selectedClinicData && isClinicAvailable(selectedClinicData)) {
      setClinic(selectedClinicData)
    }
  }

  // Status styling functions (same as your original)
  const getStatusBadgeColor = (status: AvailabilityStatus): string => {
    switch (status) {
      case "available":
        return "#dcfce7"
      case "upcoming":
        return "#fef3c7"
      case "expired":
        return "#fee2e2"
      case "not_set":
        return "#f1f5f9"
      default:
        return "#f1f5f9"
    }
  }

  const getStatusTextColor = (status: AvailabilityStatus): string => {
    switch (status) {
      case "available":
        return "#15803d"
      case "upcoming":
        return "#a16207"
      case "expired":
        return "#dc2626"
      case "not_set":
        return "#475569"
      default:
        return "#475569"
    }
  }

  const getStatusIcon = (status: AvailabilityStatus): string => {
    switch (status) {
      case "available":
        return "check-circle"
      case "upcoming":
        return "schedule"
      case "expired":
        return "cancel"
      case "not_set":
        return "help-outline"
      default:
        return "help-outline"
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading clinics...</Text>
      </View>
    )
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="location-off" size={moderateScale(48)} color="#9ca3af" />
        <Text style={styles.emptyText}>No clinic locations available</Text>
        <Text style={styles.emptySubText}>Please check back later</Text>
      </View>
    )
  }

  const clinics = Object.values(data) as Clinic[]

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {clinics.map((clinic) => {
          const isSelected = state.selectedClinic?._id === clinic._id
          const availabilityInfo = getAvailabilityStatus(clinic)
          const isAvailable = isClinicAvailable(clinic)

          return (
            <TouchableOpacity
              key={clinic._id}
              style={[styles.clinicCard, isSelected && styles.selectedCard, !isAvailable && styles.unavailableCard]}
              onPress={() => handleSelected(clinic._id)}
              disabled={!isAvailable}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                {/* Clinic Header */}
                <View style={styles.clinicHeader}>
                  <View style={styles.clinicInfo}>
                    <Text style={[styles.clinicName, isSelected && styles.selectedText]}>
                      {clinic?.clinic_name || "Unnamed Clinic"}
                    </Text>
                  </View>
                </View>

                {/* Address */}
                <View style={styles.addressContainer}>
                  <Text style={[styles.address, !isAvailable && styles.disabledText]}>
                    {clinic?.clinic_contact_details?.clinic_address || "Address not available"}
                  </Text>
                </View>

                {/* Booking Availability Status */}
                <View style={styles.statusSection}>
                  <View style={styles.statusHeader}>
                    <Icon name="event" size={moderateScale(16)} color="#3b82f6" />
                    <Text style={[styles.statusTitle, !isAvailable && styles.disabledText]}>Booking Status</Text>
                  </View>
                  <View style={styles.statusBadgeContainer}>
                    <View
                      style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(availabilityInfo.status) }]}
                    >
                      <Icon
                        name={getStatusIcon(availabilityInfo.status)}
                        size={moderateScale(12)}
                        color={getStatusTextColor(availabilityInfo.status)}
                      />
                      <Text style={[styles.statusBadgeText, { color: getStatusTextColor(availabilityInfo.status) }]}>
                        {availabilityInfo.message}
                      </Text>
                    </View>

                    {clinic.BookingAvailabeAt && (
                      <Text style={[styles.dateRange, !isAvailable && styles.disabledText]}>
                        Available: {formatDateRange(clinic.BookingAvailabeAt)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Contact Information */}
                {clinic?.clinic_contact_details?.phone_numbers &&
                  clinic.clinic_contact_details.phone_numbers.length > 0 && (
                    <View style={styles.contactSection}>
                      <View style={styles.contactHeader}>
                        <Icon name="phone" size={moderateScale(12)} color="#3b82f6" />
                        <Text style={[styles.contactTitle, !isAvailable && styles.disabledText]}>Contact Numbers</Text>
                      </View>
                      <View style={styles.phoneNumbersContainer}>
                        {clinic.clinic_contact_details.phone_numbers.map((phone, phoneIndex) => (
                          <View
                            key={`${clinic._id}-phone-${phoneIndex}`}
                            style={[styles.phoneBadge, !isAvailable && styles.disabledPhoneBadge]}
                          >
                            <Text style={[styles.phoneText, !isAvailable && styles.disabledText]}>{phone}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                {/* Disabled Overlay */}
                {!isAvailable && (
                  <View style={styles.disabledOverlay}>
                    <View style={styles.disabledMessage}>
                      <Icon name="block" size={moderateScale(16)} color="#64748b" />
                      <Text style={styles.disabledMessageText}>Currently Unavailable</Text>
                    </View>
                  </View>
                )}

                {/* Selection Indicator */}
                {isSelected && isAvailable && (
                  <View style={styles.selectionIndicator}>
                    <View style={styles.checkIcon}>
                      <Icon name="check" size={moderateScale(16)} color="#ffffff" />
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

// Styles (same as your original)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(16),
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: scale(20),
  },
  emptyText: {
    fontSize: moderateScale(18),
    color: "#6b7280",
    marginTop: verticalScale(16),
    textAlign: "center",
  },
  emptySubText: {
    fontSize: moderateScale(14),
    color: "#9ca3af",
    marginTop: verticalScale(8),
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
  },
  clinicCard: {
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    marginVertical: verticalScale(8),
    padding: scale(20),
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  selectedCard: {
    borderColor: "#3b82f6",
    borderWidth: 2,
    backgroundColor: "#f8faff",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  unavailableCard: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    opacity: 0.7,
  },
  cardContent: {
    flex: 1,
  },
  clinicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: verticalScale(5),
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: verticalScale(2),
  },
  selectedText: {
    color: "#3b82f6",
  },
  addressContainer: {
    marginBottom: verticalScale(16),
  },
  address: {
    fontSize: moderateScale(14),
    color: "#64748b",
    lineHeight: moderateScale(20),
  },
  disabledText: {
    color: "#94a3b8",
  },
  statusSection: {
    marginBottom: verticalScale(16),
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  statusTitle: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    color: "#1e293b",
    marginLeft: scale(6),
  },
  statusBadgeContainer: {
    gap: verticalScale(8),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(16),
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    marginLeft: scale(4),
  },
  dateRange: {
    fontSize: moderateScale(12),
    color: "#64748b",
    fontStyle: "italic",
  },
  contactSection: {
    marginBottom: verticalScale(16),
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  contactTitle: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    color: "#1e293b",
    marginLeft: scale(6),
  },
  phoneNumbersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
  },
  phoneBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  disabledPhoneBadge: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  phoneText: {
    fontSize: moderateScale(12),
    color: "#1d4ed8",
    fontWeight: "500",
  },
  disabledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  disabledMessage: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  disabledMessageText: {
    fontSize: moderateScale(14),
    color: "#64748b",
    marginLeft: scale(8),
  },
  selectionIndicator: {
    position: "absolute",
    top: scale(-8),
    right: scale(-8),
  },
  checkIcon: {
    width: scale(32),
    height: scale(32),
    backgroundColor: "#10b981",
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
})
