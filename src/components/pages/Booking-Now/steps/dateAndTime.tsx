"use client"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ToastAndroid } from "react-native"
import { useState, useCallback, useEffect, useRef } from "react"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import { Calendar, type DateData } from "react-native-calendars"
import DateTimePicker from "@react-native-community/datetimepicker"
import { format, parseISO, isAfter, isToday, startOfDay } from "date-fns"
import { useBooking } from "../../../../context/BookingContext"

interface TimeSlot {
  time: string
  status: string
  available: number
}

interface AvailableDate {
  date: string
  slots: TimeSlot[]
}

export default function DateAndTime() {
  const { state, dispatch } = useBooking()
  const scrollViewRef = useRef<ScrollView>(null)
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [bookingWindow, setBookingWindow] = useState<{ start_date: string; end_date: string } | null>(null)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [hasSelectedBoth, setHasSelectedBoth] = useState(false)
  const [isTimeChange, setIsTimeChange] = useState(false)

  // Show Android Toast
  const showToast = (message: string) => {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  }

  // Get today's date for minimum date restriction
  const getTodayDate = () => {
    return format(new Date(), "yyyy-MM-dd")
  }

  // Fetch available dates
  const fetchAvailableDates = useCallback(
    async (clinicId: string) => {
      if (!clinicId) return
      setIsLoadingSlots(true)
      try {
        const response = await fetch(`https://drkm.api.adsdigitalmedia.com/api/v1/get-available-date?_id=${clinicId}`)
        const result = await response.json()
        
        if (result.availableDates) {
          setAvailableDates(result.availableDates)
        }
        
        if (result.BookingAvailableAt) {
          setBookingWindow(result.BookingAvailableAt)
          // Auto-select best available date
          const today = new Date()
          const startDate = parseISO(result.BookingAvailableAt.start_date)
          let bestDate = null
          
          if (isAfter(today, startDate) || isToday(startDate)) {
            bestDate = today
          } else {
            bestDate = startDate
          }
          
          const bestDateStr = format(bestDate, "yyyy-MM-dd")
          const dateWithSlots = result.availableDates?.find((d: AvailableDate) => d.date === bestDateStr)
          
          if (dateWithSlots && dateWithSlots.slots?.some((slot) => slot.status === "Available")) {
            dispatch({ type: "SET_DATE", payload: bestDateStr })
          } else {
            const nextAvailableDate = result.availableDates?.find((d: AvailableDate) => {
              const dateObj = parseISO(d.date)
              return isAfter(dateObj, today) && d.slots?.some((slot) => slot.status === "Available")
            })
            if (nextAvailableDate) {
              dispatch({ type: "SET_DATE", payload: nextAvailableDate.date })
            }
          }
        }
      } catch (error) {
        console.error("Error fetching available dates:", error)
        showToast("Failed to load available dates")
      } finally {
        setIsLoadingSlots(false)
      }
    },
    [dispatch],
  )

  useEffect(() => {
    if (state.selectedClinic) {
      setBookingWindow(state.selectedClinic.BookingAvailabeAt)
      fetchAvailableDates(state.selectedClinic._id)
    }
  }, [state.selectedClinic, fetchAvailableDates])

  // Auto-scroll to bottom when both date and time are selected
  useEffect(() => {
    if (state.selectedDate && state.selectedTime && !isTimeChange) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
        setHasSelectedBoth(true)
      }, 300)
    }
  }, [state.selectedDate, state.selectedTime, isTimeChange])

  // Create marked dates for calendar
  const getMarkedDates = () => {
    const marked: any = {}
    const today = getTodayDate()
    
    // Mark available dates
    availableDates.forEach((dateData) => {
      // Only mark dates that are today or in the future
      if (dateData.date >= today && dateData.slots?.some((slot) => slot.status === "Available")) {
        marked[dateData.date] = {
          marked: true,
          dotColor: "#10b981",
          activeOpacity: 0.7,
        }
      }
    })

    // Mark selected date
    if (state.selectedDate) {
      marked[state.selectedDate] = {
        ...marked[state.selectedDate],
        selected: true,
        selectedColor: "#6366f1",
        selectedTextColor: "#ffffff",
      }
    }

    // Mark today
    if (marked[today]) {
      marked[today] = {
        ...marked[today],
        today: true,
      }
    }

    return marked
  }

  // Handle date selection
  const handleDateSelect = (day: DateData) => {
    const selectedDate = day.dateString
    const today = getTodayDate()
    
    // Check if selected date is in the past
    if (selectedDate < today) {
      showToast("Cannot select past dates")
      return
    }
    
    const dateData = availableDates.find((d) => d.date === selectedDate)
    if (dateData && dateData.slots?.some((slot) => slot.status === "Available")) {
      dispatch({ type: "SET_DATE", payload: selectedDate })
      dispatch({ type: "SET_TIME", payload: "" }) // Reset time selection
      setIsTimeChange(false)
      setHasSelectedBoth(false)
    } else {
      showToast("This date is not available for booking")
    }
  }

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    const wasTimeAlreadySelected = !!state.selectedTime
    setIsTimeChange(wasTimeAlreadySelected)
    
    dispatch({ type: "SET_TIME", payload: time })
    
    if (wasTimeAlreadySelected) {
      // If changing time, show toast and don't scroll
      showToast("Time updated")
    }
  }

  // Handle time picker
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setSelectedTime(selectedTime)
      const timeString = format(selectedTime, "HH:mm")
      const wasTimeAlreadySelected = !!state.selectedTime
      setIsTimeChange(wasTimeAlreadySelected)
      
      dispatch({ type: "SET_TIME", payload: timeString })
      
      if (wasTimeAlreadySelected) {
        showToast("Custom time updated")
      }
    }
  }

  const selectedDateData = availableDates.find((d) => d.date === state.selectedDate)

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(20) }}
      >
        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Icon name="event" size={moderateScale(20)} color="#ffffff" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Select Date</Text>
              <Text style={styles.sectionSubtitle}>Choose your appointment date</Text>
            </View>
          </View>

          {/* Calendar Component */}
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              minDate={getTodayDate()} // Disable past dates
              maxDate={bookingWindow?.end_date}
              theme={{
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#6b7280",
                selectedDayBackgroundColor: "#6366f1",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#6366f1",
                dayTextColor: "#1f2937",
                textDisabledColor: "#d1d5db",
                dotColor: "#10b981",
                selectedDotColor: "#ffffff",
                arrowColor: "#6366f1",
                disabledArrowColor: "#d1d5db",
                monthTextColor: "#1f2937",
                indicatorColor: "#6366f1",
                textDayFontFamily: "System",
                textMonthFontFamily: "System",
                textDayHeaderFontFamily: "System",
                textDayFontWeight: "400",
                textMonthFontWeight: "600",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendar}
            />
          </View>

          {/* Selected Date Display */}
          {state.selectedDate && (
            <View style={styles.selectedDateContainer}>
              <Icon name="event" size={moderateScale(16)} color="#10b981" />
              <Text style={styles.selectedDateText}>
                Selected: {format(parseISO(state.selectedDate), "EEEE, MMMM do, yyyy")}
              </Text>
            </View>
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: "#8b5cf6" }]}>
              <Icon name="access-time" size={moderateScale(20)} color="#ffffff" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Select Time</Text>
              <Text style={styles.sectionSubtitle}>Pick your convenient time</Text>
            </View>
          </View>

          {state.selectedDate && selectedDateData?.slots ? (
            <View>
              <View style={styles.slotsHeader}>
                <Icon name="wb-sunny" size={moderateScale(16)} color="#f59e0b" />
                <Text style={styles.slotsHeaderText}>
                  Available Slots for {format(parseISO(state.selectedDate), "MMM d")}
                </Text>
              </View>

              {isLoadingSlots ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading time slots...</Text>
                </View>
              ) : (
                <View style={styles.slotsGrid}>
                  {selectedDateData.slots
                    .filter((slot) => slot.status === "Available")
                    .map((slot, index) => (
                      <TouchableOpacity
                        key={slot.time}
                        style={[styles.timeSlot, state.selectedTime === slot.time && styles.selectedTimeSlot]}
                        onPress={() => handleTimeSelect(slot.time)}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            state.selectedTime === slot.time && styles.selectedTimeSlotText,
                          ]}
                        >
                          {slot.time}
                        </Text>
                        <Text
                          style={[
                            styles.timeSlotSubtext,
                            state.selectedTime === slot.time && styles.selectedTimeSlotSubtext,
                          ]}
                        >
                          {slot.available > 0 ? `${slot.available} slots` : "Available"}
                        </Text>
                        {state.selectedTime === slot.time && (
                          <View style={styles.checkIcon}>
                            <Icon name="check" size={moderateScale(12)} color="#ffffff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyTimeSlots}>
              <Icon name="access-time" size={moderateScale(48)} color="#9ca3af" />
              <Text style={styles.emptyTimeSlotsText}>Please select a date first</Text>
            </View>
          )}
        </View>

   
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker value={selectedTime} mode="time" is24Hour={true} display="default" onChange={onTimeChange} />
      )}
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
  section: {
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
  iconContainer: {
    width: scale(40),
    height: scale(40),
    backgroundColor: "#6366f1",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionSubtitle: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    marginTop: verticalScale(2),
  },
  calendarContainer: {
    borderRadius: scale(12),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  calendar: {
    borderRadius: scale(12),
  },
  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(12),
    padding: scale(12),
    backgroundColor: "#f0fdf4",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  selectedDateText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#166534",
    marginLeft: scale(8),
  },
  slotsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  slotsHeaderText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: scale(8),
  },
  loadingContainer: {
    paddingVertical: verticalScale(32),
    alignItems: "center",
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: "#6b7280",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: verticalScale(16),
  },
  timeSlot: {
    width: "48%",
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(12),
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: scale(12),
    alignItems: "center",
    backgroundColor: "#ffffff",
    position: "relative",
  },
  selectedTimeSlot: {
    borderColor: "#8b5cf6",
    backgroundColor: "#8b5cf6",
  },
  timeSlotText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1f2937",
  },
  selectedTimeSlotText: {
    color: "#ffffff",
  },
  timeSlotSubtext: {
    fontSize: moderateScale(12),
    color: "#6b7280",
    marginTop: verticalScale(2),
  },
  selectedTimeSlotSubtext: {
    color: "#ffffff",
    opacity: 0.9,
  },
  checkIcon: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    width: scale(16),
    height: scale(16),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTimeSlots: {
    paddingVertical: verticalScale(32),
    alignItems: "center",
  },
  emptyTimeSlotsText: {
    fontSize: moderateScale(14),
    color: "#6b7280",
    marginTop: verticalScale(8),
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
})
