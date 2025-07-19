import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Platform,
    SafeAreaView,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { ScaledSheet, scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    useAnimatedGestureHandler,
    runOnJS,
} from 'react-native-reanimated';
import {
    GestureHandlerRootView,
    PanGestureHandler
} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';

import logo from '../../../assets/images/logo.webp';
import drImage from '../../../assets/images/dr.webp';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');


const onboardingData = [
    {
        id: 1,
        title: 'Dr. Rajneesh Kant',
        subtitle: 'Physiotherapy & Chiropractic Care',
        description: 'Expert spinal wellness care with personalized treatment plans for your health',
        gradientColors: ['#FFFFFF', '#F8FAFC'],
        circleColors: ['#F1F5F9', '#E2E8F0', '#3B82F6'],
        showDoctorImage: true,
    },
    {
        id: 2,
        title: 'Healing Beyond Pain',
        subtitle: 'Advanced Treatment Methods',
        description: 'Modern techniques combined with traditional healing approaches for optimal results',
        gradientColors: ['#FEFEFE', '#F0F9FF'],
        circleColors: ['#EFF6FF', '#DBEAFE', '#2563EB'],
        showDoctorImage: true,
    },
    {
        id: 3,
        title: 'Start Your Journey',
        subtitle: 'Book Your Consultation',
        description: 'Take the first step towards a pain-free life with our expert care team',
        gradientColors: ['#FFFFFF', '#F0FDF4'],
        circleColors: ['#F0FDF4', '#DCFCE7', '#16A34A'],
        showDoctorImage: true,
    },
];

export default function OnboardingFlow() {
    const navigation = useNavigation()
    const [currentScreen, setCurrentScreen] = useState(0);
    const translateX = useSharedValue(0);
    const animatedScale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        // Animate in when screen changes
        opacity.value = withTiming(1, { duration: 400 });
        animatedScale.value = withSpring(1, { damping: 20, stiffness: 150 });
    }, [currentScreen]);

    const changeScreen = (newScreen) => {
        if (newScreen >= 0 && newScreen < onboardingData.length && newScreen !== currentScreen) {
            // Animate out
            opacity.value = withTiming(0.7, { duration: 200 });
            animatedScale.value = withTiming(0.98, { duration: 200 });

            setTimeout(() => {
                setCurrentScreen(newScreen);
            }, 200);
        }
    };

    const handleNext = () => {
        if (currentScreen < onboardingData.length - 1) {
            changeScreen(currentScreen + 1);
        } else {
            navigation.navigate('Login')
        }
    };

    const handlePrevious = () => {
        if (currentScreen > 0) {
            changeScreen(currentScreen - 1);
        }
    };

    const handleDotPress = (index) => {
        changeScreen(index);
    };

    // Simplified gesture handler for swiping
    const gestureHandler = useAnimatedGestureHandler({
        onStart: () => {
            // Do nothing on start
        },
        onActive: (event) => {
            // Simple translation without excessive movement
            translateX.value = event.translationX * 0.3;
        },
        onEnd: (event) => {
            const threshold = 80;
            const shouldGoNext = event.translationX < -threshold && currentScreen < onboardingData.length - 1;
            const shouldGoPrevious = event.translationX > threshold && currentScreen > 0;

            if (shouldGoNext) {
                runOnJS(handleNext)();
            } else if (shouldGoPrevious) {
                runOnJS(handlePrevious)();
            }

            // Reset position smoothly
            translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { scale: animatedScale.value },
                { translateX: translateX.value },
            ],
        };
    });

    const currentData = onboardingData[currentScreen];

    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={currentData.gradientColors[0]}
                translucent={false}
            />

            <LinearGradient
                colors={currentData.gradientColors}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.safeArea}>
                    <PanGestureHandler onGestureEvent={gestureHandler}>
                        <Animated.View style={[styles.content, animatedStyle]}>

                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>{currentData.title}</Text>
                                <Text style={styles.subtitle}>{currentData.subtitle}</Text>
                            </View>

                            {/* Main Circle with Logo/Doctor Image */}
                            <View style={styles.circleSection}>
                                <View style={styles.circleContainer}>
                                    <View style={[styles.outerCircle, { backgroundColor: currentData.circleColors[0] }]}>
                                        <View style={[styles.middleCircle, { backgroundColor: currentData.circleColors[1] }]}>
                                            <View style={[styles.innerCircle, { backgroundColor: currentData.circleColors[2] }]}>
                                                <View style={styles.DrimageContainer}>
                                                    <FastImage
                                                        source={currentData.showDoctorImage ? drImage : logo}
                                                        style={[
                                                            styles.Drimage,
                                                            currentData.showDoctorImage ? styles.doctorImage : styles.logo
                                                        ]}
                                                        resizeMode={FastImage.resizeMode.contain}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Description */}
                            <View style={styles.descriptionSection}>
                                <Text style={styles.description}>{currentData.description}</Text>
                            </View>

                            {/* Navigation */}
                            <View style={styles.navigationSection}>
                                {/* Progress Dots */}
                                <View style={styles.dotsContainer}>
                                    {onboardingData.map((_, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.dot,
                                                {
                                                    backgroundColor: index === currentScreen ? '#3B82F6' : '#CBD5E1',
                                                    width: index === currentScreen ? scale(12) : scale(8),
                                                    height: index === currentScreen ? scale(12) : scale(8),
                                                },
                                            ]}
                                            onPress={() => handleDotPress(index)}
                                            activeOpacity={0.7}
                                        />
                                    ))}
                                </View>

                                {/* Navigation Buttons */}
                                <View style={styles.buttonContainer}>
                                    {currentScreen > 0 && (
                                        <TouchableOpacity
                                            style={[styles.navButton, styles.backButton]}
                                            onPress={handlePrevious}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.backButtonText}>Back</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.navButton, styles.nextButton]}
                                        onPress={handleNext}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.nextButtonText}>
                                            {currentScreen === onboardingData.length - 1 ? 'Get Started' : 'Next'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </Animated.View>
                    </PanGestureHandler>
                </SafeAreaView>
            </LinearGradient>
        </GestureHandlerRootView>
    );
}

const styles = ScaledSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: '20@s',
    },
    header: {
        alignItems: 'center',
        paddingTop: '30@vs',
        paddingBottom: '20@vs',
    },
    title: {
        fontSize: '28@s',
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: '6@vs',
        fontFamily: 'Poppins-Regular',
        letterSpacing: '-0.3@s',
    },
    subtitle: {
        fontSize: '16@s',
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
        fontFamily: 'Poppins-Regular',
        letterSpacing: '0.1@s',
    },
    circleSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: '20@vs',
    },
    circleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    outerCircle: {
        width: screenWidth * 0.7,
        height: screenWidth * 0.7,
        borderRadius: screenWidth * 0.35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    middleCircle: {
        width: screenWidth * 0.5,
        height: screenWidth * 0.5,
        borderRadius: screenWidth * 0.25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: screenWidth * 0.32,
        height: screenWidth * 0.32,
        borderRadius: screenWidth * 0.16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        width: screenWidth * 0.22,
        height: screenWidth * 0.22,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: screenWidth * 0.11,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    DrimageContainer: {
        width: screenWidth * 0.79,
        height: screenWidth * 0.68,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: screenWidth * 0.11,
        overflow: 'hidden',
    },
    Drimage: {
        borderBottomLeftRadius: 360,
        borderBottomRightRadius: 360,
        width: '100%',
        height: '100%',
    },
    logo: {
        // Keep original logo styling
    },
    doctorImage: {
        borderRadius: screenWidth * 0.11,
    },
    descriptionSection: {
        paddingHorizontal: '15@s',
        paddingBottom: '30@vs',
    },
    description: {
        fontSize: '16@s',
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: '24@s',
        fontWeight: '400',
        fontFamily: 'Poppins-Regular',
        letterSpacing: '0.1@s',
    },
    navigationSection: {
        paddingBottom: '20@vs',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '25@vs',
    },
    dot: {
        borderRadius: '8@s',
        marginHorizontal: '4@s',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: '5@s',
    },
    navButton: {
        paddingVertical: '12@vs',
        paddingHorizontal: '24@s',
        borderRadius: '20@s',
        minWidth: '80@s',
        alignItems: 'center',
    },
    backButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    nextButton: {
        backgroundColor: '#3B82F6',
        flex: 1,
        marginLeft: '10@s',
    },
    backButtonText: {
        color: '#6B7280',
        fontSize: '15@s',
        fontWeight: '600',
        fontFamily: 'Poppins-Regular',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: '15@s',
        fontWeight: '600',
        fontFamily: 'Poppins-Regular',
    },
});