

import React, { useEffect } from 'react'
import { View, Text, StatusBar, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../../context/AuthContext'
import { scale, verticalScale, moderateScale } from 'react-native-size-matters'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated'
import Icon from 'react-native-vector-icons/MaterialIcons'

export default function Splash() {
  const navigation = useNavigation()
  const { isAuthenticated, guest, loading } = useAuth()

  // Animated values
  const logoScale = useSharedValue(0)
  const logoOpacity = useSharedValue(0)
  const titleTranslateY = useSharedValue(50)
  const titleOpacity = useSharedValue(0)
  const subtitleTranslateY = useSharedValue(30)
  const subtitleOpacity = useSharedValue(0)
  const taglineOpacity = useSharedValue(0)
  const loadingOpacity = useSharedValue(0)
  const backgroundRotation = useSharedValue(0)
  const pulseScale = useSharedValue(1)
  const dotsAnimation = useSharedValue(0)

  const navigateToNextScreen = () => {
    if (!loading) {
      if (isAuthenticated && !guest) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' as never }],
        })
      } else if (guest && !isAuthenticated) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' as never }],
        })
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'onboarding' as never }],
        })
      }
    }
  }

  console.log(isAuthenticated, guest, loading)
  useEffect(() => {
    // Start animations sequence
    const startAnimations = () => {
      // Background rotation
      backgroundRotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      )

      // Logo animations
      logoScale.value = withDelay(
        300,
        withSpring(1, {
          damping: 8,
          stiffness: 100,
        })
      )
      logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }))

      // Pulse effect for logo
      pulseScale.value = withDelay(
        1000,
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        )
      )

      // Title animation
      titleTranslateY.value = withDelay(800, withSpring(0, { damping: 10 }))
      titleOpacity.value = withDelay(800, withTiming(1, { duration: 600 }))

      // Subtitle animation
      subtitleTranslateY.value = withDelay(1200, withSpring(0, { damping: 10 }))
      subtitleOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }))

      // Tagline animation
      taglineOpacity.value = withDelay(1600, withTiming(1, { duration: 600 }))

      // Loading animation
      loadingOpacity.value = withDelay(2000, withTiming(1, { duration: 400 }))

      // Dots animation
      dotsAnimation.value = withDelay(
        2200,
        withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        )
      )
    }

    startAnimations()

    // Navigation timeout
    const timeout = setTimeout(() => {
      runOnJS(navigateToNextScreen)()
    }, 3500)

    return () => clearTimeout(timeout)
  }, [isAuthenticated, guest, loading, navigation])

  // Animated styles
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${backgroundRotation.value}deg` }],
  }))

  const logoContainerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { scale: pulseScale.value }
    ],
    opacity: logoOpacity.value,
  }))

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleTranslateY.value }],
    opacity: titleOpacity.value,
  }))

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: subtitleTranslateY.value }],
    opacity: subtitleOpacity.value,
  }))

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }))

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }))

  const dot1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dotsAnimation.value, [0, 0.33, 0.66, 1], [0.3, 1, 0.3, 0.3]),
    transform: [
      {
        scale: interpolate(dotsAnimation.value, [0, 0.33, 0.66, 1], [0.8, 1.2, 0.8, 0.8]),
      },
    ],
  }))

  const dot2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dotsAnimation.value, [0, 0.33, 0.66, 1], [0.3, 0.3, 1, 0.3]),
    transform: [
      {
        scale: interpolate(dotsAnimation.value, [0, 0.33, 0.66, 1], [0.8, 0.8, 1.2, 0.8]),
      },
    ],
  }))

  const dot3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dotsAnimation.value, [0, 0.33, 0.66, 1], [0.3, 0.3, 0.3, 1]),
    transform: [
      {
        scale: interpolate(dotsAnimation.value, [0, 0.33, 0.66, 1], [0.8, 0.8, 0.8, 1.2]),
      },
    ],
  }))

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      <View style={styles.container}>
        {/* Animated Background */}
        <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
          <View style={styles.backgroundCircle3} />
          <View style={styles.backgroundCircle4} />
        </Animated.View>

        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <Animated.View style={[styles.logoSection, logoContainerAnimatedStyle]}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Icon name="local-hospital" size={moderateScale(60)} color="#2563eb" />
              </View>
              <View style={styles.logoGlow} />
            </View>
          </Animated.View>

          {/* Title Section */}
          <Animated.View style={[styles.titleSection, titleAnimatedStyle]}>
            <Text style={styles.mainTitle}>Dr. Rajneesh Kant</Text>
            <View style={styles.titleUnderline} />
          </Animated.View>

          {/* Subtitle Section */}
          <Animated.View style={[styles.subtitleSection, subtitleAnimatedStyle]}>
            <View style={styles.specialtyContainer}>
              <Icon name="verified" size={moderateScale(20)} color="#60a5fa" />
              <Text style={styles.specialty}>Master Chiropractor & Spine Specialist</Text>
            </View>
          </Animated.View>

          {/* Tagline Section */}
          <Animated.View style={[styles.taglineSection, taglineAnimatedStyle]}>
            <Text style={styles.tagline}>Restoring Health, Enhancing Life</Text>
            <View style={styles.taglineDecoration}>
              <View style={styles.decorationLine} />
              <Icon name="favorite" size={moderateScale(16)} color="#f87171" />
              <View style={styles.decorationLine} />
            </View>
          </Animated.View>
        </View>

        {/* Loading Section */}
        <Animated.View style={[styles.loadingSection, loadingAnimatedStyle]}>
          <View style={styles.loadingContainer}>
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, dot1AnimatedStyle]} />
              <Animated.View style={[styles.dot, dot2AnimatedStyle]} />
              <Animated.View style={[styles.dot, dot3AnimatedStyle]} />
            </View>
            <Text style={styles.loadingText}>
              {loading ? 'Initializing Healthcare Services...' : 'Preparing Your Experience...'}
            </Text>
          </View>
        </Animated.View>

        {/* Professional Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Icon name="security" size={moderateScale(14)} color="#ffffff" />
            <Text style={styles.badgeText}>Professional Healthcare Services</Text>
          </View>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: '10%',
    left: '20%',
  },
  backgroundCircle2: {
    position: 'absolute',
    width: scale(200),
    height: scale(200),
    borderRadius: scale(100),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: '20%',
    right: '15%',
  },
  backgroundCircle3: {
    position: 'absolute',
    width: scale(150),
    height: scale(150),
    borderRadius: scale(75),
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    top: '50%',
    right: '25%',
  },
  backgroundCircle4: {
    position: 'absolute',
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: '40%',
    left: '30%',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  logoSection: {
    marginBottom: verticalScale(40),
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoGlow: {
    position: 'absolute',
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: -1,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  mainTitle: {
    fontSize: moderateScale(32),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: scale(80),
    height: verticalScale(3),
    backgroundColor: '#60a5fa',
    marginTop: verticalScale(8),
    borderRadius: scale(2),
  },
  subtitleSection: {
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  specialty: {
    fontSize: moderateScale(16),
    color: '#e0f2fe',
    fontWeight: '600',
    marginLeft: scale(8),
    textAlign: 'center',
  },
  taglineSection: {
    alignItems: 'center',
    marginBottom: verticalScale(60),
  },
  tagline: {
    fontSize: moderateScale(14),
    color: '#bfdbfe',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: verticalScale(12),
  },
  taglineDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decorationLine: {
    width: scale(30),
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: scale(8),
  },
  loadingSection: {
    position: 'absolute',
    bottom: verticalScale(80),
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(12),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#ffffff',
    marginHorizontal: scale(4),
  },
  loadingText: {
    fontSize: moderateScale(12),
    color: '#e0f2fe',
    textAlign: 'center',
    fontWeight: '500',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: verticalScale(24),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: moderateScale(10),
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: scale(6),
  },
})
