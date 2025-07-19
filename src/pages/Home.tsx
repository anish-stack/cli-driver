"use client"

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react"
import {
  View,
  Text,
  NativeModules,
  AppState,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Animated,
  ActivityIndicator,
} from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useDispatch, useSelector } from "react-redux"
import { useNavigation } from "@react-navigation/native"
import { COLORS, SIZES, WEIGHTS, SPACING, RADIUS } from "../../constant/ui"
import { useFetchUserDetails } from "../hooks/RiderDetailsHooks"
import OlyoxTabBar from "../components/common/UberTabBar"
import {
  toggleDutyStatus,

  clearError,
  restorePersistedState,
  loadPersistedDutyState,
  fetchRiderData,
} from "../../Store/slices/dutySlice"

const { FloatingWidget, LocationModule } = NativeModules

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

interface LocationData {
  latitude: number
  longitude: number
}

// Memoized components to prevent unnecessary re-renders
const EarningsHeader = React.memo(
  ({
    earnings,
    trips,
    hours,
    rating,
  }: {
    earnings: number
    trips: number
    hours: number
    rating?: number
  }) => (
    <View style={styles.earningsHeader}>
      <View style={styles.earningsCard}>
        <Text style={styles.earningsAmount}>₹{earnings.toFixed(2)}</Text>
        <Text style={styles.earningsLabel}>Today's Earnings</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{trips}</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{hours}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>★ {rating?.toFixed(1) || "4.9"}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
    </View>
  ),
)


const StatusPanel = React.memo(
  ({
    isOnline,
    dutyLoading,
    currentRide,
    onToggleDuty,
    fadeAnim,
    statusAnim,
    vehicleInfo,
  }: {
    isOnline: boolean
    dutyLoading: boolean
    currentRide: any
    onToggleDuty: () => void
    fadeAnim: Animated.Value
    statusAnim: Animated.Value
    vehicleInfo?: any
  }) => {
    const getStatusColor = useCallback(() => {
      return statusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.gray, COLORS.success],
      })
    }, [statusAnim])

    const statusText = useMemo(() => {
      if (dutyLoading) return "Updating..."
      return isOnline ? "You're Online" : "You're Offline"
    }, [dutyLoading, isOnline])

    const statusSubtext = useMemo(() => {
      if (dutyLoading) return "Please wait"
      if (isOnline) {
        return currentRide?.isActive ? "On a ride" : "Ready for rides"
      }
      return "Tap to go online"
    }, [dutyLoading, isOnline, currentRide])

    return (
      <View style={styles.statusPanel}>
        <View style={styles.statusContainer}>
          <View style={styles.statusLeft}>
            <Animated.View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusText}>{statusText}</Text>
              <Text style={styles.statusSubtext}>{statusSubtext}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.dutyButton,
              {
                backgroundColor: isOnline ? COLORS.danger : COLORS.success,
                opacity: dutyLoading ? 0.7 : 1,
              },
            ]}
            onPress={onToggleDuty}
            disabled={dutyLoading}
            activeOpacity={0.8}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {dutyLoading ? (
                <ActivityIndicator color={COLORS.light} size="small" />
              ) : (
                <Text style={styles.dutyButtonText}>{isOnline ? "GO OFFLINE" : "GO ONLINE"}</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
        {vehicleInfo && (
          <View style={styles.vehicleInfo}>
            <Icon name="directions-car" size={moderateScale(16)} color={COLORS.gray} />
            <Text style={styles.vehicleText}>
              {vehicleInfo.vehicleName} • {vehicleInfo.vehicleNumber}
            </Text>
          </View>
        )}
      </View>
    )
  },
)

const ErrorDisplay = React.memo(
  ({
    error,
    onRetry,
  }: {
    error: string | null
    onRetry: () => void
  }) => {
    if (!error) return null

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  },
)

export default function Home() {
  const dispatch = useDispatch()
  const navigation = useNavigation()

  // Redux state with memoized selectors
  const token = useSelector((state: any) => state.login.token)
  const dutyState = useSelector((state: any) => state.duty)
  const {
    loading: dutyLoading,
    isOnline,
    isOnRide,
    isAvailable,
    totalEarnings,
    totalRides,
    loggedInHours,
    averageRating,
    currentRide,
    error: dutyError,
  } = dutyState;

  // Custom hook for user details
  const { userData, loading: userLoading, error: userError, fetchUserDetails: refetch } = useFetchUserDetails()
  console.log("User data from totalEarnings:", totalEarnings)
  // Local state
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [locationLoading, setLocationLoading] = useState<boolean>(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const statusAnim = useRef(new Animated.Value(0)).current

  // Refs for preventing stale closures
  const isOnlineRef = useRef(isOnline)
  const tokenRef = useRef(token)

  useEffect(() => {
    isOnlineRef.current = isOnline
    tokenRef.current = token
  }, [])


  const combinedError = useMemo(() => {
    return dutyError || userError || locationError
  }, [dutyError, userError, locationError])

  // Load persisted state on mount
  useEffect(() => {
    let isMounted = true

    const loadPersistedData = async () => {
      try {
        const persistedState = await loadPersistedDutyState()
        if (isMounted && Object.keys(persistedState).length > 0) {
          dispatch(restorePersistedState(persistedState))
        }
      } catch (error) {
        console.error("Failed to load persisted state:", error)
      }
    }

    loadPersistedData()

    return () => {
      isMounted = false
    }
  }, [])

  // Status animation effect
  useEffect(() => {
    Animated.timing(statusAnim, {
      toValue: isOnline ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start()

    if (isOnline) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isOnlineRef.current) pulse()
        })
      }
      pulse()
    }
  }, [isOnline, statusAnim, pulseAnim])



  // Location permission and fetching
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
          title: "Location Permission",
          message: "App needs access to your location.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        })
        return granted === PermissionsAndroid.RESULTS.GRANTED
      } catch (error) {
        console.error("Permission request error:", error)
        return false
      }
    }
    return true
  }, [])

  const fetchLocation = useCallback(async () => {
    setLocationLoading(true)
    setLocationError(null)

    try {
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        setLocationError("Location permission denied")
        setLocationLoading(false)
        return
      }

      LocationModule.getCurrentLocation(
        (lat: number, lng: number) => {
          const newLocation = { latitude: lat, longitude: lng }
          setCurrentLocation(newLocation)
          setRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          })
          setLocationLoading(false)
          console.log("Current Location:", { latitude: lat, longitude: lng })
        },
        (err: string) => {
          setLocationError(err)
          setLocationLoading(false)
          console.error("Location error:", err)
        },
      )
    } catch (e: any) {
      setLocationError("Failed to get location: " + e.message)
      setLocationLoading(false)
      console.error("Location fetch error:", e)
    }
  }, [requestLocationPermission])

  // App state handling
  const handleAppStateChange = useCallback((nextAppState: string) => {
    if (nextAppState === "background" && isOnlineRef.current) {
      console.log("App in background, launching widget...")
      FloatingWidget.startWidget()
    } else {
      FloatingWidget.stopWidget()
    }
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange)
    fetchLocation()

    return () => {
      subscription.remove()
    }
  }, [])


  const handleToggleDuty = useCallback(async () => {
    if (dutyLoading || !userData) return

    // Check recharge expiry before toggling
    if (userData?.RechargeData?.expireData) {
      const expireDate = new Date(userData.RechargeData.expireData)
      const currentDate = new Date()

      if (!isOnline && expireDate < currentDate) {
        Alert.alert("Recharge Expired", "Please recharge to go online", [
          {
            text: "Recharge Now",
            onPress: () =>
              navigation.navigate("Recharge", {
                showOnlyBikePlan:
                  userData?.rideVehicleInfo?.vehicleName === "2 Wheeler" ||
                  userData?.rideVehicleInfo?.vehicleName === "Bike",
                role: userData?.category,
                firstRecharge: userData?.isFirstRechargeDone || false,
              }),
          },
          { text: "Cancel", style: "cancel" },
        ])
        return
      }
    }

    try {
      await dispatch(toggleDutyStatus({ token, userData })).unwrap()
      // Animate status change
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } catch (error: any) {
      Alert.alert("Error", error || "Failed to toggle status")
    }
  }, [])


  useEffect(() => {
    refetch()
    dispatch(fetchRiderData(token))
  }, [])


  const handleRetry = useCallback(() => {
    dispatch(clearError())
    if (userError) refetch()
    if (locationError) fetchLocation()
  }, [])

  const onRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion)
  }, [])

  // Loading state
  if (userLoading && !userData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <OlyoxTabBar isDriverMode={isAvailable} activeRide={isOnRide ? currentRide : null} toggle={toggleDutyStatus} currentLocation={currentLocation}>
      <View style={styles.container}>
        {/* Earnings Header */}
        <EarningsHeader earnings={totalEarnings} trips={totalRides} hours={loggedInHours} rating={averageRating} />

        {/* Map */}
        {region && currentLocation && (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsBuildings={true}
            mapType="standard"
          >
            <Marker coordinate={currentLocation} title="Your Location" description="Current location">
              <Animated.View style={[styles.markerContainer, { transform: [{ scale: pulseAnim }] }]}>
                <View style={[styles.marker, { backgroundColor: isOnline ? COLORS.success : COLORS.gray }]}>
                  <Icon name="directions-car" size={moderateScale(18)} color={COLORS.light} />
                </View>
              </Animated.View>
            </Marker>
          </MapView>
        )}


        {/* Status Panel */}
        <StatusPanel
          isOnline={isOnline}
          dutyLoading={dutyLoading}
          currentRide={currentRide}
          onToggleDuty={handleToggleDuty}
          fadeAnim={fadeAnim}
          statusAnim={statusAnim}
          vehicleInfo={userData?.rideVehicleInfo}
        />

        {/* Error Display */}
        <ErrorDisplay error={combinedError} onRetry={handleRetry} />
      </View>
    </OlyoxTabBar>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: verticalScale(SPACING.medium),
    fontSize: moderateScale(SIZES.medium),
    color: COLORS.gray,
    fontWeight: WEIGHTS.medium,
  },
  earningsHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: verticalScale(SPACING.medium),
    paddingBottom: verticalScale(SPACING.large),
    paddingHorizontal: scale(SPACING.large),
  },
  earningsCard: {
    alignItems: "center",
    marginBottom: verticalScale(SPACING.large),
  },
  earningsAmount: {
    fontSize: moderateScale(32),
    fontWeight: WEIGHTS.bold,
    color: COLORS.light,
  },
  earningsLabel: {
    fontSize: moderateScale(SIZES.medium),
    color: COLORS.lightGray,
    fontWeight: WEIGHTS.medium,
    marginTop: verticalScale(4),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: COLORS.light,
    fontSize: moderateScale(SIZES.large),
    fontWeight: WEIGHTS.semiBold,
  },
  statLabel: {
    color: COLORS.lightGray,
    fontSize: moderateScale(SIZES.small),
    fontWeight: WEIGHTS.regular,
    marginTop: verticalScale(2),
  },
  statDivider: {
    width: 1,
    height: verticalScale(30),
    backgroundColor: COLORS.primaryDark,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: "absolute",
    bottom: verticalScale(SPACING.xxxl + 80),
    right: scale(SPACING.large),
  },
  mapControlButton: {
    width: scale(45),
    height: scale(45),
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.light,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    marginBottom: verticalScale(SPACING.medium),
  },
  layersButton: {
    marginBottom: 0,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: scale(35),
    height: scale(35),
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.light,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statusPanel: {
    backgroundColor: COLORS.light,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: scale(SPACING.large),
    paddingTop: verticalScale(SPACING.xl),
    paddingBottom: verticalScale(SPACING.large),
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minHeight: verticalScale(120),
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(SPACING.medium),
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIndicator: {
    width: scale(12),
    height: scale(12),
    borderRadius: RADIUS.round,
    marginRight: scale(SPACING.medium),
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: moderateScale(SIZES.large),
    fontWeight: WEIGHTS.semiBold,
    color: COLORS.dark,
  },
  statusSubtext: {
    fontSize: moderateScale(SIZES.small),
    fontWeight: WEIGHTS.regular,
    color: COLORS.gray,
    marginTop: verticalScale(2),
  },
  dutyButton: {
    paddingHorizontal: scale(SPACING.xl),
    paddingVertical: verticalScale(SPACING.medium),
    borderRadius: RADIUS.large,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: scale(100),
  },
  dutyButtonText: {
    color: COLORS.light,
    fontSize: moderateScale(SIZES.medium),
    fontWeight: WEIGHTS.bold,
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: verticalScale(SPACING.medium),
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  vehicleText: {
    fontSize: moderateScale(SIZES.small),
    color: COLORS.gray,
    marginLeft: scale(SPACING.small),
    fontWeight: WEIGHTS.medium,
  },
  errorContainer: {
    position: "absolute",
    top: verticalScale(SPACING.large),
    left: scale(SPACING.large),
    right: scale(SPACING.large),
    backgroundColor: COLORS.danger,
    padding: scale(SPACING.medium),
    borderRadius: RADIUS.medium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 5,
  },
  errorText: {
    color: COLORS.light,
    fontSize: moderateScale(SIZES.small),
    flex: 1,
    fontWeight: WEIGHTS.medium,
  },
  retryText: {
    color: COLORS.light,
    fontSize: moderateScale(SIZES.small),
    fontWeight: WEIGHTS.bold,
    textDecorationLine: "underline",
  },
})
