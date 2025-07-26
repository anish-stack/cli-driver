"use client"

import { useEffect, useState, useCallback, useMemo, memo } from "react"
import { View, Text, PermissionsAndroid, Platform, NativeModules, StyleSheet, ActivityIndicator } from "react-native"
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from "react-native-maps"

const { LocationModule } = NativeModules

// Demo data for testing
const DEMO_DATA = {
  driverLocation: {
    latitude: 28.6139,
    longitude: 77.209,
  },
  pickupLocation: {
    latitude: 28.6129,
    longitude: 77.2295,
    address: "Connaught Place, New Delhi",
  },
  dropLocation: {
    latitude: 28.5355,
    longitude: 77.391,
    address: "Noida Sector 62",
  },
  routeCoordinates: [
    { latitude: 28.6139, longitude: 77.209 },
    { latitude: 28.6135, longitude: 77.215 },
    { latitude: 28.613, longitude: 77.22 },
    { latitude: 28.6129, longitude: 77.2295 },
    { latitude: 28.61, longitude: 77.24 },
    { latitude: 28.6, longitude: 77.28 },
    { latitude: 28.58, longitude: 77.32 },
    { latitude: 28.56, longitude: 77.36 },
    { latitude: 28.5355, longitude: 77.391 },
  ],
  // Route from driver to pickup
  driverToPickupRoute: [
    { latitude: 28.6139, longitude: 77.209 },
    { latitude: 28.6135, longitude: 77.215 },
    { latitude: 28.613, longitude: 77.22 },
    { latitude: 28.6129, longitude: 77.2295 },
  ],
  // Route from pickup to drop
  pickupToDropRoute: [
    { latitude: 28.6129, longitude: 77.2295 },
    { latitude: 28.61, longitude: 77.24 },
    { latitude: 28.6, longitude: 77.28 },
    { latitude: 28.58, longitude: 77.32 },
    { latitude: 28.56, longitude: 77.36 },
    { latitude: 28.5355, longitude: 77.391 },
  ],
}

interface Location {
  latitude: number
  longitude: number
  address?: string
}

interface MapProps {
  rideStarted?: boolean
  pickupLocation?: Location
  dropLocation?: Location
  rideStatus?: "pending" | "accepted" | "started" | "user-pickup" | "completed"
  useDemo?: boolean
}

const Map = memo(
  ({ rideStarted = false, pickupLocation, dropLocation, rideStatus = "pending", useDemo = false }: MapProps) => {
    const [driverCurrentLocation, setDriverCurrentLocation] = useState<Location>({
      latitude: 0,
      longitude: 0,
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [searchRadius, setSearchRadius] = useState(400)

    // Memoized map style for black and white theme
    const mapStyle = useMemo(
      () => [
        {
          elementType: "geometry",
          stylers: [{ color: "#f8f9fa" }],
        },
        {
          elementType: "labels.icon",
          stylers: [{ visibility: "off" }],
        },
        {
          elementType: "labels.text.fill",
          stylers: [{ color: "#343a40" }],
        },
        {
          elementType: "labels.text.stroke",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "administrative.land_parcel",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6c757d" }],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [{ color: "#e9ecef" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#495057" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#d4edda" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#155724" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "road.arterial",
          elementType: "labels.text.fill",
          stylers: [{ color: "#495057" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#dee2e6" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#343a40" }],
        },
        {
          featureType: "road.local",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6c757d" }],
        },
        {
          featureType: "transit.line",
          elementType: "geometry",
          stylers: [{ color: "#ced4da" }],
        },
        {
          featureType: "transit.station",
          elementType: "geometry",
          stylers: [{ color: "#e9ecef" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#b3d4fc" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#495057" }],
        },
      ],
      [],
    )

    // Memoized locations based on demo toggle
    const locations = useMemo(() => {
      if (useDemo) {
        return {
          driver: DEMO_DATA.driverLocation,
          pickup: DEMO_DATA.pickupLocation,
          drop: DEMO_DATA.dropLocation,
          route: DEMO_DATA.routeCoordinates,
          driverToPickupRoute: DEMO_DATA.driverToPickupRoute,
          pickupToDropRoute: DEMO_DATA.pickupToDropRoute,
        }
      }
      return {
        driver: driverCurrentLocation,
        pickup: pickupLocation,
        drop: dropLocation,
        route: [],
        driverToPickupRoute: [],
        pickupToDropRoute: [],
      }
    }, [useDemo, driverCurrentLocation, pickupLocation, dropLocation])

    // Check if search circle should be shown
    const shouldShowSearchCircle = useMemo(() => {
      return !useDemo && !rideStarted && rideStatus === "pending" && locations.driver.latitude !== 0
    }, [useDemo, rideStarted, rideStatus, locations.driver.latitude])

    // Determine which markers to show based on ride status
    const markerVisibility = useMemo(() => {
      switch (rideStatus) {
        case "pending":
          return {
            showDriver: true,
            showPickup: false,
            showDrop: false,
          }
        case "accepted":
          return {
            showDriver: true,
            showPickup: false,
            showDrop: false,
          }
        case "started":
          return {
            showDriver: true,
            showPickup: true,
            showDrop: false,
          }
        case "user-pickup":
          return {
            showDriver: true,
            showPickup: true,
            showDrop: true,
          }
        case "completed":
          return {
            showDriver: true,
            showPickup: true,
            showDrop: true,
          }
        default:
          return {
            showDriver: true,
            showPickup: false,
            showDrop: false,
          }
      }
    }, [rideStatus])

    // Determine which route to show based on ride status
    const routeToShow = useMemo(() => {
      switch (rideStatus) {
        case "started":
          // Show route from driver to pickup
          return useDemo ? locations.driverToPickupRoute : []
        case "user-pickup":
          // Show route from pickup to drop
          return useDemo ? locations.pickupToDropRoute : []
        case "completed":
          // Show full route
          return useDemo ? locations.route : []
        default:
          return []
      }
    }, [rideStatus, useDemo, locations])

    // Calculate map region to fit all visible markers
    const mapRegion = useMemo(() => {
      const { driver, pickup, drop } = locations

      if (!driver.latitude && !pickup?.latitude) {
        return {
          latitude: 28.6139,
          longitude: 77.209,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      }

      const coordinates = []

      // Always include driver location if available
      if (driver.latitude !== 0) {
        coordinates.push(driver)
      }

      // Include pickup if it should be shown
      if (pickup && markerVisibility.showPickup) {
        coordinates.push(pickup)
      }

      // Include drop if it should be shown
      if (drop && markerVisibility.showDrop) {
        coordinates.push(drop)
      }

      const latitudes = coordinates.map((coord) => coord.latitude).filter(Boolean)
      const longitudes = coordinates.map((coord) => coord.longitude).filter(Boolean)

      if (latitudes.length === 0) {
        return {
          latitude: 28.6139,
          longitude: 77.209,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      }

      const minLat = Math.min(...latitudes)
      const maxLat = Math.max(...latitudes)
      const minLng = Math.min(...longitudes)
      const maxLng = Math.max(...longitudes)

      let latDelta = (maxLat - minLat) * 1.5 || 0.01
      let lngDelta = (maxLng - minLng) * 1.5 || 0.01

      // If showing search circle, ensure the region includes the circle
      if (shouldShowSearchCircle) {
        const circleLatDelta = (searchRadius / 111000) * 2
        const circleLngDelta = (searchRadius / (111000 * Math.cos((driver.latitude * Math.PI) / 180))) * 2
        latDelta = Math.max(latDelta, circleLatDelta)
        lngDelta = Math.max(lngDelta, circleLngDelta)
      }

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      }
    }, [locations, shouldShowSearchCircle, searchRadius, markerVisibility])

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
        } catch (err) {
          console.warn(err)
          return false
        }
      }
      return true
    }, [])

    const fetchLocation = useCallback(async () => {
      if (useDemo) {
        setDriverCurrentLocation(DEMO_DATA.driverLocation)
        setLoading(false)
        return
      }

      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        setError("Location permission denied")
        setLoading(false)
        return
      }

      try {
        if (LocationModule?.getCurrentLocation) {
          LocationModule.getCurrentLocation(
            (lat: number, lng: number) => {
              setDriverCurrentLocation({ latitude: lat, longitude: lng })
              setLoading(false)
              setError("")
            },
            (err: string) => {
              setError(err || "Failed to get location")
              setLoading(false)
            },
          )
        } else {
          setError("Location module not available")
          setLoading(false)
        }
      } catch (e) {
        setError("Failed to get location: " + (e as Error).message)
        setLoading(false)
      }
    }, [useDemo, requestLocationPermission])

    useEffect(() => {
      fetchLocation()
    }, [fetchLocation])

    // Render loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>{useDemo ? "Loading demo map..." : "Getting your location..."}</Text>
        </View>
      )
    }

    // Render error state
    if (error && !useDemo) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubText}>Please check your location settings</Text>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          customMapStyle={mapStyle}
          region={mapRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {/* Search Circle - Show when searching for rides */}
          {shouldShowSearchCircle && (
            <Circle
              center={locations.driver}
              radius={searchRadius}
              strokeColor="rgba(0, 150, 255, 0.8)"
              strokeWidth={2}
              fillColor="rgba(0, 150, 255, 0.1)"
            />
          )}

          {/* Driver Location Marker - Always show when available */}
          {locations.driver.latitude !== 0 && (
            <Marker coordinate={locations.driver} title="Driver" description="Current location" pinColor="#000" />
          )}

          {/* Pickup Location Marker - Show based on ride status */}
          {locations.pickup && markerVisibility.showPickup && (
            <Marker
              coordinate={locations.pickup}
              title="Pickup"
              description={locations.pickup.address || "Pickup location"}
              pinColor="#4CAF50"
            />
          )}

          {/* Drop Location Marker - Show based on ride status */}
          {locations.drop && markerVisibility.showDrop && (
            <Marker
              coordinate={locations.drop}
              title="Drop"
              description={locations.drop.address || "Drop location"}
              pinColor="#F44336"
            />
          )}

          {/* Route Polyline - Show based on ride status */}
          {routeToShow.length > 0 && (
            <Polyline coordinates={routeToShow} strokeColor="#000" strokeWidth={4} strokePattern={[1]} />
          )}
        </MapView>

        {/* Ride Status */}
        {rideStatus !== "pending" && (
          <View style={styles.rideStatusContainer}>
            <Text style={styles.rideStatusText}>
              {rideStatus === "user-pickup"
                ? "En Route to Drop"
                : rideStatus.charAt(0).toUpperCase() + rideStatus.slice(1)}
            </Text>
          </View>
        )}

        {/* Route Info */}
        {routeToShow.length > 0 && (
          <View style={styles.routeInfoContainer}>
            <Text style={styles.routeInfoText}>
              {rideStatus === "started" && "Heading to pickup location"}
              {rideStatus === "user-pickup" && "Heading to drop location"}
              {rideStatus === "completed" && "Trip completed"}
            </Text>
          </View>
        )}
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#F44336",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  map: {
    flex: 1,
  },
  rideStatusContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideStatusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  routeInfoContainer: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeInfoText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },
})

Map.displayName = "Map"

export default Map
