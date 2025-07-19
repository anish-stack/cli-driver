import { useNavigation } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import Layout from "../../layout/Layout"
import Hero from "../../common/Hero"
import Treatments from "../../ui/Treatments"
import DoctorIntroPage from "../../ui/doctor"
import { Image, View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"

type RootStackParamList = {
  Home: undefined
  Details: undefined
  Login: undefined
}

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  return (
    <Layout>
      {/* Enhanced Header with Gradient-like Background */}
      <View style={styles.headerWrapper}>
        <View style={styles.gradientBackground}>




          {/* Doctor Profile Section */}
          <View style={styles.headerContent}>
            <View style={styles.doctorSection}>
              <View style={styles.doctorImageContainer}>
                <Image
                  source={{
                    uri: "https://drkm.adsdigitalmedia.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdr.3f12fb96.png&w=1080&q=75",
                  }}
                  style={styles.doctorImage}
                />
                <View style={styles.verificationBadge}>
                  <Icon name="verified" size={moderateScale(18)} color="#10B981" />
                </View>
                <View style={styles.onlineIndicator} />
              </View>

              <View style={styles.doctorInfo}>
                <View style={styles.nameSection}>
                  <Text style={styles.doctorName}>Dr. Rajneesh Kant</Text>
                  <View style={styles.premiumBadge}>
                    <Icon name="star" size={moderateScale(12)} color="#FFD700" />
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                </View>

                <Text style={styles.doctorTitle}>Physiotherapy & Chiropractic Care</Text>
                <Text style={styles.clinicName}>Back To Nature Spine Clinic</Text>

                {/* Stats Row */}


                {/* Location and Availability */}
                <View style={styles.bottomInfo}>
                  <View style={styles.locationContainer}>
                    <Icon name="location-on" size={moderateScale(16)} color="#FFFFFF" />
                    <Text style={styles.locationText}>Delhi & Mumbai</Text>
                  </View>
                
                </View>
              </View>
            </View>


          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.ratingContainer}>
                <Icon name="star" size={moderateScale(14)} color="#FFD700" />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.experienceContainer}>
                <Icon name="work" size={moderateScale(14)} color="#FFFFFF" />
                <Text style={styles.experienceText}>15+</Text>
              </View>
              <Text style={styles.statLabel}>Years Exp</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.patientsContainer}>
                <Icon name="people" size={moderateScale(14)} color="#FFFFFF" />
                <Text style={styles.patientsText}>50k+</Text>
              </View>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <Hero navigation={navigation} />
      <Treatments navigation={navigation} />
      <DoctorIntroPage navigation={navigation} />
    </Layout>
  )
}

const styles = StyleSheet.create({
  headerWrapper: {
    marginBottom: verticalScale(10),
  },
  gradientBackground: {
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(0),
 
    backgroundColor: "#2563eb",
  },
 
  headerContent: {
    paddingHorizontal: scale(4),
  },
  doctorSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(10),
  },
  doctorImageContainer: {
    position: "relative",
    marginRight: scale(16),
  },
  doctorImage: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  verificationBadge: {
    position: "absolute",
    top: scale(-2),
    right: scale(-2),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(15),
    padding: scale(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: scale(8),
    right: scale(8),
    width: scale(16),
    height: scale(16),
    backgroundColor: "#10B981",
    borderRadius: scale(8),
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  doctorInfo: {
    flex: 1,
    paddingTop: verticalScale(5),
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  doctorName: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    gap: scale(4),
  },
  premiumText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#FFD700",
  },
  doctorTitle: {
    fontSize: moderateScale(14),
    color: "#E5E7EB",
    marginBottom: verticalScale(2),
    fontWeight: "500",
  },
  clinicName: {
    fontSize: moderateScale(13),
    color: "#D1D5DB",
    marginBottom: verticalScale(12),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(8),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: scale(30),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  ratingText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  experienceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  experienceText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  patientsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  patientsText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: moderateScale(11),
    color: "#D1D5DB",
    marginTop: verticalScale(2),
    fontWeight: "500",
  },
  bottomInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  locationText: {
    fontSize: moderateScale(13),
    color: "#E5E7EB",
    fontWeight: "500",
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  availabilityDot: {
    width: scale(8),
    height: scale(8),
    backgroundColor: "#10B981",
    borderRadius: scale(4),
  },
  availabilityText: {
    fontSize: moderateScale(12),
    color: "#10B981",
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: scale(20),
  },
  quickActionButton: {
    alignItems: "center",
    gap: verticalScale(8),
  },
  quickActionIcon: {
    width: scale(50),
    height: scale(50),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(25),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#FFFFFF",
  },
})
