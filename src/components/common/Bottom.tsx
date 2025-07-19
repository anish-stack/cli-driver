
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Vibration,
  Animated,
  ActivityIndicator,
} from "react-native"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ICONS } from "../../../constant/ui"
import { useSelector, useDispatch } from "react-redux"
import { toggleDutyStatus } from "../../../Store/slices/dutySlice"
import { useFetchUserDetails } from "../../hooks/RiderDetailsHooks"

const { width, height } = Dimensions.get("window")
const isSmallDevice = width < 375
const isTablet = width > 768

export default function Bottom() {
  return (
    <View>
      <Text>Bottom</Text>
    </View>
  )
}