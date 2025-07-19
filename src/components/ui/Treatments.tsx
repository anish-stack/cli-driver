"use client"

import React, { useState, useEffect } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    StatusBar,
    SafeAreaView,

} from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import LinearGradient from "react-native-linear-gradient"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,

} from "react-native-reanimated"
import { useService } from "../../hooks/use-service"

const { width, height } = Dimensions.get("window")

export default function Treatments({ navigation }) {
    const { services: dbServices } = useService()
    const [isVisible, setIsVisible] = useState(false)

    // Animation values
    const headerOpacity = useSharedValue(0)
    const headerTranslateY = useSharedValue(-30)
    const statsOpacity = useSharedValue(0)
    const treatmentsOpacity = useSharedValue(0)
    const specialtiesOpacity = useSharedValue(0)
    const ctaOpacity = useSharedValue(0)

    const icons = [
        "healing",
        "psychology",
        "monitor-heart",
        "my-location",
        "flash-on",
        "fitness-center",
        "spa",
        "self-improvement",
    ]

    const colors = [
        ["#ef4444", "#f43f5e"],
        ["#f97316", "#f59e0b"],
        ["#eab308", "#f97316"],
        ["#a855f7", "#8b5cf6"],
        ["#3b82f6", "#6366f1"],
        ["#10b981", "#059669"],
        ["#ec4899", "#f43f5e"],
        ["#6366f1", "#a855f7"],
        ["#14b8a6", "#06b6d4"],
        ["#06b6d4", "#3b82f6"],
        ["#059669", "#14b8a6"],
        ["#f43f5e", "#ec4899"],
        ["#f59e0b", "#eab308"],
    ]

    const treatmentConditions = dbServices?.map((service, index) => ({
        name: service.service_name,
        icon: icons[index % icons.length],
        colors: colors[index % colors.length],
    }))

    const stats = [
        { icon: "people", number: "50,000+", label: "Happy Patients" },
        { icon: "emoji-events", number: "15+", label: "Years Experience" },
        { icon: "star", number: "4.9", label: "Average Rating" },
        { icon: "check-circle", number: "98%", label: "Success Rate" },
    ]



    useEffect(() => {
        setIsVisible(true)

        // Start animations
        headerOpacity.value = withDelay(100, withTiming(1, { duration: 1000 }))
        headerTranslateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 100 }))

        statsOpacity.value = withDelay(400, withTiming(1, { duration: 800 }))
        treatmentsOpacity.value = withDelay(600, withTiming(1, { duration: 800 }))
        specialtiesOpacity.value = withDelay(800, withTiming(1, { duration: 800 }))
        ctaOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }))
    }, [])

    // Animated styles
    const headerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
        transform: [{ translateY: headerTranslateY.value }],
    }))

    const statsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: statsOpacity.value,
    }))

    const treatmentsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: treatmentsOpacity.value,
    }))






    const handleTreatmentPress = (treatment) => {
        if (navigation) {
            navigation.navigate("booking-now", { treatment })
        }
        console.log("Treatment pressed:", treatment.name)
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                {/* Background Gradient */}
                <LinearGradient colors={["#f8fafc", "#dbeafe", "#e0e7ff"]} style={styles.backgroundGradient}>
                    {/* Hero Section */}
                    <Animated.View style={[styles.heroSection, headerAnimatedStyle]}>
                        {/* Background Elements */}
                        <View style={styles.backgroundElements}>
                            <LinearGradient
                                colors={["rgba(59, 130, 246, 0.1)", "rgba(147, 51, 234, 0.1)"]}
                                style={styles.bgElement1}
                            />
                            <LinearGradient
                                colors={["rgba(16, 185, 129, 0.1)", "rgba(20, 184, 166, 0.1)"]}
                                style={styles.bgElement2}
                            />
                        </View>


                        {/* Main Title */}
                        <View style={styles.titleContainer}>
                            <Text style={styles.mainTitle}>Comprehensive</Text>

                            <Text style={styles.SecondTitle} >Treatment Solutions</Text>

                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            Personalized healing with expert{" "}
                            <Text style={styles.highlightBlue}>spinal adjustments</Text> and{" "}
                            <Text style={styles.highlightGreen}>rehab exercises</Text> — for better movement and lasting relief.
                        </Text>



                        {/* Stats */}
                        <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
                            {stats.map((stat, index) => (
                                <View key={index} style={styles.statCard}>
                                    <Icon name={stat.icon} size={moderateScale(20)} color="#2563eb" />
                                    <Text style={styles.statNumber}>{stat.number}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                            ))}
                        </Animated.View>
                    </Animated.View>

                    {/* Treatment Conditions Section */}
                    <Animated.View style={[styles.treatmentsSection, treatmentsAnimatedStyle]}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                Conditions We <Text style={styles.gradientText}>Treat</Text>
                            </Text>
                            <Text style={styles.sectionDescription}>
                                Expert care for a wide range of musculoskeletal conditions with proven treatment protocols
                            </Text>
                        </View>

                        <View style={styles.treatmentsGrid}>
                            {treatmentConditions?.slice(0,12).map((condition, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.treatmentCard}
                                    onPress={() => handleTreatmentPress(condition)}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient colors={condition.colors} style={styles.treatmentIcon}>
                                        <Icon name={condition.icon} size={moderateScale(20)} color="#ffffff" />
                                    </LinearGradient>
                                    <Text style={styles.treatmentName}>{condition.name}</Text>
                                    <TouchableOpacity style={styles.bookButton}>
                                        <Text style={styles.bookButtonText}>Book Now</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>



                </LinearGradient>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    scrollView: {
        flex: 1,
    },
    backgroundGradient: {
        flex: 1,
        minHeight: height,
    },
    heroSection: {
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(40),
        position: "relative",
    },
    backgroundElements: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    bgElement1: {
        position: "absolute",
        top: verticalScale(80),
        right: scale(80),
        width: scale(180),
        height: scale(180),
        borderRadius: scale(90),
    },
    bgElement2: {
        position: "absolute",
        bottom: verticalScale(80),
        left: scale(80),
        width: scale(240),
        height: scale(240),
        borderRadius: scale(120),
    },
    headerBadge: {
        alignItems: "center",
        marginBottom: verticalScale(20),
    },
    badgeGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(5),
        borderRadius: scale(25),
        shadowColor: "#2563eb",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    badgeText: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(12),
        color: "#ffffff",
        fontWeight: "600",
        marginHorizontal: scale(8),
    },
    titleContainer: {
        alignItems: "center",
        marginBottom: verticalScale(20),
    },
    mainTitle: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(32),
        fontWeight: "700",
        color: "#1f2937",
        textAlign: "center",

    },
    SecondTitle: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(32),
        fontWeight: "700",
        color: "#1f2937",
        textAlign: "center",

    },
    gradientTextContainer: {
        borderRadius: scale(8),
        paddingHorizontal: scale(4),
    },
    gradientTitle: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(32),
        fontWeight: "700",
        color: "transparent",
        textAlign: "center",
    },
    description: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(16),
        color: "#6b7280",
        textAlign: "center",
        lineHeight: moderateScale(24),
        marginBottom: verticalScale(24),
        paddingHorizontal: scale(10),
    },
    highlightBlue: {
        color: "#2563eb",
        fontWeight: "600",
    },
    highlightGreen: {
        color: "#059669",
        fontWeight: "600",
    },
    ctaContainer: {
        flexDirection: width > 600 ? "row" : "row",
        justifyContent: "center",
        alignItems: "center",
        gap: scale(12),
        marginBottom: verticalScale(32),
    },

    statsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: scale(12),
    },
    statCard: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: scale(16),
        padding: scale(16),
        alignItems: "center",
        flex: 1,
        minWidth: scale(140),

        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    statNumber: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(20),
        fontWeight: "700",
        color: "#1f2937",
        marginVertical: verticalScale(4),
    },
    statLabel: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(12),
        color: "#6b7280",
        textAlign: "center",
    },
    treatmentsSection: {
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(2),
    },
    sectionHeader: {
        alignItems: "center",
        marginBottom: verticalScale(24),
    },
    sectionTitle: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(28),
        fontWeight: "700",
        color: "#1f2937",
        textAlign: "center",
        marginBottom: verticalScale(8),
    },
    gradientText: {
        color: "#2563eb",
    },
    gradientTextGreen: {
        color: "#059669",
    },
    sectionDescription: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(16),
        color: "#6b7280",
        textAlign: "center",
        maxWidth: scale(300),
    },
    treatmentsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: scale(12),
    },
    treatmentCard: {
        backgroundColor: "#ffffff",
        borderRadius: scale(12),
        padding: scale(16),
        alignItems: "center",
        width: (width - scale(60)) / 2,
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: "#f3f4f6",
    },
    treatmentIcon: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(8),
        alignItems: "center",
        justifyContent: "center",
        marginBottom: verticalScale(12),
    },
    treatmentName: {
        fontFamily: 'Poppins-Regular',

        fontSize: moderateScale(12),
        fontWeight: "600",
        color: "#1f2937",
        textAlign: "center",
        marginBottom: verticalScale(12),
        lineHeight: moderateScale(16),
    },
    bookButton: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: scale(6),
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(6),
    },
    bookButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: moderateScale(10),
        color: "#6b7280",
        fontWeight: "500",
    },

})
