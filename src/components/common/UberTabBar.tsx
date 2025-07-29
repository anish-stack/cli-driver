"use client"

import type React from "react"
import { View, StyleSheet } from "react-native"
import UberHeader from "./Header"
import UberBottom from "./Bottom"
import { SafeAreaView } from "react-native-safe-area-context"


interface OlyoxTabBarProps {
  children: React.ReactNode
  currentLocation?: string
  isDriverMode?: boolean
  isBottomShow?: boolean
  activeTab?: string
  activeRide?: {
    isActive: boolean
    rideType: "pickup" | "dropoff" | "waiting" | "arrived"
    estimatedTime?: string
    driverName?: string
    passengerName?: string
  }
  onTabPress?: (tabId: string, route: string) => void
  onLocationPress?: () => void
}

export default function OlyoxTabBar({
  children,
  isBottomShow = true,
  currentLocation = "Current Location",
  isDriverMode = false,
  activeTab = "home",
  activeRide,
  onTabPress,
  toggle,
  onLocationPress,
}: OlyoxTabBarProps) {


  const handleTabPress = (tabId: string, route: string) => {
 
    onTabPress?.(tabId, route)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>

        <UberHeader currentLocation={currentLocation} onLocationPress={onLocationPress} />


        <View style={styles.content}>{children}</View>


        <UberBottom
          activeTab={activeTab}
          isDutyToggleShow={isBottomShow}
          isDriverMode={isDriverMode}
          activeRide={activeRide}
          isOnline={isDriverMode}
          onToggleStatus={toggle}
          onTabPress={handleTabPress}
        />


      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  content: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
})
