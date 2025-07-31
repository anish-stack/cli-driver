
import { useState, useRef, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import { useNavigation } from "@react-navigation/native"
import { useSelector } from "react-redux"
import { ICONS } from "../../../constant/ui"
import { useFetchUserDetails, useGetAllDetails } from "../../hooks/RiderDetailsHooks"
import axios from "axios"

const { width, height } = Dimensions.get("window")


interface HeaderProps {
  isShown?: boolean
  onLocationPress?: () => void
  currentLocation?: string
}

export default function UberHeader({
  isShown = true,
  onLocationPress,
  currentLocation = "Current Location",
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // const navigation = useNavigation()
  const { userData, fetchUserDetails } = useFetchUserDetails()
  const { allUserData ,getAllDetails:refetch } = useGetAllDetails()
  const { isAuthenticated} = useSelector((state: any) => state.login)
  const [address, setAddress] = useState('');

  const menuAnimation = useRef(new Animated.Value(0)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current
  const menuButtonRotation = useRef(new Animated.Value(0)).current

  const navigationItems = [
    {
      id: "trips",
      label: "Your trips",
      icon: ICONS.history,
      route: "/trips",
      description: "View your ride history",
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: ICONS.wallet,
      route: "/wallet",
      description: "Manage payments & earnings",
    },
    {
      id: "driver",
      label: "Drive & earn",
      icon: ICONS.driver,
      route: "/driver",
      description: "Start earning with Olyox",
    },
    {
      id: "help",
      label: "Help",
      icon: ICONS.help,
      route: "/help",
      description: "Get support & answers",
    },
    {
      id: "settings",
      label: "Settings",
      icon: ICONS.layers,
      route: "/settings",
      description: "Account & app preferences",
    },
  ]

  const toggleMenu = () => {
    const newState = !isMenuOpen
    setIsMenuOpen(newState)

    if (newState) {
      Animated.parallel([
        Animated.spring(menuAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuButtonRotation, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(menuAnimation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuButtonRotation, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const handleNavigation = (route: string) => {
    console.log("Navigate to:", route)
    toggleMenu()
  }


const fetchLocationAddress = useCallback(async () => {
  try {
    const latitude = currentLocation?.latitude ?? allUserData?.location?.[1];
    const longitude = currentLocation?.longitude ?? allUserData?.location?.[0];

    if (!latitude || !longitude) {
      setAddress("Location not available");
      return;
    }

    const response = await axios.post(`https://www.appv2.olyox.com/Fetch-Current-Location`, {
      lat: latitude,
      lng: longitude,
    });

    const fetchedAddress = response?.data?.data?.address;

    setAddress(fetchedAddress || `${latitude}, ${longitude}`);
  } catch (error) {
    console.error("Failed to fetch address:", error);
    const fallbackLat = currentLocation?.latitude ?? "Unknown";
    const fallbackLng = currentLocation?.longitude ?? "Unknown";
    setAddress(`${fallbackLat}, ${fallbackLng}`);
  }
}, [currentLocation, allUserData]);

  useEffect(() => {
    if (currentLocation) {
      fetchLocationAddress();
    }
  }, [currentLocation, fetchLocationAddress]);



  useEffect(() => {
   
    refetch()
    fetchUserDetails().catch((error) => {
      console.error("Error fetching user details:", error)
    })
  }, [fetchUserDetails])

  // Animated styles
  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.85, 0],
  })

  const menuButtonRotate = menuButtonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  })

  if (!isShown) return null

  return (
    <>

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* Menu Button */}
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ rotate: menuButtonRotate }] }}>
              <Image source={ICONS.menu} style={styles.menuIcon} resizeMode="contain" />
            </Animated.View>
          </TouchableOpacity>

          {/* Location Section */}
          <TouchableOpacity style={styles.locationSection} onPress={onLocationPress} activeOpacity={0.8}>
            <View style={styles.locationContent}>
              <Image source={ICONS.pin} style={styles.pinIcon} resizeMode="contain" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Current Location</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {address?.completeAddress || "Fetching location..."}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.8}>
            <View style={styles.profileAvatar}>
              {isAuthenticated && userData?.documents?.profile ? (
                <Image source={{ uri: userData?.documents?.profile }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{userData?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
        pointerEvents={isMenuOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.overlayTouchable} onPress={toggleMenu} activeOpacity={1} />
      </Animated.View>

      {/* Side Menu */}
      <Animated.View
        style={[
          styles.sideMenu,
          {
            transform: [{ translateX: menuTranslateX }],
          },
        ]}
      >
        <SafeAreaView style={styles.menuContainer}>
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <View style={styles.userSection}>
              <View style={styles.userAvatar}>
                {isAuthenticated && userData?.documents ? (
                  <Image source={{ uri: userData?.documents?.profile }} style={styles.userAvatarImage} />
                ) : (
                  <Text style={styles.userAvatarText}>{userData?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userData?.name || "Guest User"}</Text>
                <Text style={styles.userRating}>★ {allUserData?.averageRating || 0}</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
            {navigationItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <Image source={item.icon} style={styles.menuItemIcon} resizeMode="contain" />
                  <View style={styles.menuItemTextContainer}>
                    <Text style={styles.menuItemTitle}>{item.label}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* Logout Section */}
            {isAuthenticated && (
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={() => handleNavigation("/logout")}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <View style={styles.logoutIcon}>
                    <Text style={styles.logoutIconText}>⏻</Text>
                  </View>
                  <View style={styles.menuItemTextContainer}>
                    <Text style={[styles.menuItemTitle, styles.logoutText]}>Sign out</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Menu Footer */}
          <View style={styles.menuFooter}>
            <Text style={styles.footerText}>Do more with your account</Text>
            <Text style={styles.footerSubtext}>Olyox Driver v2.0.1</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: "#ffffff",
    minHeight: verticalScale(56),
  },
  menuButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#f6f6f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  menuIcon: {
    width: scale(20),
    height: scale(20),
    tintColor: "#000000",
  },
  locationSection: {
    flex: 1,
    marginRight: scale(12),
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
  },
  pinIcon: {
    width: scale(16),
    height: scale(16),
    tintColor: "#000000",
    marginRight: scale(8),
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: moderateScale(11),
    color: "#8e8e93",
    fontWeight: "500",
    marginBottom: verticalScale(1),
  },
  locationText: {
    fontSize: moderateScale(14),
    color: "#000000",
    fontWeight: "600",
  },
  profileButton: {
    width: scale(40),
    height: scale(40),
  },
  profileAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
  },
  avatarText: {
    fontSize: moderateScale(16),
    color: "#ffffff",
    fontWeight: "600",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    zIndex: 998,
  },
  overlayTouchable: {
    flex: 1,
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.85,
    backgroundColor: "#ffffff",
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  menuContainer: {
    flex: 1,
  },
  menuHeader: {
    backgroundColor: "#f8f8f8",
    paddingTop: verticalScale(20),
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
  userAvatar: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(16),
  },
  userAvatarImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
  },
  userAvatarText: {
    fontSize: moderateScale(24),
    color: "#ffffff",
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(20),
    color: "#000000",
    fontWeight: "600",
    marginBottom: verticalScale(4),
  },
  userRating: {
    fontSize: moderateScale(14),
    color: "#8e8e93",
    fontWeight: "500",
  },
  menuContent: {
    flex: 1,
    paddingTop: verticalScale(8),
  },
  menuItem: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemIcon: {
    width: scale(24),
    height: scale(24),
    tintColor: "#000000",
    marginRight: scale(16),
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: moderateScale(16),
    color: "#000000",
    fontWeight: "500",
    marginBottom: verticalScale(2),
  },
  menuItemDescription: {
    fontSize: moderateScale(12),
    color: "#8e8e93",
    fontWeight: "400",
  },
  logoutItem: {
    marginTop: verticalScale(20),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f0f0f0",
  },
  logoutIcon: {
    width: scale(24),
    height: scale(24),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(16),
  },
  logoutIconText: {
    fontSize: moderateScale(18),
    color: "#ff3b30",
  },
  logoutText: {
    color: "#ff3b30",
  },
  menuFooter: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#f8f8f8",
  },
  footerText: {
    fontSize: moderateScale(14),
    color: "#000000",
    fontWeight: "500",
    marginBottom: verticalScale(4),
  },
  footerSubtext: {
    fontSize: moderateScale(12),
    color: "#8e8e93",
    fontWeight: "400",
  },
})
