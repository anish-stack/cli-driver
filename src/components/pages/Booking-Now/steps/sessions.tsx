import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useBooking } from "../../../../context/BookingContext"

export default function Sessions() {
  const { state, setSessions } = useBooking()
  const { selectedSessions, sessionPrice, sessionMRP } = state

  const sessionOptions = [1, 2, 3, 4, 5, 6]

  const handleSessionSelect = (sessionCount: number) => {
    setSessions(sessionCount)
  }

  return (
    <View style={styles.container}>
    
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sessionsGrid}>
          {sessionOptions.map((num, index) => {
            const isSelected = selectedSessions === num
            const totalPrice = num * sessionPrice
            const totalMRP = num * sessionMRP
            const savings = num * (sessionMRP - sessionPrice)

            return (
              <TouchableOpacity
                key={num+index}
                style={[styles.sessionCard, isSelected && styles.selectedSessionCard]}
                onPress={() => handleSessionSelect(num)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionContent}>
                  {/* Session Number */}
                  <View style={styles.sessionNumber}>
                    <Text style={[styles.sessionNumberText, isSelected && styles.selectedNumberText]}>{num}</Text>
                    <Text style={[styles.sessionLabel, isSelected && styles.selectedLabel]}>
                      Session{num > 1 ? "s" : ""}
                    </Text>
                  </View>

                  {/* Pricing */}
                  <View style={styles.pricingSection}>
                    <Text style={[styles.currentPrice, isSelected && styles.selectedPrice]}>
                      ₹{totalPrice.toLocaleString()}
                    </Text>
                    <Text style={styles.originalPrice}>₹{totalMRP.toLocaleString()}</Text>
                    <Text style={styles.savings}>Save ₹{savings.toLocaleString()}</Text>
                  </View>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <View style={styles.selectionIndicator}>
                      <View style={styles.checkIconContainer}>
                        <Icon name="check" size={moderateScale(12)} color="#ffffff" />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

 
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(16),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: "#6b7280",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
  },
  sessionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(12),
    marginBottom:20
  },
  sessionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  selectedSessionCard: {
    borderColor: "#10b981",
    borderWidth: 2,
    backgroundColor: "#f0fdf4",
    shadowColor: "#10b981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sessionContent: {
    alignItems: "center",
  },
  sessionNumber: {
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  sessionNumberText: {
    fontSize: moderateScale(32),
    fontWeight: "700",
    color: "#1e293b",
  },
  selectedNumberText: {
    color: "#10b981",
  },
  sessionLabel: {
    fontSize: moderateScale(12),
    color: "#64748b",
    fontWeight: "500",
    marginTop: verticalScale(2),
  },
  selectedLabel: {
    color: "#059669",
  },
  pricingSection: {
    alignItems: "center",
  },
  currentPrice: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#10b981",
    marginBottom: verticalScale(2),
  },
  selectedPrice: {
    color: "#059669",
  },
  originalPrice: {
    fontSize: moderateScale(12),
    color: "#9ca3af",
    textDecorationLine: "line-through",
    marginBottom: verticalScale(2),
  },
  savings: {
    fontSize: moderateScale(10),
    color: "#10b981",
    fontWeight: "500",
  },
  selectionIndicator: {
    position: "absolute",
    top: scale(-8),
    right: scale(-8),
  },
  checkIconContainer: {
    width: scale(24),
    height: scale(24),
    backgroundColor: "#10b981",
    borderRadius: scale(12),
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
