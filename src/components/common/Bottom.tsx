import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
} from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { COLORS, SIZES, WEIGHTS, SPACING, ICONS } from "../../../constant/ui"


import {
  useUserManagement,
  useUserData,
  useUserOnlineStatus,
  useToggleDutyStatus,
} from "../../hooks/RiderDetailsHooks"


interface TabItem {
  id: string
  label: string
  icon: keyof typeof ICONS
  route?: string
  onPress?: () => void
  badge?: number
}

interface BottomTabsProps {
  activeTab?: string
  onTabPress?: (tabId: string) => void
  currentRide?: any
  earnings?: number
}

const TabButton = React.memo(
  ({
    item,
    isActive,
    onPress,
    badge,
  }: {
    item: TabItem
    isActive: boolean
    onPress: () => void
    badge?: number
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current
    const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.6)).current

    useEffect(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: isActive ? 1.05 : 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: isActive ? 1 : 0.6,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }, [isActive])

    const handlePress = useCallback(() => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: isActive ? 1.05 : 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()
      onPress()
    }, [scaleAnim, isActive, onPress])

    return (
      <TouchableOpacity
        style={styles.tabButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.tabContent,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Image
              source={ICONS[item.icon]}
              style={[
                styles.iconImage,
                {
                  tintColor: isActive ? COLORS.primary : COLORS.gray,
                },
              ]}
              resizeMode="contain"
            />
            
            {badge && badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badge > 99 ? '99+' : badge.toString()}
                </Text>
              </View>
            )}
          </View>
          
          <Text
            style={[
              styles.tabLabel,
              {
                color: isActive ? COLORS.primary : COLORS.gray,
                fontWeight: isActive ? WEIGHTS.bold : WEIGHTS.regular,
              },
            ]}
          >
            {item.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    )
  }
)

const StatusIndicator = React.memo(({ isOnline }: { isOnline: boolean }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isOnline])

  return (
    <Animated.View
      style={[
        styles.statusDot,
        {
          backgroundColor: isOnline ? COLORS.success : COLORS.error,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  )
})

const DutyToggle = React.memo(
  ({
    isOnline,
    isLoading,
    onToggle,
    userData,
  }: {
    isOnline: boolean
    isLoading: boolean
    onToggle: () => void
    userData?: any
  }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(1)).current

    useEffect(() => {
      if (isLoading) {
        const rotate = Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        )
        rotate.start()
        return () => rotate.stop()
      } else {
        rotateAnim.setValue(0)
      }
    }, [isLoading])

    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    })

    // Check if recharge is expired
    const isRechargeExpired = useMemo(() => {
      if (userData?.RechargeData?.expireData) {
        const expireDate = new Date(userData.RechargeData.expireData)
        const currentDate = new Date()
        return expireDate < currentDate
      }
      return false
    }, [userData])

    const handleTogglePress = useCallback(() => {
      if (!isOnline && isRechargeExpired) {
        Alert.alert(
          "Recharge Required",
          "Your recharge has expired. Please recharge to go online.",
          [{ text: "OK", style: "default" }]
        )
        return
      }

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()

      onToggle()
    }, [isOnline, isRechargeExpired, onToggle, scaleAnim])

    return (
      <View style={styles.dutyContainer}>
        <View style={styles.statusRow}>
          <StatusIndicator isOnline={isOnline} />
          <Text style={[
            styles.statusText,
            { color: isOnline ? COLORS.success : COLORS.error }
          ]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        {isRechargeExpired && !isOnline && (
          <Text style={styles.warningText}>Recharge Expired</Text>
        )}
        
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: isOnline ? COLORS.success : COLORS.error,
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleTogglePress}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              {isLoading ? (
                <ActivityIndicator color={COLORS.light} size="small" />
              ) : (
                <View style={styles.powerIcon}>
                  <View style={styles.powerIconInner} />
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    )
  }
)

const EarningsCard = React.memo(({ earnings }: { earnings?: number }) => {
  return (
    <View style={styles.earningsCard}>
      <View style={styles.earningsHeader}>
        <View style={styles.walletIconContainer}>
          <Image
            source={ICONS.wallet}
            style={styles.walletIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.earningsLabel}>Today</Text>
      </View>
      <Text style={styles.earningsAmount}>
        ${earnings?.toFixed(2) || '0.00'}
      </Text>
    </View>
  )
})

const RideIndicator = React.memo(() => {
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [])

  return (
    <View style={styles.rideIndicator}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Image
          source={ICONS.pin}
          style={styles.rideIcon}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.rideText}>Ride in progress</Text>
    </View>
  )
})

export default function BottomTabs({
  activeTab = "home",
  onTabPress,
  isDutyToggleShow=true,
  currentRide,
  earnings = 0,
}: BottomTabsProps) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  
  // Redux hooks
  const userData = useUserData()
  const isOnline = useUserOnlineStatus()
  const dutyToggle = useToggleDutyStatus()
  const { refreshAllData } = useUserManagement()

  const tabs: TabItem[] = useMemo(() => [
    {
      id: "home",
      label: "Home",
      icon: "layers",
      route: "Home",
    },
    {
      id: "rides",
      label: "Rides",
      icon: "car",
      route: "Rides",
      badge: currentRide ? 1 : 0,
    },
    {
      id: "earnings",
      label: "Earnings",
      icon: "wallet",
      route: "Earnings",
    },
    {
      id: "profile",
      label: "Profile",
      icon: "driver",
      route: "Profile",
    },
  ], [currentRide])

  const handleTabPress = useCallback(
    (tabId: string) => {
      const tab = tabs.find(t => t.id === tabId)
      if (tab?.route) {
        navigation.navigate(tab.route as never)
      }
      onTabPress?.(tabId)
    },
    [tabs, navigation, onTabPress]
  )

  const handleDutyToggle = useCallback(async () => {
    if (!userData) {
      Alert.alert(
        "Error",
        "User data not available. Please try refreshing the app.",
        [
          { text: "Refresh", onPress: refreshAllData },
          { text: "Cancel", style: "cancel" }
        ]
      )
      return
    }

    try {
      const result = await dutyToggle.toggleDutyStatus(userData, isOnline)
      if (!result) {
        Alert.alert("Error", "Failed to toggle duty status. Please try again.")
      }
    } catch (error) {
      console.error("Error toggling duty status:", error)
      Alert.alert("Error", "An error occurred while toggling duty status.")
    }
  }, [userData, isOnline, dutyToggle, refreshAllData])


  useEffect(() => {
    if (dutyToggle.error) {
      Alert.alert(
        "Duty Status Error",
        dutyToggle.error,
        [{ text: "OK", onPress: dutyToggle.clearError }]
      )
    }
  }, [dutyToggle.error, dutyToggle.clearError])

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header Section */}

      {isDutyToggleShow ? (
          <View style={styles.header}>
        <EarningsCard earnings={earnings} />
        <DutyToggle
          isOnline={isOnline}
          isLoading={dutyToggle.loading}
          onToggle={handleDutyToggle}
          userData={userData}
        />
      </View>
      ):null}
    

      {/* Ride Indicator */}
      {currentRide && <RideIndicator />}

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            item={tab}
            isActive={activeTab === tab.id}
            onPress={() => handleTabPress(tab.id)}
            badge={tab.badge}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.light,
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(SPACING.large),
    paddingVertical: verticalScale(SPACING.medium),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  
  // Earnings Styles
  earningsCard: {
    flex: 1,
    marginRight: scale(SPACING.medium),
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  walletIconContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(6),
  },
  walletIcon: {
    width: scale(14),
    height: scale(14),
    tintColor: COLORS.primary,
  },
  earningsLabel: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.gray,
    fontWeight: WEIGHTS.medium,
  },
  earningsAmount: {
    fontSize: moderateScale(SIZES.large),
    color: COLORS.dark,
    fontWeight: WEIGHTS.bold,
  },

  // Status & Duty Toggle Styles
  dutyContainer: {
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  statusDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: scale(6),
  },
  statusText: {
    fontSize: moderateScale(SIZES.small),
    fontWeight: WEIGHTS.medium,
  },
  warningText: {
    fontSize: moderateScale(SIZES.tiny || 10),
    color: COLORS.error,
    fontWeight: WEIGHTS.medium,
    marginBottom: verticalScale(4),
  },
  toggleButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  powerIcon: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    borderWidth: 2,
    borderColor: COLORS.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerIconInner: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: COLORS.light,
  },

  // Tab Bar Styles
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: scale(SPACING.small),
    paddingVertical: verticalScale(SPACING.small),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: verticalScale(SPACING.small),
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    position: "relative",
    marginBottom: verticalScale(4),
  },
  iconImage: {
    width: scale(20),
    height: scale(20),
  },
  badge: {
    position: "absolute",
    top: -scale(6),
    right: -scale(6),
    backgroundColor: COLORS.error,
    borderRadius: scale(8),
    minWidth: scale(16),
    height: scale(16),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(4),
  },
  badgeText: {
    color: COLORS.light,
    fontSize: moderateScale(9),
    fontWeight: WEIGHTS.bold,
  },
  tabLabel: {
    fontSize: moderateScale(SIZES.tiny || 11),
    textAlign: 'center',
  },

  // Ride Indicator Styles
  rideIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(SPACING.small),
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: scale(SPACING.medium),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(SPACING.small),
  },
  rideIcon: {
    width: scale(14),
    height: scale(14),
    tintColor: COLORS.primary,
  },
  rideText: {
    marginLeft: scale(SPACING.small),
    fontSize: moderateScale(SIZES.small),
    color: COLORS.primary,
    fontWeight: WEIGHTS.medium,
  },
})