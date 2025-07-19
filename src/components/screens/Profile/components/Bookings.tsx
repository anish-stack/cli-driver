import type React from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl, FlatList, ActivityIndicator, Dimensions } from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import Feather from "react-native-vector-icons/Feather"
import { useGetBooking } from "../../../../hooks/useGetBooking"
import { useState, useMemo, useEffect } from "react"

const { width } = Dimensions.get('window')

// Define interfaces - Updated to match your actual data structure
interface SessionDate {
  _id: string
  sessionNumber: number
  date: string
  time: string
  status: "Pending" | "Confirmed" | "Rescheduled" | "Completed" | "Cancelled"
  rescheduleHistory: any[]
}

interface Doctor {
  _id: string
  doctor_name: string
  specialization: string[]
  languagesSpoken: string[]
  doctor_ratings: number
}

interface Clinic {
  _id: string
  clinic_name: string
  clinic_contact_details: {
    email: string
    phone_numbers: string[]
    clinic_address: string
  }
  clinic_ratings: number
}

interface PatientDetails {
  name: string
  email: string
  phone: string
}

interface Payment {
  _id: string
  amount: number
  status: string
  paymentMethod: string
  payment_details: {
    subtotal: string
    tax: string
    total: string
  }
}

interface Booking {
  _id: string
  patient_details: PatientDetails
  SessionDates: SessionDate[]
  session_booking_for_doctor: Doctor
  session_booking_for_clinic: Clinic
  session_status: string
  payment_id: Payment
  totalAmount: number
  amountPerSession: number
  bookingNumber: string
  no_of_session_book: number
  completedSessionsCount: number
  progressPercentage: number
  nextSession?: SessionDate
  createdAt: string
  updatedAt: string
}

interface BookingData {
  current: Booking[]
  history: Booking[]
  summary: {
    totalBookings: number
    currentBookingsCount: number
    historyBookingsCount: number
    todaySessionsCount: number
  }
}

interface NextAppointmentData extends SessionDate {
  booking: Booking
}

const ITEMS_PER_PAGE = 5

const Bookings: React.FC = ({ navigation ,isFetch }) => {
  const {
    data: bookingData,
    loading: bookingLoading,
    error: bookingError,
    fetchBooking: refetchBookings,
  } = useGetBooking()

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTab, setSelectedTab] = useState<'current' | 'history'>('current')

  const typedBookingData = bookingData as BookingData | undefined
  const currentBookings: Booking[] = typedBookingData?.current || []
  const historyBookings: Booking[] = typedBookingData?.history || []
  const summary = typedBookingData?.summary

  // Get next appointment from current bookings
  const getNextAppointment = (): NextAppointmentData | null => {
    const today = new Date()
    let nextAppointment: NextAppointmentData | null = null
    let nearestDate: Date | null = null

    currentBookings.forEach((booking) => {
      if (booking.SessionDates && Array.isArray(booking.SessionDates)) {
        booking.SessionDates.forEach((session) => {
          if (["Pending", "Confirmed", "Rescheduled"].includes(session.status)) {
            const sessionDate = new Date(session.date)
            if (
              !isNaN(sessionDate.getTime()) &&
              sessionDate >= today &&
              (!nearestDate || sessionDate < nearestDate)
            ) {
              nearestDate = sessionDate
              nextAppointment = {
                ...session,
                booking,
              }
            }
          }
        })
      }
    })
    return nextAppointment
  }

  // Get paginated appointments
  const getPaginatedAppointments = useMemo(() => {
    const bookingsToShow = selectedTab === 'current' ? currentBookings : historyBookings
    const allAppointments: NextAppointmentData[] = []

    bookingsToShow.forEach((booking) => {
      if (booking.SessionDates && Array.isArray(booking.SessionDates)) {
        booking.SessionDates.forEach((session) => {
          allAppointments.push({
            ...session,
            booking,
          })
        })
      }
    })

    // Sort appointments by date
    const sortedAppointments = allAppointments.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedAppointments = sortedAppointments.slice(startIndex, endIndex)
    const totalPages = Math.ceil(sortedAppointments.length / ITEMS_PER_PAGE)

    return {
      appointments: paginatedAppointments,
      totalPages,
      totalCount: sortedAppointments.length,
    }
  }, [currentBookings, historyBookings, selectedTab, currentPage])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" }
      case "Pending":
        return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" }
      case "Rescheduled":
        return { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" }
      case "Completed":
        return { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" }
      case "Cancelled":
        return { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" }
      default:
        return { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" }
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    return date.toLocaleDateString("en-US", options)
  }

  const formatShortDate = (dateString: string): { day: string; month: string } => {
    const date = new Date(dateString)
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    }
  }

  const handleViewDetails = (appointment: NextAppointmentData) => {
    Alert.alert(
      "Appointment Details",
      `Doctor: ${appointment.booking.session_booking_for_doctor.doctor_name}\nDate: ${formatDate(appointment.date)}\nTime: ${appointment.time}\nStatus: ${appointment.status}\nBooking Number: ${appointment.booking.bookingNumber}`
    )
  }

  const handleReschedule = (appointment: NextAppointmentData) => {
    Alert.alert("Reschedule", `Reschedule appointment on ${formatDate(appointment.date)}`)
  }

  const handleBookNew = () => {
    navigation.navigate('booking-now')
  }

  const handleTabChange = (tab: 'current' | 'history') => {
    setSelectedTab(tab)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(()=>{
    refetchBookings()
  },[isFetch])


  const nextAppointment = getNextAppointment()
  const { appointments, totalPages, totalCount } = getPaginatedAppointments

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <TouchableOpacity
          key="prev"
          style={styles.paginationButton}
          onPress={() => handlePageChange(currentPage - 1)}
        >
          <Feather name="chevron-left" size={moderateScale(16)} color="#6366F1" />
        </TouchableOpacity>
      )
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.paginationButton,
            currentPage === i && styles.paginationButtonActive,
          ]}
          onPress={() => handlePageChange(i)}
        >
          <Text
            style={[
              styles.paginationText,
              currentPage === i && styles.paginationTextActive,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      )
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <TouchableOpacity
          key="next"
          style={styles.paginationButton}
          onPress={() => handlePageChange(currentPage + 1)}
        >
          <Feather name="chevron-right" size={moderateScale(16)} color="#6366F1" />
        </TouchableOpacity>
      )
    }

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationInfo}>
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} appointments
        </Text>
        <View style={styles.paginationButtons}>{pages}</View>
      </View>
    )
  }

  const renderAppointmentItem = ({ item: appointment }: { item: NextAppointmentData }) => {
    const { day, month } = formatShortDate(appointment.date)
    const statusColors = getStatusColor(appointment.status)

    return (
      <View style={styles.appointmentItem}>
        <View style={styles.appointmentItemHeader}>
          <View style={styles.appointmentDate}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateMonth}>{month}</Text>
          </View>

          <View style={styles.appointmentItemDetails}>
            <Text style={styles.appointmentDoctorName}>
              {appointment.booking.session_booking_for_doctor.doctor_name}
            </Text>
            <Text style={styles.appointmentClinic}>
              {appointment.booking.session_booking_for_clinic.clinic_name}
            </Text>
            <View style={styles.appointmentMetaRow}>
              <View style={styles.appointmentMeta}>
                <Feather name="clock" size={moderateScale(12)} color="#6366F1" />
                <Text style={styles.appointmentTime}>{appointment.time}</Text>
              </View>
              <View style={styles.appointmentMeta}>
                <Feather name="hash" size={moderateScale(12)} color="#6366F1" />
                <Text style={styles.sessionNumber}>Session {appointment.sessionNumber}</Text>
              </View>
            </View>
          </View>

          <View style={styles.appointmentRight}>
            <View style={[styles.appointmentStatus, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.appointmentStatusText, { color: statusColors.text }]}>
                {appointment.status}
              </Text>
            </View>
            <Text style={styles.bookingNumber}>
              {appointment.booking.bookingNumber}
            </Text>
          </View>
        </View>

        <View style={styles.appointmentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewDetails(appointment)}
            activeOpacity={0.7}
          >
            <Feather name="eye" size={moderateScale(14)} color="#6366F1" />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          {appointment.status !== "Completed" && appointment.status !== "Cancelled" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleReschedule(appointment)}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={moderateScale(14)} color="#6366F1" />
              <Text style={styles.actionButtonText}>Reschedule</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  if (bookingError) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={moderateScale(48)} color="#EF4444" />
        <Text style={styles.errorTitle}>Unable to load bookings</Text>
        <Text style={styles.errorMessage}>Please try again later</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchBookings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={bookingLoading} onRefresh={refetchBookings} />}
    >
      {/* Summary Stats */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="event" size={moderateScale(20)} color="#6366F1" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryNumber}>{summary.totalBookings}</Text>
              <Text style={styles.summaryLabel}>Total Bookings</Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="schedule" size={moderateScale(20)} color="#10B981" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryNumber}>{summary.currentBookingsCount}</Text>
              <Text style={styles.summaryLabel}>Current</Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="history" size={moderateScale(20)} color="#8B5CF6" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryNumber}>{summary.historyBookingsCount}</Text>
              <Text style={styles.summaryLabel}>History</Text>
            </View>
          </View>
        </View>
      )}

      {/* Next Appointment Card */}
      {nextAppointment && (
        <View style={styles.nextAppointmentCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerContent}>
              <Feather name="calendar" size={moderateScale(20)} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Next Appointment</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.appointmentRow}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="medical-services" size={moderateScale(24)} color="#FFFFFF" />
              </View>

              <View style={styles.appointmentDetails}>
                <Text style={styles.doctorName}>
                  {nextAppointment.booking.session_booking_for_doctor.doctor_name}
                </Text>
                <Text style={styles.clinicName}>
                  {nextAppointment.booking.session_booking_for_clinic.clinic_name}
                </Text>

                <View style={styles.appointmentInfo}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Feather name="calendar" size={moderateScale(14)} color="#6366F1" />
                      <Text style={styles.infoText}>{formatDate(nextAppointment.date)}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Feather name="clock" size={moderateScale(14)} color="#6366F1" />
                      <Text style={styles.infoText}>{nextAppointment.time}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Feather name="map-pin" size={moderateScale(14)} color="#6366F1" />
                      <Text style={styles.infoText} numberOfLines={2}>
                        {nextAppointment.booking.session_booking_for_clinic.clinic_contact_details.clinic_address}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.badgeContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(nextAppointment.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(nextAppointment.status).text }]}>
                      {nextAppointment.status}
                    </Text>
                  </View>
                  <View style={styles.sessionBadge}>
                    <Text style={styles.sessionText}>Session {nextAppointment.sessionNumber}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleViewDetails(nextAppointment)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleReschedule(nextAppointment)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Appointments Section */}
      <View style={styles.appointmentsCard}>
        {/* Tab Header */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'current' && styles.tabButtonActive]}
            onPress={() => handleTabChange('current')}
          >
            <Text style={[styles.tabText, selectedTab === 'current' && styles.tabTextActive]}>
              Current ({currentBookings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'history' && styles.tabButtonActive]}
            onPress={() => handleTabChange('history')}
          >
            <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
              History ({historyBookings.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appointments List */}
        {bookingLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : appointments.length > 0 ? (
          <>
            <FlatList
              data={appointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item) => `${item._id}-${item.sessionNumber}`}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            {renderPagination()}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Feather name="calendar" size={moderateScale(32)} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyStateTitle}>
              {selectedTab === 'current' ? 'No Current Appointments' : 'No Appointment History'}
            </Text>
            <Text style={styles.emptyStateDescription}>
              {selectedTab === 'current'
                ? 'Schedule your next appointment to continue your treatment.'
                : 'Your completed appointments will appear here.'}
            </Text>
            {selectedTab === 'current' && (
              <TouchableOpacity style={styles.bookButton} onPress={handleBookNew} activeOpacity={0.8}>
                <Feather name="plus" size={moderateScale(16)} color="#FFFFFF" />
                <Text style={styles.bookButtonText}>Book New Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
  },

  // Summary Stats
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(4),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginHorizontal: scale(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  summaryIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(2),
  },
  summaryLabel: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    fontWeight: '500',
  },

  // Next Appointment Card
  nextAppointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#6366F1',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: scale(10),
  },
  cardContent: {
    padding: scale(20),
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  appointmentDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(4),
  },
  clinicName: {
    fontSize: moderateScale(16),
    color: '#6B7280',
    marginBottom: verticalScale(16),
  },
  appointmentInfo: {
    marginBottom: verticalScale(16),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#374151',
    marginLeft: scale(8),
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  statusBadge: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    marginRight: scale(8),
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  sessionBadge: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: '#F3F4F6',
  },
  sessionText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: scale(12),
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },

  // Appointments Card
  appointmentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },

  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    margin: scale(16),
    borderRadius: moderateScale(10),
    padding: scale(4),
  },
  tabButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Appointment Items
  appointmentItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
  },
  appointmentItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  appointmentDate: {
    alignItems: 'center',
    marginRight: scale(16),
    minWidth: scale(50),
  },
  dateDay: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1F2937',
  },
  dateMonth: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  appointmentItemDetails: {
    flex: 1,
    marginRight: scale(12),
  },
  appointmentDoctorName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: verticalScale(4),
  },
  appointmentClinic: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginBottom: verticalScale(8),
  },
  appointmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTime: {
    fontSize: moderateScale(12),
    color: '#374151',
    marginLeft: scale(4),
  },
  sessionNumber: {
    fontSize: moderateScale(12),
    color: '#374151',
    marginLeft: scale(4),
  },
  appointmentRight: {
    alignItems: 'flex-end',
  },
  appointmentStatus: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  appointmentStatusText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  bookingNumber: {
    fontSize: moderateScale(11),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: scale(16),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(6),
    backgroundColor: '#F0F4FF',
  },
  actionButtonText: {
    fontSize: moderateScale(12),
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: scale(6),
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: scale(20),
  },

  // Pagination
  paginationContainer: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginBottom: verticalScale(12),
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  paginationButton: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(6),
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  paginationText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#374151',
  },
  paginationTextActive: {
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(20),
  },
  emptyStateIcon: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  emptyStateTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: verticalScale(8),
  },
  emptyStateDescription: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(24),
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    gap: scale(8),
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginTop: verticalScale(12),
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  errorTitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: '#1F2937',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  errorMessage: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});
export default Bookings
