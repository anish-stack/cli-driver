"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Dimensions, StatusBar, SafeAreaView } from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from "react-native-reanimated"
import UniversalButton from "./Button"
const { width, height } = Dimensions.get("window")

// TypeWriter Component for React Native
const TypeWriter = ({ strings, delay = 50, className, style }) => {
    const [currentStringIndex, setCurrentStringIndex] = useState(0)
    const [currentText, setCurrentText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentString = strings[currentStringIndex]
        const timeout = setTimeout(
            () => {
                if (!isDeleting) {
                    if (currentText.length < currentString.length) {
                        setCurrentText(currentString.slice(0, currentText.length + 1))
                    } else {
                        setTimeout(() => setIsDeleting(true), 2000)
                    }
                } else {
                    if (currentText.length > 0) {
                        setCurrentText(currentText.slice(0, -1))
                    } else {
                        setIsDeleting(false)
                        setCurrentStringIndex((prev) => (prev + 1) % strings.length)
                    }
                }
            },
            isDeleting ? delay / 2 : delay,
        )

        return () => clearTimeout(timeout)
    }, [currentText, isDeleting, currentStringIndex, strings, delay])

    return <Text style={[styles.typewriterText, style]}>{currentText}</Text>
}



const Hero = ({ navigation }) => {
    const [isVisible, setIsVisible] = useState(false)

    const leftContentOpacity = useSharedValue(0)
    const leftContentTranslateX = useSharedValue(-50)
    const rightContentOpacity = useSharedValue(0)
    const rightContentTranslateX = useSharedValue(50)
    const statsOpacity = useSharedValue(0)
    const statsTranslateY = useSharedValue(30)



    useEffect(() => {
        setIsVisible(true)

        // Start animations
        leftContentOpacity.value = withDelay(100, withTiming(1, { duration: 1000 }))
        leftContentTranslateX.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 100 }))

        rightContentOpacity.value = withDelay(400, withTiming(1, { duration: 1000 }))
        rightContentTranslateX.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }))

        statsOpacity.value = withDelay(700, withTiming(1, { duration: 1000 }))
        statsTranslateY.value = withDelay(700, withSpring(0, { damping: 15, stiffness: 100 }))
    }, [])

    // Animated styles
    const leftContentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: leftContentOpacity.value,
        transform: [{ translateX: leftContentTranslateX.value }],
    }))


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.heroContainer}>
                    {/* Main Content Grid */}
                    <View style={styles.contentGrid}>
                        {/* Left Content */}
                        <Animated.View style={[styles.leftContent, leftContentAnimatedStyle]}>
                            {/* Badge */}
                            <View style={styles.badge}>
                                <Icon name="favorite" size={moderateScale(16)} color="#2563eb" />
                                <Text style={styles.badgeText}>India's Most Trusted Chiropractic Care</Text>
                            </View>

                            {/* Main Heading */}
                            <View style={styles.headingContainer}>
                                <Text style={styles.mainHeading}>Healing Beyond</Text>
                                <TypeWriter
                                    delay={50}
                                    strings={[
                                        "Expectations",
                                        "Chiropractic Treatments",
                                        "Physiotherapy Solutions",
                                        "Pain Relief",
                                        "Wellness Goals",
                                    ]}
                                    style={styles.typewriterText}
                                />
                                <Text style={styles.description}>
                                    Heal better, move freer. Advanced chiropractic + modern physiotherapy in one powerful care plan.
                                </Text>

                            </View>

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                <UniversalButton
                                    title="Book Now consultation"
                                    size={'small'}

                                    variant="primary"

                                    leftIcon="event"

                                />

                            </View>

                        </Animated.View>

                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    scrollView: {
        flex: 1,
    },
    heroContainer: {
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(5),
    },
    contentGrid: {
        flexDirection: width > 768 ? "row" : "column",
        alignItems: "center",
        gap: scale(20),
    },
    leftContent: {
        flex: 1,
        alignItems: width > 768 ? "flex-start" : "center",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#dbeafe",
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(8),
        borderRadius: scale(20),
        borderWidth: 1,
        borderColor: "#bfdbfe",
        marginBottom: verticalScale(20),
    },
    badgeText: {
        fontFamily: 'Poppins-Regular',
        fontSize: moderateScale(12),
        color: "#2563eb",
        fontWeight: "600",
        marginLeft: scale(6),
    },
    headingContainer: {
        alignItems: width > 768 ? "flex-start" : "center",
        marginBottom: verticalScale(24),
    },
    mainHeading: {
        fontFamily: 'Poppins-Regular',
        fontSize: moderateScale(32),
        fontWeight: "700",
        color: "#111827",
        textAlign: width > 768 ? "left" : "center",
        lineHeight: moderateScale(40),
    },
    typewriterText: {
        fontFamily: 'Poppins-Regular',
        fontSize: moderateScale(28),
        fontWeight: "700",
        color: "#2563eb",
        textAlign: width > 768 ? "left" : "center",
        lineHeight: moderateScale(40),
        minHeight: moderateScale(40),
    },
    description: {
        fontFamily: 'Poppins-Regular',
        fontSize: moderateScale(16),
        color: "#6b7280",
        textAlign: width > 768 ? "left" : "center",
        lineHeight: moderateScale(24),
        marginTop: verticalScale(12),
        maxWidth: scale(400),
    },
    buttonContainer: {
        flexDirection: width > 600 ? "row" : "row",
        gap: scale(12),
        marginBottom: verticalScale(24),
        width: "100%",
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563eb",
        paddingHorizontal: scale(24),
        paddingVertical: verticalScale(14),
        borderRadius: scale(8),
        shadowColor: "#2563eb",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        flex: width > 600 ? 1 : 0,
    },
    primaryButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: moderateScale(16),
        color: "#ffffff",
        fontWeight: "600",
        marginLeft: scale(8),
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        paddingHorizontal: scale(24),
        paddingVertical: verticalScale(14),
        borderRadius: scale(8),
        borderWidth: 2,
        borderColor: "#e5e7eb",
        flex: width > 600 ? 1 : 0,
    },
    secondaryButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: moderateScale(16),
        color: "#2563eb",
        fontWeight: "600",
        marginLeft: scale(8),
    },
    contactInfo: {
        flexDirection: width > 600 ? "row" : "column",
        gap: scale(16),
        alignItems: "center",
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    contactText: {
        fontFamily: 'Poppins-Regular',
        fontSize: moderateScale(14),
        color: "#6b7280",
        fontWeight: "500",
        marginLeft: scale(6),
    }
   
})

export default Hero
